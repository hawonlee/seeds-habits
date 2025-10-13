/**
 * Node Detail Panel - Shows information about selected node
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LKGNode } from '@/lib/knowledge/queries';
import { useNodeNeighbors } from '@/lib/knowledge/queries';
import { format } from 'date-fns';

interface NodeDetailPanelProps {
  node: LKGNode | null;
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

export function NodeDetailPanel({ node, onClose, onNodeClick }: NodeDetailPanelProps) {
  const { data: neighbors, isLoading: loadingNeighbors } = useNodeNeighbors(node?.id || null);

  if (!node) {
    return null;
  }

  const timestamp = new Date(node.timestamp);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg line-clamp-2">{node.title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -mr-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(timestamp, 'MMM d, yyyy')}
              </Badge>
              {node.metadata?.message_count && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {node.metadata.message_count} messages
                </Badge>
              )}
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {node.summary}
              </p>
            </div>

            {/* Neighbors */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Similar Conversations ({neighbors?.length || 0})
              </h3>
              {loadingNeighbors ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : neighbors && neighbors.length > 0 ? (
                <div className="space-y-2">
                  {neighbors.slice(0, 10).map((neighbor) => (
                    <button
                      key={neighbor.id}
                      onClick={() => onNodeClick(neighbor.target_id)}
                      className="w-full text-left p-2 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {neighbor.target?.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {neighbor.target?.summary || ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {(neighbor.weight * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No similar conversations found</p>
              )}
            </div>

            {/* Conversation ID */}
            <div>
              <h3 className="text-sm font-semibold mb-1">Conversation ID</h3>
              <code className="text-xs text-muted-foreground break-all">
                {node.conversation_id}
              </code>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

