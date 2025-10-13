/**
 * Knowledge Graph Page - Main LKG visualization interface
 */

import React, { useState } from 'react';
import { useLKGGraph } from '@/lib/knowledge/queries';
import { GraphVisualization } from '@/components/knowledge/GraphVisualization';
import { NodeDetailPanel } from '@/components/knowledge/NodeDetailPanel';
import { InsightStats } from '@/components/knowledge/InsightStats';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LKGNode } from '@/lib/knowledge/queries';

export default function KnowledgeGraph() {
  const { data, isLoading, error, refetch } = useLKGGraph();
  const [selectedNode, setSelectedNode] = useState<LKGNode | null>(null);

  const handleNodeClick = (node: LKGNode) => {
    setSelectedNode(node);
  };

  const handleNodeClickById = (nodeId: string) => {
    const node = data.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-8">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Knowledge Graph</AlertTitle>
          <AlertDescription>
            {error.message || 'Failed to load knowledge graph data'}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Knowledge Graph</h1>
              <p className="text-sm text-muted-foreground">
                Latent semantic network from your conversations
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Visualization */}
        <div className="flex-1 relative">
          <GraphVisualization
            nodes={data.nodes}
            edges={data.edges}
            selectedNodeId={selectedNode?.id || null}
            onNodeClick={handleNodeClick}
          />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-card border rounded-lg p-3 shadow-lg">
            <p className="text-xs font-semibold mb-2">Color: Time</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-3 rounded" style={{ 
                background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(0, 70%, 50%))' 
              }} />
              <div className="text-xs text-muted-foreground">
                <span className="block">Old → New</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Size: Connections
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l bg-card overflow-hidden flex flex-col">
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onNodeClick={handleNodeClickById}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold mb-4">Graph Insights</h2>
              <InsightStats nodes={data.nodes} edges={data.edges} />
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Click on any node to see its details and similar conversations
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

