/**
 * Interactive Graph Visualization using UMAP coordinates
 */

import React, { useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { LKGNode, LKGEdge } from '@/lib/knowledge/queries';

interface GraphVisualizationProps {
  nodes: LKGNode[];
  edges: LKGEdge[];
  selectedNodeId: string | null;
  onNodeClick: (node: LKGNode) => void;
}

interface GraphNode {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  x?: number;
  y?: number;
  degree: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

/**
 * Calculate temporal color gradient (blue → purple → red)
 */
function getTemporalColor(timestamp: Date, minTime: number, maxTime: number): string {
  const time = timestamp.getTime();
  const normalized = (time - minTime) / (maxTime - minTime);
  
  // Blue (old) → Purple (mid) → Red (new)
  const hue = 240 - (normalized * 240); // 240 (blue) to 0 (red)
  const saturation = 70;
  const lightness = 50;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function GraphVisualization({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
}: GraphVisualizationProps) {
  const graphRef = useRef<{ zoomToFit?: (duration: number, padding: number) => void; centerAt?: (x: number, y: number, duration: number) => void }>();

  // Calculate node degrees
  const degreeMap = useMemo(() => {
    const degrees = new Map<string, number>();
    
    for (const node of nodes) {
      degrees.set(node.id, 0);
    }
    
    for (const edge of edges) {
      degrees.set(edge.source_id, (degrees.get(edge.source_id) || 0) + 1);
      degrees.set(edge.target_id, (degrees.get(edge.target_id) || 0) + 1);
    }
    
    return degrees;
  }, [nodes, edges]);

  // Prepare graph data
  const graphData = useMemo(() => {
    if (nodes.length === 0) return { nodes: [], links: [] };

    // Calculate time range for color gradient
    const timestamps = nodes.map(n => new Date(n.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    // Transform nodes
    const graphNodes: GraphNode[] = nodes.map(node => {
      const timestamp = new Date(node.timestamp);
      const degree = degreeMap.get(node.id) || 0;
      
      return {
        id: node.id,
        title: node.title,
        summary: node.summary,
        timestamp,
        x: node.umap_x ?? undefined,
        y: node.umap_y ?? undefined,
        degree,
        color: getTemporalColor(timestamp, minTime, maxTime),
      };
    });

    // Transform edges
    const graphLinks: GraphLink[] = edges.map(edge => ({
      source: edge.source_id,
      target: edge.target_id,
      weight: edge.weight,
    }));

    return { nodes: graphNodes, links: graphLinks };
  }, [nodes, edges, degreeMap]);

  // Auto-zoom to fit on load
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        const graph = graphRef.current as { zoomToFit?: (duration: number, padding: number) => void };
        graph?.zoomToFit?.(400, 50);
      }, 500);
    }
  }, [graphData.nodes.length]);

  // Highlight selected node
  useEffect(() => {
    if (graphRef.current && selectedNodeId) {
      const node = graphData.nodes.find(n => n.id === selectedNodeId);
      if (node && node.x !== undefined && node.y !== undefined) {
        const graph = graphRef.current as { centerAt?: (x: number, y: number, duration: number) => void };
        graph?.centerAt?.(node.x, node.y, 1000);
      }
    }
  }, [selectedNodeId, graphData.nodes]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No knowledge graph data yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Run <code className="bg-muted px-2 py-1 rounded">npm run build-lkg</code> to build the graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeId="id"
        nodeLabel={(node) => {
          const graphNode = node as GraphNode;
          return `${graphNode.title}\n${graphNode.summary.substring(0, 100)}...`;
        }}
        nodeColor={(node) => {
          const graphNode = node as GraphNode;
          return graphNode.id === selectedNodeId ? '#fbbf24' : graphNode.color;
        }}
        nodeRelSize={6}
        nodeVal={(node) => {
          const graphNode = node as GraphNode;
          return Math.sqrt(graphNode.degree + 1) * 2;
        }}
        linkColor={() => 'rgba(100, 100, 100, 0.2)'}
        linkWidth={(link) => {
          const graphLink = link as GraphLink;
          return graphLink.weight * 2;
        }}
        linkDirectionalParticles={0}
        onNodeClick={(node) => {
          const graphNode = node as GraphNode;
          const lkgNode = nodes.find(n => n.id === graphNode.id);
          if (lkgNode) {
            onNodeClick(lkgNode);
          }
        }}
        cooldownTicks={0}
        enableNodeDrag={false}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        backgroundColor="transparent"
        d3AlphaDecay={0.99}
        d3VelocityDecay={0.99}
        warmupTicks={0}
      />
    </div>
  );
}

