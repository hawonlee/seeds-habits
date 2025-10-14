/**
 * Process Uploaded Conversations
 * 
 * Handles the full pipeline of processing uploaded ChatGPT conversations:
 * 1. Lightweight validation on client
 * 2. Send RAW JSON string to Supabase Edge Function
 * 3. Edge Function handles ALL parsing, summarization, embedding, and graph building
 * 
 * This architecture avoids blocking the browser's main thread with heavy compute.
 * All parsing and AI processing happens server-side.
 * 
 * @module processUpload
 */

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
    // Stage 1: Validate JSON format (lightweight check)
    onProgress?.({
      stage: 'parsing',
      progress: 10,
      message: 'Validating file format...',
    });

    // Quick validation without full parse (just check if it's valid JSON structure)
    try {
      const firstChar = conversationsJson.trim()[0];
      if (firstChar !== '[' && firstChar !== '{') {
        throw new Error('Invalid JSON format');
      }
    } catch (e) {
      throw new Error('Invalid JSON file. Please export your ChatGPT conversations as JSON.');
    }

    onProgress?.({
      stage: 'parsing',
      progress: 15,
      message: 'Uploading to server...',
    });

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Stage 2: Send RAW JSON string to Edge Function
    // Server will handle all parsing to avoid blocking the browser
    onProgress?.({
      stage: 'summarizing',
      progress: 25,
      message: 'Processing conversations with AI...',
    });

    // Call Supabase Edge Function with raw JSON string
    const { data, error } = await supabase.functions.invoke('process-knowledge-graph', {
      body: { conversationsJson }, // Send raw string, not parsed array
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

