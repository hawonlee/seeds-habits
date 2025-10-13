/**
 * React Query hooks for LKG data
 * 
 * This module provides React Query hooks for fetching knowledge graph data from Supabase.
 * All queries are automatically cached and include error handling.
 * 
 * Features:
 * - Automatic caching (5 minutes default)
 * - Refetch on window focus
 * - Error handling with retry logic
 * - Type-safe data structures
 * 
 * @module queries
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Represents a conversation node in the knowledge graph
 */
export interface LKGNode {
  /** Database ID */
  id: string;
  /** Original ChatGPT conversation ID */
  conversation_id: string;
  /** Conversation title */
  title: string;
  /** AI-generated summary */
  summary: string;
  /** Creation timestamp (ISO string) */
  timestamp: string;
  /** UMAP x-coordinate for visualization (optional) */
  umap_x: number | null;
  /** UMAP y-coordinate for visualization (optional) */
  umap_y: number | null;
  /** Additional metadata */
  metadata: {
    /** Number of messages in conversation */
    message_count?: number;
  };
}

/**
 * Represents an edge connecting two nodes
 */
export interface LKGEdge {
  /** Database ID */
  id: string;
  /** Source node database ID */
  source_id: string;
  /** Target node database ID */
  target_id: string;
  /** Edge weight (cosine similarity, 0-1) */
  weight: number;
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  /** Array of conversation nodes */
  nodes: LKGNode[];
  /** Array of edges connecting nodes */
  edges: LKGEdge[];
}

/**
 * Fetch all LKG nodes for the current user
 * 
 * Returns all conversation nodes ordered by timestamp (oldest first).
 * Automatically filtered by user via RLS policies.
 * 
 * @returns React Query result with nodes array
 * 
 * @example
 * ```tsx
 * const { data: nodes, isLoading, error } = useLKGNodes();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * 
 * return <div>{nodes.length} conversations</div>;
 * ```
 */
export function useLKGNodes() {
  return useQuery({
    queryKey: ['lkg-nodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lkg_nodes')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      return data as LKGNode[];
    },
  });
}

/**
 * Fetch all LKG edges for the current user
 * 
 * Returns all graph edges (semantic relationships between conversations).
 * Automatically filtered by user via RLS policies.
 * 
 * @returns React Query result with edges array
 * 
 * @example
 * ```tsx
 * const { data: edges, isLoading } = useLKGEdges();
 * console.log(`${edges.length} connections in graph`);
 * ```
 */
export function useLKGEdges() {
  return useQuery({
    queryKey: ['lkg-edges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lkg_edges')
        .select('*');

      if (error) {
        throw error;
      }

      return data as LKGEdge[];
    },
  });
}

/**
 * Fetch complete graph data (nodes + edges)
 * 
 * Convenience hook that combines nodes and edges queries.
 * Returns loading state if either query is loading.
 * 
 * @returns Combined query result with nodes and edges
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useLKGGraph();
 * 
 * if (isLoading) return <Spinner />;
 * 
 * return (
 *   <div>
 *     <Graph nodes={data.nodes} edges={data.edges} />
 *     <button onClick={refetch}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useLKGGraph() {
  const nodesQuery = useLKGNodes();
  const edgesQuery = useLKGEdges();

  return {
    data: {
      nodes: nodesQuery.data || [],
      edges: edgesQuery.data || [],
    } as GraphData,
    isLoading: nodesQuery.isLoading || edgesQuery.isLoading,
    error: nodesQuery.error || edgesQuery.error,
    refetch: () => {
      nodesQuery.refetch();
      edgesQuery.refetch();
    },
  };
}

/**
 * Fetch neighbors for a specific node
 * 
 * Returns all edges where the given node is the source, joined with target node data.
 * Results are ordered by similarity weight (highest first).
 * 
 * Query is disabled if nodeId is null (no node selected).
 * 
 * @param nodeId - Database ID of node to fetch neighbors for (null to disable)
 * @returns React Query result with neighbor edges and node data
 * 
 * @example
 * ```tsx
 * const [selectedNodeId, setSelectedNodeId] = useState(null);
 * const { data: neighbors } = useNodeNeighbors(selectedNodeId);
 * 
 * return (
 *   <div>
 *     {neighbors?.map(edge => (
 *       <div key={edge.id}>
 *         {edge.target.title} - {(edge.weight * 100).toFixed(0)}% similar
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useNodeNeighbors(nodeId: string | null) {
  return useQuery({
    queryKey: ['node-neighbors', nodeId],
    queryFn: async () => {
      if (!nodeId) return [];

      const { data, error } = await supabase
        .from('lkg_edges')
        .select('*, target:lkg_nodes!lkg_edges_target_id_fkey(id, title, summary)')
        .eq('source_id', nodeId)
        .order('weight', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!nodeId,
  });
}

