/**
 * Loading Screen for Knowledge Graph
 * 
 * Beautiful loading state with animated graph building preview
 * and progress indicators.
 * 
 * @module LoadingScreen
 */

import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  /** Loading message to display */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Show animated graph preview */
  showPreview?: boolean;
}

/**
 * Animated node visualization for loading state
 */
function AnimatedNodes() {
  const nodes = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * Math.PI * 2,
    delay: i * 0.1,
  }));

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Central brain icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="kg-pulse">
          <Brain className="h-16 w-16" style={{ color: 'var(--kg-accent-blue)' }} />
        </div>
      </div>

      {/* Orbiting nodes */}
      {nodes.map((node) => {
        const x = Math.cos(node.angle) * 100;
        const y = Math.sin(node.angle) * 100;

        return (
          <div
            key={node.id}
            className="absolute w-3 h-3 rounded-full kg-glow-blue"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y}px)`,
              backgroundColor: 'var(--kg-accent-blue)',
              animation: `kg-pulse 2s infinite ease-in-out ${node.delay}s`,
            }}
          />
        );
      })}

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        {nodes.map((node, i) => {
          if (i >= nodes.length - 1) return null;
          const nextNode = nodes[i + 1];

          const x1 = 50 + Math.cos(node.angle) * 39;
          const y1 = 50 + Math.sin(node.angle) * 39;
          const x2 = 50 + Math.cos(nextNode.angle) * 39;
          const y2 = 50 + Math.sin(nextNode.angle) * 39;

          return (
            <line
              key={`line-${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="var(--kg-accent-blue)"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Loading screen component
 */
export function LoadingScreen({
  message = 'Loading Knowledge Graph...',
  progress,
  showPreview = true,
}: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center h-full kg-neural-bg">
      <div className="kg-glass-card p-8 max-w-lg w-full mx-4">
        {/* Animated preview */}
        {showPreview && (
          <div className="mb-8">
            <AnimatedNodes />
          </div>
        )}

        {/* Loading message */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 kg-glow-blue" style={{ color: 'var(--kg-accent-blue)' }} />
            <h2 className="text-xl font-semibold kg-gradient-text">{message}</h2>
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="w-full bg-kg-bg-tertiary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full kg-glow-blue transition-all duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--kg-gradient-blue-teal)',
                  }}
                />
              </div>
              <p className="text-sm text-kg-text-secondary">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {/* Loading tips */}
          <div className="pt-4 border-t border-kg-border-subtle">
            <p className="text-xs text-kg-text-tertiary italic">
              💡 Tip: Use filters to explore specific learning domains
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for graph panel
 */
export function GraphSkeleton() {
  return (
    <div className="w-full h-full kg-neural-bg animate-pulse">
      <div className="absolute inset-4 kg-glass-card flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-kg-bg-tertiary mx-auto kg-pulse" />
          <div className="h-4 w-48 bg-kg-bg-tertiary rounded mx-auto" />
          <div className="h-3 w-32 bg-kg-bg-tertiary rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state when no data is available
 */
export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full kg-neural-bg">
      <div className="kg-glass-card p-8 max-w-lg w-full mx-4 text-center space-y-4">
        <Brain className="h-16 w-16 mx-auto" style={{ color: 'var(--kg-accent-blue)' }} />
        <h2 className="text-2xl font-bold kg-gradient-text">
          No Knowledge Graph Yet
        </h2>
        <p className="text-kg-text-secondary">
          Run the LKG build process to generate your knowledge graph from conversations.
        </p>
        <div className="kg-glass-card p-4 text-left">
          <p className="text-sm text-kg-text-secondary mb-2">
            <strong className="text-kg-text-primary">To get started:</strong>
          </p>
          <ol className="text-sm text-kg-text-secondary space-y-1 list-decimal list-inside">
            <li>Export your ChatGPT conversations to <code className="text-xs bg-kg-bg-tertiary px-1 py-0.5 rounded">conversations.txt</code></li>
            <li>Set up your environment variables in <code className="text-xs bg-kg-bg-tertiary px-1 py-0.5 rounded">.env</code></li>
            <li>Run <code className="text-xs bg-kg-bg-tertiary px-1 py-0.5 rounded">npm run build-lkg</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

