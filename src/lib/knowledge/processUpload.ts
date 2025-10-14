/**
 * Process Uploaded Conversations
 * 
 * Handles the full pipeline of processing uploaded ChatGPT conversations:
 * 1. Parse conversations
 * 2. Summarize and generate embeddings
 * 3. Build kNN graph
 * 4. Run UMAP projection (optional)
 * 5. Store in Supabase
 * 
 * This runs client-side with user's API key for privacy.
 * 
 * @module processUpload
 */

import { parseConversations } from './conversationParser';
import { processConversation } from './embeddingService';
import { buildKNNGraph } from './knnBuilder';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingProgress {
  stage: 'parsing' | 'summarizing' | 'embedding' | 'graphing' | 'storing' | 'complete';
  progress: number;
  message: string;
  error?: string;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

/**
 * Process uploaded conversations and store in Supabase
 */
export async function processUploadedConversations(
  conversationsJson: string,
  onProgress?: ProgressCallback
): Promise<void> {
  try {
    // Stage 1: Parse conversations
    onProgress?.({
      stage: 'parsing',
      progress: 10,
      message: 'Parsing conversations...',
    });

    const conversations = parseConversations(conversationsJson);
    
    if (conversations.length === 0) {
      throw new Error('No valid conversations found in the file');
    }

    onProgress?.({
      stage: 'parsing',
      progress: 15,
      message: `Found ${conversations.length} conversations`,
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Stage 2 & 3: Summarize and embed (combined)
    onProgress?.({
      stage: 'summarizing',
      progress: 20,
      message: 'Processing conversations with AI...',
    });

    const processedConversations = [];
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      
      try {
        const processed = await processConversation(conv);
        processedConversations.push({
          conversation: conv,
          ...processed,
        });

        const progress = 20 + ((i + 1) / conversations.length) * 40;
        onProgress?.({
          stage: i < conversations.length / 2 ? 'summarizing' : 'embedding',
          progress,
          message: `Processed ${i + 1} of ${conversations.length} conversations...`,
        });
      } catch (error) {
        console.error(`Failed to process conversation ${conv.id}:`, error);
        // Continue with other conversations
      }
    }

    if (processedConversations.length === 0) {
      throw new Error('Failed to process any conversations');
    }

    // Stage 4: Build kNN graph
    onProgress?.({
      stage: 'graphing',
      progress: 65,
      message: 'Building knowledge graph...',
    });

    const graphData = buildKNNGraph(
      processedConversations.map(p => ({
        id: p.conversation.id,
        embedding: p.embedding,
      })),
      5 // k=5 neighbors
    );

    onProgress?.({
      stage: 'graphing',
      progress: 75,
      message: 'Knowledge graph built',
    });

    // Stage 5: Store in Supabase
    onProgress?.({
      stage: 'storing',
      progress: 80,
      message: 'Saving to database...',
    });

    // Delete existing data for this user
    await supabase
      .from('lkg_nodes')
      .delete()
      .eq('user_id', user.id);

    await supabase
      .from('lkg_edges')
      .delete()
      .eq('user_id', user.id);

    // Insert nodes
    const nodesToInsert = processedConversations.map((p) => ({
      user_id: user.id,
      conversation_id: p.conversation.id,
      title: p.title,
      summary: p.summary,
      embedding: p.embedding,
      timestamp: p.conversation.timestamp,
      metadata: {
        message_count: p.conversation.messages.length,
      },
    }));

    const { data: insertedNodes, error: nodesError } = await supabase
      .from('lkg_nodes')
      .insert(nodesToInsert)
      .select('id, conversation_id');

    if (nodesError) {
      throw new Error(`Failed to insert nodes: ${nodesError.message}`);
    }

    onProgress?.({
      stage: 'storing',
      progress: 90,
      message: 'Saving connections...',
    });

    // Create conversation_id to database id mapping
    const idMap = new Map<string, string>();
    insertedNodes.forEach(node => {
      idMap.set(node.conversation_id, node.id);
    });

    // Insert edges
    const edgesToInsert = graphData.edges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        user_id: user.id,
        source_id: idMap.get(edge.source)!,
        target_id: idMap.get(edge.target)!,
        weight: edge.weight,
      }));

    const { error: edgesError } = await supabase
      .from('lkg_edges')
      .insert(edgesToInsert);

    if (edgesError) {
      throw new Error(`Failed to insert edges: ${edgesError.message}`);
    }

    // Complete!
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Knowledge graph created successfully!',
    });

  } catch (error) {
    onProgress?.({
      stage: 'parsing',
      progress: 0,
      message: 'Processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Check if user has any knowledge graph data
 */
export async function userHasKnowledgeGraph(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from('lkg_nodes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .limit(1);

  if (error) {
    console.error('Error checking for knowledge graph:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

