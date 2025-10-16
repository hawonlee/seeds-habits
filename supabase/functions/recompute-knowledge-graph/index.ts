import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    console.log(`Recomputing graph for user ${user.id}`)

    // Fetch all nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('lkg_nodes')
      .select('id, conversation_id, embedding')
      .eq('user_id', user.id)

    if (nodesError) throw nodesError
    if (!nodes || nodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No nodes found for user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${nodes.length} nodes`)

    // Check if recompute needed (hybrid strategy)
    const { data: lastRecompute } = await supabase
      .from('lkg_recompute_metadata')
      .select('node_count_at_recompute')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastRecompute) {
      const growthRate = (nodes.length - lastRecompute.node_count_at_recompute) / lastRecompute.node_count_at_recompute
      if (growthRate < 0.2) {
        return new Response(
          JSON.stringify({ 
            skipped: true, 
            message: `Skipped: Only ${(growthRate * 100).toFixed(0)}% growth since last recompute. Need >20% growth.`,
            currentNodes: nodes.length,
            lastRecomputeNodes: lastRecompute.node_count_at_recompute
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Compute kNN edges (k=5, threshold=0.25)
    console.log('Computing kNN edges...')
    const edges = computeKNNEdges(nodes, 5, 0.25)
    console.log(`Computed ${edges.length} edges`)

    // Delete old edges
    const { error: deleteError } = await supabase
      .from('lkg_edges')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // Insert new edges
    const { error: insertError } = await supabase
      .from('lkg_edges')
      .insert(edges.map(e => ({
        user_id: user.id,
        source_id: e.sourceId,
        target_id: e.targetId,
        similarity: e.weight,
      })))

    if (insertError) throw insertError

    // Record recompute metadata
    const { error: metadataError } = await supabase
      .from('lkg_recompute_metadata')
      .insert({
        user_id: user.id,
        node_count_at_recompute: nodes.length,
        edges_created: edges.length,
        umap_computed: false, // Will be updated after local UMAP run
      })

    if (metadataError) throw metadataError

    return new Response(
      JSON.stringify({ 
        success: true,
        nodesProcessed: nodes.length,
        edgesCreated: edges.length,
        message: 'Graph recomputed. Run local UMAP script to update positions.',
        nextStep: 'See docs/knowledge-graph/UMAP_GUIDE.md for running UMAP locally'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Recompute error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// kNN edge computation (same as client-side but on server)
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

function computeKNNEdges(
  nodes: Array<{ id: string; embedding: number[] }>,
  k: number,
  threshold: number
): Array<{ sourceId: string; targetId: string; weight: number }> {
  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    const similarities = []
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue
      const sim = cosineSimilarity(nodes[i].embedding, nodes[j].embedding)
      if (sim >= threshold) {
        similarities.push({ idx: j, similarity: sim })
      }
    }
    similarities.sort((a, b) => b.similarity - a.similarity)
    for (const neighbor of similarities.slice(0, k)) {
      edges.push({
        sourceId: nodes[i].id,
        targetId: nodes[neighbor.idx].id,
        weight: neighbor.similarity,
      })
    }
  }
  return edges
}

