/**
 * ControlPanel - Floating control panel for graph filtering and view presets
 * 
 * Provides UI controls for:
 * - View presets (Overview, Deep Dive, Time Travel, Topic Focus)
 * - Time range filtering
 * - Learning type filtering
 * - View toggles (2D/3D)
 * 
 * @module ControlPanel
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Sparkles,
  Clock,
  Target,
  X,
  Filter,
} from 'lucide-react';
import type { ViewPreset } from '@/hooks/useGraphFilters';

interface ControlPanelProps {
  /** Current view preset */
  viewPreset: ViewPreset;
  /** Callback when preset is changed */
  onPresetChange: (preset: ViewPreset) => void;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Callback when confidence threshold changes */
  onConfidenceChange: (value: number) => void;
  /** Minimum connection count */
  minConnections: number;
  /** Callback when connection count changes */
  onConnectionsChange: (value: number) => void;
  /** Selected learning types */
  selectedLearningTypes: Set<string>;
  /** Callback when learning types change */
  onLearningTypesChange: (types: Set<string>) => void;
  /** Whether to show the panel */
  show?: boolean;
  /** Callback to close panel */
  onClose?: () => void;
}

const PRESETS: Array<{ value: ViewPreset; label: string; icon: React.ReactNode; description: string }> = [
  {
    value: 'overview',
    label: 'Overview',
    icon: <Eye className="h-4 w-4" />,
    description: 'See all nodes',
  },
  {
    value: 'deep-dive',
    label: 'Deep Dive',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'High-confidence learning',
  },
  {
    value: 'time-travel',
    label: 'Time Travel',
    icon: <Clock className="h-4 w-4" />,
    description: 'Chronological view',
  },
  {
    value: 'topic-focus',
    label: 'Topic Focus',
    icon: <Target className="h-4 w-4" />,
    description: 'Highly connected topics',
  },
];

const LEARNING_TYPES = [
  { value: 'conceptual', label: 'Conceptual', color: 'kg-badge-conceptual' },
  { value: 'practical', label: 'Practical', color: 'kg-badge-practical' },
  { value: 'debugging', label: 'Debugging', color: 'kg-badge-debugging' },
  { value: 'exploratory', label: 'Exploratory', color: 'kg-badge-exploratory' },
  { value: 'deepdive', label: 'Deep Dive', color: 'kg-badge-deepdive' },
];

/**
 * Floating Control Panel Component
 */
export function ControlPanel({
  viewPreset,
  onPresetChange,
  minConfidence,
  onConfidenceChange,
  minConnections,
  onConnectionsChange,
  selectedLearningTypes,
  onLearningTypesChange,
  show = true,
  onClose,
}: ControlPanelProps) {
  if (!show) return null;
  
  const toggleLearningType = (type: string) => {
    const newTypes = new Set(selectedLearningTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onLearningTypesChange(newTypes);
  };
  
  return (
    <div className="kg-glass-card p-4 space-y-4 min-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-kg-accent-blue" />
          <h3 className="font-semibold text-kg-text-primary">Controls</h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* View Presets */}
      <div className="space-y-2">
        <Label className="text-xs text-kg-text-secondary uppercase tracking-wide">
          View Preset
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(preset => (
            <Button
              key={preset.value}
              variant={viewPreset === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPresetChange(preset.value)}
              className="flex items-center justify-start gap-2"
              title={preset.description}
            >
              {preset.icon}
              <span className="text-xs">{preset.label}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Learning Types Filter */}
      <div className="space-y-2">
        <Label className="text-xs text-kg-text-secondary uppercase tracking-wide">
          Learning Types
        </Label>
        <div className="flex flex-wrap gap-2">
          {LEARNING_TYPES.map(type => (
            <Badge
              key={type.value}
              className={`kg-badge ${type.color} cursor-pointer transition-opacity ${
                selectedLearningTypes.size > 0 && !selectedLearningTypes.has(type.value)
                  ? 'opacity-40'
                  : 'opacity-100'
              }`}
              onClick={() => toggleLearningType(type.value)}
            >
              {type.label}
            </Badge>
          ))}
        </div>
        {selectedLearningTypes.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLearningTypesChange(new Set())}
            className="text-xs text-kg-text-tertiary w-full"
          >
            Clear filters
          </Button>
        )}
      </div>
      
      {/* Confidence Threshold */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-kg-text-secondary uppercase tracking-wide">
            Min Confidence
          </Label>
          <span className="text-xs text-kg-text-tertiary">
            {Math.round(minConfidence * 100)}%
          </span>
        </div>
        <Slider
          value={[minConfidence]}
          onValueChange={([value]) => onConfidenceChange(value)}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>
      
      {/* Connection Count */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-kg-text-secondary uppercase tracking-wide">
            Min Connections
          </Label>
          <span className="text-xs text-kg-text-tertiary">
            {minConnections}
          </span>
        </div>
        <Slider
          value={[minConnections]}
          onValueChange={([value]) => onConnectionsChange(value)}
          min={0}
          max={10}
          step={1}
          className="w-full"
        />
      </div>
      
      {/* Quick Stats */}
      <div className="pt-2 border-t border-kg-border-subtle">
        <p className="text-xs text-kg-text-tertiary">
          {viewPreset === 'custom' ? 'Custom filters active' : `${PRESETS.find(p => p.value === viewPreset)?.label} view`}
        </p>
      </div>
    </div>
  );
}

