/**
 * Data Export Utilities
 * 
 * Functions for exporting knowledge graph data in various formats:
 * - JSON (nodes + edges)
 * - CSV (nodes list)
 * - Screenshot (PNG)
 * 
 * @module export
 */

import type { LKGNode, LKGEdge } from './queries';

/**
 * Export nodes and edges as JSON file
 */
export async function exportAsJSON(nodes: LKGNode[], edges: LKGEdge[]): Promise<void> {
  const data = {
    meta: {
      exported_at: new Date().toISOString(),
      node_count: nodes.length,
      edge_count: edges.length,
      version: '1.0',
    },
    nodes: nodes.map(node => ({
      id: node.id,
      conversation_id: node.conversation_id,
      title: node.title,
      summary: node.summary,
      timestamp: node.timestamp,
      learning_type: node.learning_type,
      confidence_score: node.confidence_score,
      entities: node.entities,
      key_learnings: node.key_learnings,
      questions_raised: node.questions_raised,
      resources_mentioned: node.resources_mentioned,
      coordinates: {
        x: node.umap_x,
        y: node.umap_y,
        z: node.umap_z,
      },
      metadata: node.metadata,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source_id: edge.source_id,
      target_id: edge.target_id,
      weight: edge.weight,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `knowledge-graph-${getTimestamp()}.json`);
}

/**
 * Export nodes as CSV file
 */
export async function exportAsCSV(nodes: LKGNode[]): Promise<void> {
  const headers = [
    'ID',
    'Title',
    'Summary',
    'Timestamp',
    'Learning Type',
    'Confidence',
    'Key Learnings',
    'Questions',
    'Resources',
  ];

  const rows = nodes.map(node => [
    node.id,
    escapeCsv(node.title),
    escapeCsv(node.summary),
    node.timestamp,
    node.learning_type || '',
    node.confidence_score?.toString() || '',
    escapeCsv(node.key_learnings?.join('; ') || ''),
    escapeCsv(node.questions_raised?.join('; ') || ''),
    escapeCsv(node.resources_mentioned?.join('; ') || ''),
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `knowledge-graph-nodes-${getTimestamp()}.csv`);
}

/**
 * Capture screenshot of current view
 */
export async function captureScreenshot(element: HTMLElement, filename?: string): Promise<void> {
  try {
    // Use html2canvas if available, otherwise use native screenshot API
    if (typeof window !== 'undefined' && 'html2canvas' in window) {
      // @ts-ignore
      const canvas = await window.html2canvas(element, {
        backgroundColor: '#0a0a0a',
        scale: 2, // High resolution
      });

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, filename || `knowledge-graph-${getTimestamp()}.png`);
        }
      });
    } else {
      // Fallback: use canvas API for WebGL canvas
      const canvas = element.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            downloadBlob(blob, filename || `knowledge-graph-${getTimestamp()}.png`);
          }
        });
      } else {
        console.warn('Screenshot not available: html2canvas not loaded and no canvas found');
      }
    }
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    throw error;
  }
}

/**
 * Copy screenshot to clipboard
 */
export async function copyScreenshotToClipboard(element: HTMLElement): Promise<void> {
  try {
    const canvas = element.querySelector('canvas');
    if (!canvas) {
      throw new Error('No canvas element found');
    }

    canvas.toBlob(async (blob) => {
      if (blob && navigator.clipboard && 'write' in navigator.clipboard) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          // console.log('Screenshot copied to clipboard');
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
          throw err;
        }
      } else {
        throw new Error('Clipboard API not available');
      }
    });
  } catch (error) {
    console.error('Failed to copy screenshot:', error);
    throw error;
  }
}

/**
 * Export filtered subgraph
 */
export async function exportSubgraph(
  nodes: LKGNode[],
  edges: LKGEdge[],
  selectedNodeIds: string[]
): Promise<void> {
  // Filter nodes
  const filteredNodes = nodes.filter(node => selectedNodeIds.includes(node.id));

  // Filter edges (only include edges where both nodes are selected)
  const nodeIdSet = new Set(selectedNodeIds);
  const filteredEdges = edges.filter(
    edge => nodeIdSet.has(edge.source_id) && nodeIdSet.has(edge.target_id)
  );

  await exportAsJSON(filteredNodes, filteredEdges);
}

/**
 * Generate Markdown report of knowledge graph
 */
export async function exportAsMarkdown(nodes: LKGNode[], edges: LKGEdge[]): Promise<void> {
  const learningTypes = nodes.reduce((acc, node) => {
    const type = node.learning_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence =
    nodes.reduce((sum, node) => sum + (node.confidence_score || 0), 0) / nodes.length;

  const report = `# Knowledge Graph Report

Generated: ${new Date().toLocaleDateString()}

## Overview

- **Total Conversations**: ${nodes.length}
- **Connections**: ${edges.length}
- **Average Confidence**: ${(avgConfidence * 100).toFixed(1)}%
- **Time Range**: ${getTimeRange(nodes)}

## Learning Breakdown

${Object.entries(learningTypes)
  .map(([type, count]) => `- **${capitalize(type)}**: ${count} conversations`)
  .join('\n')}

## Recent Learning

${nodes
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  .slice(0, 10)
  .map(
    (node, i) => `
### ${i + 1}. ${node.title}

- **Date**: ${new Date(node.timestamp).toLocaleDateString()}
- **Type**: ${node.learning_type || 'N/A'}
- **Confidence**: ${node.confidence_score ? `${(node.confidence_score * 100).toFixed(0)}%` : 'N/A'}

${node.summary}

${node.key_learnings && node.key_learnings.length > 0 ? `**Key Learnings**:\n${node.key_learnings.map(l => `- ${l}`).join('\n')}` : ''}
`
  )
  .join('\n')}

## Graph Statistics

- **Most Connected Topics**: ${getMostConnectedNodes(nodes, edges, 5)
    .map(n => n.title)
    .join(', ')}
- **Average Connections per Node**: ${(edges.length * 2 / nodes.length).toFixed(1)}

---

*This report was automatically generated from your knowledge graph.*
`;

  const blob = new Blob([report], { type: 'text/markdown' });
  downloadBlob(blob, `knowledge-graph-report-${getTimestamp()}.md`);
}

// Helper functions

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function escapeCsv(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

function getTimeRange(nodes: LKGNode[]): string {
  if (nodes.length === 0) return 'N/A';

  const dates = nodes.map(n => new Date(n.timestamp).getTime());
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));

  return `${min.toLocaleDateString()} - ${max.toLocaleDateString()}`;
}

function getMostConnectedNodes(
  nodes: LKGNode[],
  edges: LKGEdge[],
  count: number
): LKGNode[] {
  const degrees = new Map<string, number>();

  edges.forEach(edge => {
    degrees.set(edge.source_id, (degrees.get(edge.source_id) || 0) + 1);
    degrees.set(edge.target_id, (degrees.get(edge.target_id) || 0) + 1);
  });

  return nodes
    .sort((a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0))
    .slice(0, count);
}

