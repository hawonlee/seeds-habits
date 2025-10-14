import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// Conversation parsing types and functions (moved from client to avoid blocking browser)
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ParsedConversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

interface ConversationNode {
  id: string;
  message: {
    id: string;
    author: {
      role: string;
    };
    content: {
      content_type: string;
      parts: string[];
    };
    create_time: number | null;
  } | null;
  children: string[];
}

interface RawConversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ConversationNode>;
}

/**
 * Parse conversations on server to avoid blocking browser
 */
function parseConversations(jsonData: RawConversation[]): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];

  for (const conv of jsonData) {
    try {
      const messages = extractMessages(conv.mapping);
      
      if (messages.length === 0) {
        continue;
      }

      conversations.push({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        timestamp: new Date(conv.create_time * 1000).toISOString(),
        messages,
      });
    } catch (error) {
      console.error(`Error parsing conversation ${conv.id}:`, error);
    }
  }

  return conversations;
}

function extractMessages(mapping: Record<string, ConversationNode>): Message[] {
  const messages: Message[] = [];
  
  const rootNode = Object.values(mapping).find(
    node => node.id === 'client-created-root' || node.message === null
  );
  
  if (!rootNode) {
    return messages;
  }

  const visited = new Set<string>();
  
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = mapping[nodeId];
    if (!node) return;

    if (node.message?.content?.parts && Array.isArray(node.message.content.parts)) {
      const role = node.message.author?.role;
      const content = node.message.content.parts.join('\n').trim();
      
      if ((role === 'user' || role === 'assistant') && content) {
        messages.push({
          role: role as 'user' | 'assistant',
          content,
          timestamp: node.message.create_time || undefined,
        });
      }
    }

    if (node.children && node.children.length > 0) {
      traverse(node.children[0]);
    }
  }

  traverse(rootNode.id);
  return messages;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
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
    const { conversationsJson } = await req.json()
    
    if (!conversationsJson || typeof conversationsJson !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body: expected conversationsJson string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON on server to avoid blocking client browser
    let rawConversations: any[];
    try {
      rawConversations = JSON.parse(conversationsJson);
      if (!Array.isArray(rawConversations)) {
        throw new Error('Expected array of conversations');
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format', details: e.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse conversation structure (extract messages from nested format)
    const conversations = parseConversations(rawConversations)
    
    if (conversations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid conversations found in file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI with secret key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured in Supabase secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${conversations.length} conversations...`)

    // Process conversations using fetch API directly
    const processedConversations = []
    
    for (const conv of conversations) {
      try {
        // Summarize conversation
        const messages = conv.messages || []
        const conversationText = messages
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n\n')

        // Call OpenAI chat completion API
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          }),
        })

        if (!summaryResponse.ok) {
          throw new Error(`OpenAI API error: ${summaryResponse.status}`)
        }

        const summaryData = await summaryResponse.json()
        const summaryText = summaryData.choices[0]?.message?.content || 'No summary available'
        const title = conv.title || `Conversation ${conv.id}`

        // Generate embedding
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-large',
            input: summaryText,
          }),
        })

        if (!embeddingResponse.ok) {
          throw new Error(`OpenAI Embeddings API error: ${embeddingResponse.status}`)
        }

        const embeddingData = await embeddingResponse.json()

        processedConversations.push({
          conversation_id: conv.id,
          title,
          summary: summaryText,
          embedding: embeddingData.data[0].embedding,
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Check Edge Function logs for more information'
      }),
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

