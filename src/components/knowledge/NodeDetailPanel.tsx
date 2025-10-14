/**
 * Node Detail Panel - Shows information about selected node
 * 
 * Beautiful redesign with glassmorphic effects and rich content display
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  MessageSquare, 
  X, 
  Brain, 
  TrendingUp, 
  Link2, 
  Lightbulb,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { LKGNode } from '@/lib/knowledge/queries';
import { useNodeNeighbors } from '@/lib/knowledge/queries';
import { format } from 'date-fns';
import { getLearningTypeColor, getLearningTypeLabel } from '@/lib/knowledge/learningTypes';

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
  const learningTypeClass = node.learning_type 
    ? `kg-badge-${node.learning_type}` 
    : 'kg-badge-conceptual';

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--kg-bg-secondary)' }}>
      {/* Header with Gradient Border */}
      <div className="kg-gradient-border p-4 border-b border-kg-border-subtle">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-kg-text-primary line-clamp-2 mb-2">
              {node.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              {node.learning_type && (
                <Badge className={`kg-badge ${learningTypeClass}`}>
                  <Brain className="h-3 w-3 mr-1" />
                  {getLearningTypeLabel(node.learning_type as any)}
                </Badge>
              )}
              <Badge className="bg-kg-bg-tertiary text-kg-text-secondary border-kg-border-subtle flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(timestamp, 'MMM d, yyyy')}
              </Badge>
              {node.metadata?.message_count && (
                <Badge className="bg-kg-bg-tertiary text-kg-text-secondary border-kg-border-subtle flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {node.metadata.message_count} messages
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4 kg-scrollbar">
        <div className="space-y-6">
          {/* Confidence Score */}
          {node.confidence_score !== undefined && node.confidence_score !== null && (
            <div className="kg-glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--kg-accent-teal)' }} />
                  <h3 className="text-sm font-semibold text-kg-text-primary">Confidence</h3>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--kg-accent-teal)' }}>
                  {Math.round(node.confidence_score * 100)}%
                </span>
              </div>
              <Progress value={node.confidence_score * 100} className="h-2" />
            </div>
          )}

          {/* Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4" style={{ color: 'var(--kg-accent-blue)' }} />
              <h3 className="text-sm font-semibold text-kg-text-primary">Summary</h3>
            </div>
            <p className="text-sm text-kg-text-secondary leading-relaxed">
              {node.summary}
            </p>
          </div>

          {/* Key Learnings */}
          {node.key_learnings && node.key_learnings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4" style={{ color: 'var(--kg-accent-amber)' }} />
                <h3 className="text-sm font-semibold text-kg-text-primary">Key Learnings</h3>
              </div>
              <ul className="space-y-2">
                {node.key_learnings.map((learning, idx) => (
                  <li key={idx} className="text-sm text-kg-text-secondary flex items-start gap-2">
                    <span className="text-kg-accent-amber mt-0.5">•</span>
                    <span className="flex-1">{learning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions Raised */}
          {node.questions_raised && node.questions_raised.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4" style={{ color: 'var(--kg-accent-pink)' }} />
                <h3 className="text-sm font-semibold text-kg-text-primary">Questions Raised</h3>
              </div>
              <ul className="space-y-2">
                {node.questions_raised.map((question, idx) => (
                  <li key={idx} className="text-sm text-kg-text-secondary flex items-start gap-2">
                    <span className="text-kg-accent-pink mt-0.5">?</span>
                    <span className="flex-1">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Entities */}
          {node.entities && Object.keys(node.entities).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4" style={{ color: 'var(--kg-accent-purple)' }} />
                <h3 className="text-sm font-semibold text-kg-text-primary">Entities</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(node.entities).map(([category, items]) => (
                  items && items.length > 0 && (
                    <div key={category}>
                      <p className="text-xs font-semibold text-kg-text-tertiary uppercase tracking-wide mb-1">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {items.map((item: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            className="text-xs bg-kg-bg-tertiary text-kg-text-secondary border-kg-border-subtle"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Similar Conversations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4" style={{ color: 'var(--kg-accent-teal)' }} />
              <h3 className="text-sm font-semibold text-kg-text-primary">
                Similar Conversations ({neighbors?.length || 0})
              </h3>
            </div>
            {loadingNeighbors ? (
              <div className="kg-glass-card p-4">
                <p className="text-sm text-kg-text-tertiary">Loading...</p>
              </div>
            ) : neighbors && neighbors.length > 0 ? (
              <div className="space-y-2">
                {neighbors.slice(0, 10).map((neighbor) => (
                  <button
                    key={neighbor.id}
                    onClick={() => onNodeClick(neighbor.target_id)}
                    className="w-full text-left kg-glass-card p-3 hover:kg-glow-teal transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-kg-text-primary line-clamp-1">
                          {neighbor.target?.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-kg-text-tertiary line-clamp-2 mt-1">
                          {neighbor.target?.summary || ''}
                        </p>
                      </div>
                      <Badge className="text-xs shrink-0 bg-kg-bg-tertiary text-kg-accent-teal border-kg-accent-teal">
                        {(neighbor.weight * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="kg-glass-card p-4">
                <p className="text-sm text-kg-text-tertiary">No similar conversations found</p>
              </div>
            )}
          </div>

          {/* Conversation ID */}
          <div className="pt-4 border-t border-kg-border-subtle">
            <p className="text-xs font-semibold text-kg-text-tertiary uppercase tracking-wide mb-2">
              Conversation ID
            </p>
            <code className="text-xs text-kg-text-muted break-all font-mono">
              {node.conversation_id}
            </code>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

