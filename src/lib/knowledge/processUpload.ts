/**
 * Process Uploaded Conversations
 * 
 * Handles the full pipeline of processing uploaded ChatGPT conversations:
 * 1. Parse conversations
 * 2. Send to Supabase Edge Function for processing
 * 3. Edge Function handles: summarization, embedding, graph building, and storage
 * 
 * This now uses centralized OpenAI API key stored in Supabase secrets.
 * 
 * @module processUpload
 */

import { parseConversations } from './conversationParser';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingProgress {
  stage: 'parsing' | 'summarizing' | 'embedding' | 'graphing' | 'storing' | 'complete';
  progress: number;
  message: string;
  error?: string;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

/**
 * Process uploaded conversations via Supabase Edge Function
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
      progress: 20,
      message: `Found ${conversations.length} conversations`,
    });

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Stage 2: Send to Edge Function for processing
    onProgress?.({
      stage: 'summarizing',
      progress: 30,
      message: 'Processing conversations with AI...',
    });

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('process-knowledge-graph', {
      body: { conversations },
    });

    if (error) {
      throw new Error(error.message || 'Failed to process conversations');
    }

    if (!data?.success) {
      throw new Error('Processing failed on server');
    }

    onProgress?.({
      stage: 'embedding',
      progress: 60,
      message: 'Generating embeddings...',
    });

    onProgress?.({
      stage: 'graphing',
      progress: 75,
      message: 'Building knowledge graph...',
    });

    onProgress?.({
      stage: 'storing',
      progress: 90,
      message: 'Saving to database...',
    });

    // Complete!
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: `Knowledge graph created successfully! Processed ${data.processed} conversations.`,
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

