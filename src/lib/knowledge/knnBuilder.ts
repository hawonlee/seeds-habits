/**
 * kNN Graph Builder - Computes k-nearest neighbors using cosine similarity
 * 
 * This module constructs a sparse graph where each node is connected to its k most
 * similar neighbors. Similarity is computed using cosine similarity on embeddings.
 * 
 * Algorithm:
 * 1. For each node, compute cosine similarity with all other nodes
 * 2. Filter by similarity threshold
 * 3. Select top k neighbors
 * 4. Create weighted edges
 * 
 * Complexity: O(N² × D) where N = nodes, D = embedding dimension (3072)
 * 
 * @module knnBuilder
 */

/**
 * Represents a node in the graph with its embedding
 */
export interface GraphNode {
  /** Unique node identifier (conversation ID) */
  id: string;
  /** High-dimensional embedding vector */
  embedding: number[];
}

/**
 * Represents a weighted edge between two nodes
 */
export interface GraphEdge {
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Edge weight (cosine similarity, range [0, 1]) */
  weight: number;
}

/**
 * Compute cosine similarity between two vectors
 * 
 * Formula: cos(θ) = (a · b) / (||a|| × ||b||)
 * 
 * Returns value in range [-1, 1], but typically [0, 1] for embeddings.
 * Higher values indicate more similar vectors.
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity score
 * @throws Error if vectors have different dimensions
 * 
 * @example
 * ```typescript
 * const sim = cosineSimilarity([1, 0, 0], [1, 0, 0]);
 * console.log(sim); // 1.0 (identical)
 * 
 * const sim2 = cosineSimilarity([1, 0, 0], [0, 1, 0]);
 * console.log(sim2); // 0.0 (orthogonal)
 * ```
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Find k-nearest neighbors for a single node
 * 
 * Computes similarity with all other nodes, filters by threshold, and returns
 * the top k most similar nodes.
 * 
 * @param targetIdx - Index of target node in nodes array
 * @param nodes - Array of all graph nodes
 * @param k - Number of neighbors to find
 * @param threshold - Minimum similarity score (filters weak connections)
 * @returns Array of neighbor indices and similarity scores (sorted descending)
 * @private
 */
function findKNearestNeighbors(
  targetIdx: number,
  nodes: GraphNode[],
  k: number,
  threshold: number
): Array<{ idx: number; similarity: number }> {
  const similarities: Array<{ idx: number; similarity: number }> = [];

  const targetEmbedding = nodes[targetIdx].embedding;

  // Compute similarity with all other nodes
  for (let i = 0; i < nodes.length; i++) {
    if (i === targetIdx) continue;

    const similarity = cosineSimilarity(targetEmbedding, nodes[i].embedding);
    
    // Apply threshold filter
    if (similarity >= threshold) {
      similarities.push({ idx: i, similarity });
    }
  }

  // Sort by similarity (descending) and take top k
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities.slice(0, k);
}

/**
 * Build kNN graph from nodes
 * 
 * Creates a sparse graph where each node is connected to its k most similar neighbors.
 * Edges are only created if similarity ≥ threshold.
 * 
 * Performance: O(N² × D) where N = nodes, D = embedding dimension
 * - N=50: ~3-5 seconds
 * - N=1000: ~5-10 minutes
 * 
 * @param nodes - Array of graph nodes with embeddings
 * @param k - Number of nearest neighbors per node (default: 5)
 * @param threshold - Minimum cosine similarity for edges (default: 0.25)
 * @param onProgress - Optional callback for progress tracking
 * @returns Array of weighted edges connecting similar nodes
 * 
 * @example
 * ```typescript
 * const edges = buildKNNGraph(nodes, 5, 0.25, (done, total) => {
 *   console.log(`${done}/${total} nodes processed`);
 * });
 * console.log(`Generated ${edges.length} edges`);
 * ```
 */
export function buildKNNGraph(
  nodes: GraphNode[],
  k: number = 5,
  threshold: number = 0.25,
  onProgress?: (processed: number, total: number) => void
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  // Debug logging (disabled in production)
  // console.log(`Building kNN graph: k=${k}, threshold=${threshold}`);
  // console.log(`Processing ${nodes.length} nodes...`);

  for (let i = 0; i < nodes.length; i++) {
    const neighbors = findKNearestNeighbors(i, nodes, k, threshold);

    for (const neighbor of neighbors) {
      edges.push({
        sourceId: nodes[i].id,
        targetId: nodes[neighbor.idx].id,
        weight: neighbor.similarity,
      });
    }

    if (onProgress && (i + 1) % 10 === 0) {
      onProgress(i + 1, nodes.length);
    }
  }

  if (onProgress) {
    onProgress(nodes.length, nodes.length);
  }

  // Debug logging (disabled in production)
  // console.log(`Generated ${edges.length} edges`);
  // const avgDegree = edges.length / nodes.length;
  // console.log(`Average degree: ${avgDegree.toFixed(2)}`);

  return edges;
}

/**
 * Calculate graph statistics
 * 
 * Computes various metrics to understand graph structure:
 * - Node and edge counts
 * - Degree distribution (connections per node)
 * - Graph density (actual edges / max possible edges)
 * - Most connected nodes (hubs)
 * 
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns Object containing graph statistics
 * 
 * @example
 * ```typescript
 * const stats = calculateGraphStats(nodes, edges);
 * console.log(`Nodes: ${stats.nodeCount}`);
 * console.log(`Avg degree: ${stats.avgDegree.toFixed(2)}`);
 * console.log(`Density: ${(stats.density * 100).toFixed(2)}%`);
 * ```
 */
export function calculateGraphStats(nodes: GraphNode[], edges: GraphEdge[]): {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  minDegree: number;
  density: number;
  topNodes: Array<{ id: string; degree: number }>;
} {
  const degreeMap = new Map<string, number>();
  
  // Initialize all nodes with degree 0
  for (const node of nodes) {
    degreeMap.set(node.id, 0);
  }

  // Count degrees
  for (const edge of edges) {
    degreeMap.set(edge.sourceId, (degreeMap.get(edge.sourceId) || 0) + 1);
    // For undirected graph, also count target
    degreeMap.set(edge.targetId, (degreeMap.get(edge.targetId) || 0) + 1);
  }

  const degrees = Array.from(degreeMap.values());
  const totalDegree = degrees.reduce((sum, d) => sum + d, 0);
  const avgDegree = totalDegree / nodes.length;
  const maxDegree = Math.max(...degrees);
  const minDegree = Math.min(...degrees);

  // Calculate edge density
  const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
  const density = edges.length / maxPossibleEdges;

  // Find most connected nodes
  const nodesByDegree = nodes
    .map(node => ({
      id: node.id,
      degree: degreeMap.get(node.id) || 0,
    }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10);

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    avgDegree,
    maxDegree,
    minDegree,
    density,
    topNodes: nodesByDegree,
  };
}

