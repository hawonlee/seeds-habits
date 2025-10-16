/**
 * Recompute Knowledge Graph
 * 
 * Client-side interface for triggering global graph recomputation.
 * Calls the Edge Function to rebuild kNN edges across all user nodes.
 * 
 * @module recomputeGraph
 */

import { supabase } from '@/integrations/supabase/client';

export interface RecomputeProgress {
  stage: 'starting' | 'computing' | 'umap_needed' | 'complete' | 'skipped';
  progress: number;
  message: string;
  nextStep?: string;
}

export type RecomputeProgressCallback = (progress: RecomputeProgress) => void;

/**
 * Recompute knowledge graph edges globally
 * 
 * Invokes the Edge Function to:
 * 1. Fetch all user nodes
 * 2. Compute kNN graph across all nodes (not just 15-conversation batches)
 * 3. Update edges in database
 * 
 * After this completes, user should run local UMAP script to update node positions.
 * 
 * @param onProgress - Optional callback for progress updates
 * @throws Error if recomputation fails or user is not authenticated
 * 
 * @example
 * ```tsx
 * await recomputeKnowledgeGraph((progress) => {
 *   console.log(progress.message);
 *   if (progress.stage === 'umap_needed') {
 *     alert('Next: Run UMAP script locally');
 *   }
 * });
 * ```
 */
export async function recomputeKnowledgeGraph(
  onProgress?: RecomputeProgressCallback
): Promise<void> {
  try {
    onProgress?.({
      stage: 'starting',
      progress: 10,
      message: 'Starting global recomputation...',
    });

    const { data, error } = await supabase.functions.invoke('recompute-knowledge-graph', {
      body: {},
    });

    if (error) throw error;

    if (data.skipped) {
      onProgress?.({
        stage: 'skipped',
        progress: 100,
        message: data.message,
      });
      return;
    }

    if (!data.success) {
      throw new Error('Recomputation failed on server');
    }

    onProgress?.({
      stage: 'computing',
      progress: 60,
      message: `Processed ${data.nodesProcessed} nodes, created ${data.edgesCreated} edges`,
    });

    onProgress?.({
      stage: 'umap_needed',
      progress: 80,
      message: 'Graph updated! Now run UMAP locally to update positions.',
      nextStep: data.nextStep,
    });

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Recomputation complete!',
    });

  } catch (error) {
    throw error;
  }
}

