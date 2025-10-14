import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { conversations } = await req.json()
    
    if (!conversations || !Array.isArray(conversations)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI with secret key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Process conversations
    const processedConversations = []
    
    for (const conv of conversations) {
      try {
        // Summarize conversation
        const messages = conv.messages || []
        const conversationText = messages
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n\n')

        const summary = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Summarize this conversation, focusing on key learnings, insights, and knowledge gained. Be concise but comprehensive.'
            },
            {
              role: 'user',
              content: conversationText.slice(0, 8000) // Limit to avoid token limits
            }
          ],
          max_tokens: 300,
        })

        const summaryText = summary.choices[0]?.message?.content || 'No summary available'
        const title = conv.title || `Conversation ${conv.id}`

        // Generate embedding
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: summaryText,
        })

        processedConversations.push({
          conversation_id: conv.id,
          title,
          summary: summaryText,
          embedding: embedding.data[0].embedding,
          timestamp: conv.timestamp || new Date().toISOString(),
          message_count: messages.length,
        })
      } catch (error) {
        console.error(`Failed to process conversation ${conv.id}:`, error)
        // Continue with other conversations
      }
    }

    if (processedConversations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to process any conversations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build kNN graph (k=5 neighbors)
    const edges = []
    for (let i = 0; i < processedConversations.length; i++) {
      const node = processedConversations[i]
      const distances: Array<{ index: number; distance: number }> = []
      
      for (let j = 0; j < processedConversations.length; j++) {
        if (i === j) continue
        
        const otherNode = processedConversations[j]
        const similarity = cosineSimilarity(node.embedding, otherNode.embedding)
        distances.push({ index: j, distance: 1 - similarity })
      }
      
      // Get k nearest neighbors
      distances.sort((a, b) => a.distance - b.distance)
      const k = Math.min(5, distances.length)
      
      for (let j = 0; j < k; j++) {
        const neighbor = distances[j]
        edges.push({
          source: node.conversation_id,
          target: processedConversations[neighbor.index].conversation_id,
          weight: 1 - neighbor.distance, // Convert back to similarity
        })
      }
    }

    // Delete existing user data
    await supabase
      .from('lkg_nodes')
      .delete()
      .eq('user_id', user.id)

    await supabase
      .from('lkg_edges')
      .delete()
      .eq('user_id', user.id)

    // Insert nodes
    const nodesToInsert = processedConversations.map(conv => ({
      user_id: user.id,
      conversation_id: conv.conversation_id,
      title: conv.title,
      summary: conv.summary,
      embedding: conv.embedding,
      timestamp: conv.timestamp,
      metadata: { message_count: conv.message_count },
    }))

    const { data: insertedNodes, error: nodesError } = await supabase
      .from('lkg_nodes')
      .insert(nodesToInsert)
      .select('id, conversation_id')

    if (nodesError) {
      throw new Error(`Failed to insert nodes: ${nodesError.message}`)
    }

    // Create ID mapping
    const idMap = new Map<string, string>()
    insertedNodes.forEach((node: any) => {
      idMap.set(node.conversation_id, node.id)
    })

    // Insert edges
    const edgesToInsert = edges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        user_id: user.id,
        source_id: idMap.get(edge.source)!,
        target_id: idMap.get(edge.target)!,
        weight: edge.weight,
      }))

    const { error: edgesError } = await supabase
      .from('lkg_edges')
      .insert(edgesToInsert)

    if (edgesError) {
      throw new Error(`Failed to insert edges: ${edgesError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedConversations.length,
        nodes: insertedNodes.length,
        edges: edgesToInsert.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing knowledge graph:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

