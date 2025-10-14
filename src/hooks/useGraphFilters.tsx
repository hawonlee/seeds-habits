/**
 * useGraphFilters - Hook for managing knowledge graph filters and view state
 * 
 * Provides state management for filtering nodes by:
 * - Time range
 * - Learning type
 * - Cluster/topic
 * - Connection count
 * - Confidence score
 * 
 * @module useGraphFilters
 */

import { useState, useMemo } from 'react';
import type { LKGNode } from '@/lib/knowledge/queries';

export interface GraphFilters {
  /** Time range filter (start and end dates in ISO format) */
  timeRange: {
    start: string | null;
    end: string | null;
  };
  /** Selected learning types */
  learningTypes: Set<string>;
  /** Selected cluster IDs */
  clusters: Set<number>;
  /** Minimum connection count */
  minConnections: number;
  /** Minimum confidence score (0-1) */
  minConfidence: number;
  /** Search query */
  searchQuery: string;
}

export type ViewPreset = 'overview' | 'deep-dive' | 'time-travel' | 'topic-focus' | 'custom';

/**
 * Hook for managing graph filters and view presets
 */
export function useGraphFilters() {
  const [filters, setFilters] = useState<GraphFilters>({
    timeRange: { start: null, end: null },
    learningTypes: new Set(),
    clusters: new Set(),
    minConnections: 0,
    minConfidence: 0,
    searchQuery: '',
  });
  
  const [viewPreset, setViewPreset] = useState<ViewPreset>('overview');
  
  /**
   * Apply a preset configuration
   */
  const applyPreset = (preset: ViewPreset) => {
    setViewPreset(preset);
    
    switch (preset) {
      case 'overview':
        // Show all nodes, no filters
        setFilters({
          timeRange: { start: null, end: null },
          learningTypes: new Set(),
          clusters: new Set(),
          minConnections: 0,
          minConfidence: 0,
          searchQuery: '',
        });
        break;
        
      case 'deep-dive':
        // Show high-confidence deep learning
        setFilters(prev => ({
          ...prev,
          minConfidence: 0.7,
          learningTypes: new Set(['deepdive']),
        }));
        break;
        
      case 'time-travel':
        // Sort chronologically (no filters, controlled by parent)
        setFilters(prev => ({
          ...prev,
          minConnections: 0,
          minConfidence: 0,
        }));
        break;
        
      case 'topic-focus':
        // Show highly connected nodes
        setFilters(prev => ({
          ...prev,
          minConnections: 3,
        }));
        break;
        
      case 'custom':
      default:
        // Keep current filters
        break;
    }
  };
  
  /**
   * Update a specific filter
   */
  const updateFilter = <K extends keyof GraphFilters>(
    key: K,
    value: GraphFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setViewPreset('custom');
  };
  
  /**
   * Reset all filters
   */
  const resetFilters = () => {
    applyPreset('overview');
  };
  
  /**
   * Check if a node passes the current filters
   */
  const filterNode = useMemo(() => {
    return (node: LKGNode, connectionCount: number = 0): boolean => {
      // Time range filter
      if (filters.timeRange.start || filters.timeRange.end) {
        const nodeDate = new Date(node.timestamp);
        if (filters.timeRange.start && nodeDate < new Date(filters.timeRange.start)) {
          return false;
        }
        if (filters.timeRange.end && nodeDate > new Date(filters.timeRange.end)) {
          return false;
        }
      }
      
      // Learning type filter
      if (filters.learningTypes.size > 0 && node.learning_type) {
        if (!filters.learningTypes.has(node.learning_type)) {
          return false;
        }
      }
      
      // Cluster filter
      if (filters.clusters.size > 0 && node.cluster_id !== undefined && node.cluster_id !== null) {
        if (!filters.clusters.has(node.cluster_id)) {
          return false;
        }
      }
      
      // Connection count filter
      if (connectionCount < filters.minConnections) {
        return false;
      }
      
      // Confidence score filter
      if (node.confidence_score !== undefined && node.confidence_score !== null) {
        if (node.confidence_score < filters.minConfidence) {
          return false;
        }
      }
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = `${node.title} ${node.summary}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      return true;
    };
  }, [filters]);
  
  return {
    filters,
    viewPreset,
    updateFilter,
    applyPreset,
    resetFilters,
    filterNode,
  };
}

