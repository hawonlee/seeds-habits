/**
 * Knowledge Graph Page - Main LKG visualization interface
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLKGGraph } from '@/lib/knowledge/queries';
import { GraphVisualization } from '@/components/knowledge/GraphVisualization';
import { Graph3D } from '@/components/knowledge/Graph3D';
import { NodeDetailPanel } from '@/components/knowledge/NodeDetailPanel';
import { InsightStats } from '@/components/knowledge/InsightStats';
import { ControlPanel } from '@/components/knowledge/ControlPanel';
import { SearchBar } from '@/components/knowledge/SearchBar';
import { LoadingScreen, EmptyState } from '@/components/knowledge/LoadingScreen';
import { ErrorBoundary, DataLoadError, isWebGLSupported } from '@/components/knowledge/ErrorBoundary';
import { UploadPrompt, UploadButton } from '@/components/knowledge/UploadPrompt';
import { userHasKnowledgeGraph } from '@/lib/knowledge/processUpload';
import { recomputeKnowledgeGraph } from '@/lib/knowledge/recomputeGraph';
import { useGraphFilters } from '@/hooks/useGraphFilters';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, AlertCircle, Box, Grid3x3, SlidersHorizontal, Download, Camera } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportAsJSON, exportAsCSV, exportAsMarkdown, captureScreenshot } from '@/lib/knowledge/export';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LKGNode } from '@/lib/knowledge/queries';

export default function KnowledgeGraph() {
  const { data, isLoading, error, refetch } = useLKGGraph();
  const [selectedNode, setSelectedNode] = useState<LKGNode | null>(null);
  const [view3D, setView3D] = useState(false); // Toggle between 2D and 3D
  const [showControls, setShowControls] = useState(true);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [checkingData, setCheckingData] = useState(true);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [recomputeMessage, setRecomputeMessage] = useState<string | null>(null);
  
  // Graph filters
  const {
    filters,
    viewPreset,
    updateFilter,
    applyPreset,
    filterNode,
  } = useGraphFilters();
  
  // Calculate connection counts for filtering
  const connectionCounts = useMemo(() => {
    if (!data) return new Map<string, number>();
    const counts = new Map<string, number>();
    data.nodes.forEach(node => counts.set(node.id, 0));
    data.edges.forEach(edge => {
      counts.set(edge.source_id, (counts.get(edge.source_id) || 0) + 1);
      counts.set(edge.target_id, (counts.get(edge.target_id) || 0) + 1);
    });
    return counts;
  }, [data]);
  
  // Filtered nodes and edges
  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    
    const filteredNodes = data.nodes.filter(node => 
      filterNode(node, connectionCounts.get(node.id) || 0)
    );
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = data.edges.filter(edge => 
      filteredNodeIds.has(edge.source_id) && filteredNodeIds.has(edge.target_id)
    );
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [data, filterNode, connectionCounts]);

  const handleNodeClick = (node: LKGNode) => {
    setSelectedNode(node);
  };

  const handleNodeClickById = (nodeId: string) => {
    const node = data?.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  };

  // Check if user has uploaded data
  useEffect(() => {
    const checkData = async () => {
      setCheckingData(true);
      const hasGraph = await userHasKnowledgeGraph();
      setHasData(hasGraph);
      setCheckingData(false);
    };
    checkData();
  }, []);

  // Handle upload complete
  const handleUploadComplete = () => {
    setHasData(true);
    refetch();
  };

  // Handle recompute
  const handleRecompute = async () => {
    setIsRecomputing(true);
    setRecomputeMessage(null);
    try {
      await recomputeKnowledgeGraph((progress) => {
        setRecomputeMessage(progress.message);
        if (progress.nextStep) {
          // Show modal with instructions
          alert(`Next step: ${progress.nextStep}`);
        }
      });
      // Refetch graph data
      refetch();
    } catch (error) {
      setRecomputeMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRecomputing(false);
    }
  };

  // Show loading while checking if user has data
  if (checkingData) {
    return <LoadingScreen message="Checking your data..." />;
  }

  // Show upload prompt if user hasn't uploaded data yet
  if (hasData === false) {
    return <UploadPrompt onUploadComplete={handleUploadComplete} />;
  }

  if (isLoading) {
    return <LoadingScreen message="Loading Knowledge Graph..." />;
  }

  if (error) {
    return (
      <DataLoadError
        message={error.message || 'Failed to load knowledge graph data'}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state check
  if (!data || data.nodes.length === 0) {
    return <EmptyState />;
  }

  // Check WebGL support for 3D view
  const webGLSupported = isWebGLSupported();
  if (view3D && !webGLSupported) {
    // Auto-fallback to 2D if WebGL not supported
    setView3D(false);
  }

  return (
    <ErrorBoundary>
    <div className="h-screen flex flex-col kg-neural-bg">
      {/* Header */}
      <div className="border-b border-kg-border-subtle px-6 py-4 space-y-4" style={{ background: 'var(--kg-bg-card)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 kg-glow-blue" style={{ color: 'var(--kg-accent-blue)' }} />
            <div>
              <h1 className="text-2xl font-bold kg-gradient-text">Knowledge Graph</h1>
              <p className="text-sm text-kg-text-secondary">
                Latent semantic network from your conversations
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showControls ? 'Hide' : 'Show'} Controls
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView3D(!view3D)}
              className="gap-2"
            >
              {view3D ? (
                <>
                  <Grid3x3 className="h-4 w-4" />
                  2D View
                </>
              ) : (
                <>
                  <Box className="h-4 w-4" />
                  3D View
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            {/* Recompute Graph button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecompute}
              disabled={isRecomputing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRecomputing ? 'animate-spin' : ''}`} />
              {isRecomputing ? 'Recomputing...' : 'Recompute Graph'}
            </Button>
            
            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="kg-glass-card border-kg-border-subtle">
                <DropdownMenuItem
                  onClick={() => exportAsJSON(data!.nodes, data!.edges)}
                  className="cursor-pointer"
                >
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportAsCSV(data!.nodes)}
                  className="cursor-pointer"
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportAsMarkdown(data!.nodes, data!.edges)}
                  className="cursor-pointer"
                >
                  Export Report (MD)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Screenshot button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const graphElement = document.querySelector('.graph-container') as HTMLElement;
                if (graphElement) {
                  captureScreenshot(graphElement);
                }
              }}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Screenshot
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="max-w-2xl">
          <SearchBar
            value={filters.searchQuery}
            onChange={(query) => updateFilter('searchQuery', query)}
            placeholder="Search conversations by title or content..."
            resultCount={filteredData.nodes.length}
          />
        </div>

        {/* Recompute message */}
        {recomputeMessage && (
          <Alert>
            <AlertDescription>{recomputeMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
          {/* Graph Visualization */}
          <div className="flex-1 relative graph-container">
          {view3D ? (
            <Graph3D
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              selectedNodeId={selectedNode?.id || null}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <GraphVisualization
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              selectedNodeId={selectedNode?.id || null}
              onNodeClick={handleNodeClick}
            />
          )}
          
          {/* Control Panel - Floating */}
          {showControls && (
            <div className="absolute top-4 left-4 z-10">
              <ControlPanel
                viewPreset={viewPreset}
                onPresetChange={applyPreset}
                minConfidence={filters.minConfidence}
                onConfidenceChange={(value) => updateFilter('minConfidence', value)}
                minConnections={filters.minConnections}
                onConnectionsChange={(value) => updateFilter('minConnections', value)}
                selectedLearningTypes={filters.learningTypes}
                onLearningTypesChange={(types) => updateFilter('learningTypes', types)}
                show={showControls}
                onClose={() => setShowControls(false)}
              />
            </div>
          )}
          
          {/* Stats - Bottom Right */}
          <div className="absolute bottom-4 right-4 kg-glass-card p-3 max-w-xs">
            <p className="text-xs text-kg-text-secondary">
              <span className="font-semibold text-kg-accent-blue">{filteredData.nodes.length}</span> nodes
              {filteredData.nodes.length !== data.nodes.length && (
                <span className="text-kg-text-tertiary"> ({data.nodes.length} total)</span>
              )}
            </p>
            <p className="text-xs text-kg-text-secondary">
              <span className="font-semibold text-kg-accent-teal">{filteredData.edges.length}</span> connections
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l border-kg-border-subtle overflow-hidden flex flex-col" style={{ background: 'var(--kg-bg-secondary)' }}>
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onNodeClick={handleNodeClickById}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-6 kg-scrollbar">
              <h2 className="text-lg font-semibold mb-4 kg-gradient-text">Graph Insights</h2>
              <InsightStats nodes={filteredData.nodes} edges={filteredData.edges} />
              
              <div className="mt-6 kg-glass-card p-4">
                <p className="text-sm text-kg-text-secondary">
                  💡 Click on any node to see its details and similar conversations
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

