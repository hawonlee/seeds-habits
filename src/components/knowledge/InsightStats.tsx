/**
 * Insight Statistics - Display graph metrics and statistics
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, TrendingUp, Calendar, Activity } from 'lucide-react';
import type { LKGNode, LKGEdge } from '@/lib/knowledge/queries';

interface InsightStatsProps {
  nodes: LKGNode[];
  edges: LKGEdge[];
}

export function InsightStats({ nodes, edges }: InsightStatsProps) {
  const stats = useMemo(() => {
    if (nodes.length === 0) {
      return {
        nodeCount: 0,
        edgeCount: 0,
        avgDegree: 0,
        density: 0,
        timeSpan: '',
        mostConnected: [],
      };
    }

    // Calculate degrees
    const degreeMap = new Map<string, number>();
    for (const node of nodes) {
      degreeMap.set(node.id, 0);
    }
    for (const edge of edges) {
      degreeMap.set(edge.source_id, (degreeMap.get(edge.source_id) || 0) + 1);
      degreeMap.set(edge.target_id, (degreeMap.get(edge.target_id) || 0) + 1);
    }

    const degrees = Array.from(degreeMap.values());
    const totalDegree = degrees.reduce((sum, d) => sum + d, 0);
    const avgDegree = totalDegree / nodes.length;

    // Calculate density
    const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    const density = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0;

    // Time span
    const timestamps = nodes.map(n => new Date(n.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const daysDiff = Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24));
    const timeSpan = daysDiff > 365 
      ? `${Math.floor(daysDiff / 365)} years` 
      : `${daysDiff} days`;

    // Most connected nodes
    const mostConnected = nodes
      .map(node => ({
        id: node.id,
        title: node.title,
        degree: degreeMap.get(node.id) || 0,
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      avgDegree,
      density,
      timeSpan,
      mostConnected,
    };
  }, [nodes, edges]);

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4 text-blue-500" />
              Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nodeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Edges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.edgeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Avg Degree
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDegree.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Connections/node</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Time Span
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.timeSpan}</div>
            <p className="text-xs text-muted-foreground mt-1">Knowledge range</p>
          </CardContent>
        </Card>
      </div>

      {/* Most Connected Nodes */}
      {stats.mostConnected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.mostConnected.map((node, idx) => (
                <div key={node.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-muted-foreground font-mono text-xs">
                      {idx + 1}.
                    </span>
                    <span className="truncate">{node.title}</span>
                  </div>
                  <span className="font-semibold text-xs ml-2">{node.degree}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graph Density */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Graph Density</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.min(stats.density * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold">
              {(stats.density * 100).toFixed(3)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Density indicates how interconnected the knowledge graph is
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

