/**
 * SearchBar - Search interface for knowledge graph
 * 
 * Features:
 * - Text-based search (title and summary)
 * - Real-time filtering
 * - Search suggestions
 * - Clear button
 * 
 * Future: Semantic search with embeddings
 * 
 * @module SearchBar
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  /** Current search query */
  value: string;
  /** Callback when search query changes */
  onChange: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Number of results found */
  resultCount?: number;
}

/**
 * Search Bar Component
 * 
 * Provides text search interface for knowledge graph nodes
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search conversations...',
  resultCount,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kg-text-tertiary" />
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 kg-glass-card border-kg-border-subtle focus:border-kg-accent-blue"
          style={{
            background: 'var(--kg-bg-card)',
            color: 'var(--kg-text-primary)',
          }}
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {resultCount !== undefined && localValue && (
        <div className="text-xs text-kg-text-tertiary whitespace-nowrap">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </div>
      )}
    </div>
  );
}

