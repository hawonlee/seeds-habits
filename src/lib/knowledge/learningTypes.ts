/**
 * Learning Types - Browser-safe utilities for learning type classification
 * 
 * This file contains utility functions that can be safely used in browser code.
 * The actual classification logic with OpenAI is in learningClassifier.ts (Node.js only).
 * 
 * @module learningTypes
 */

/**
 * Types of learning that can occur in a conversation
 */
export type LearningType = 
  | 'conceptual'   // Understanding theory, concepts, mental models
  | 'practical'    // Hands-on implementation, building things
  | 'debugging'    // Problem-solving, troubleshooting, fixing errors
  | 'exploratory'  // Discovering new topics, initial exploration
  | 'deep-dive';   // In-depth study of a known topic

/**
 * Get a short label for a learning type (for badges and UI)
 * 
 * @param type - Learning type
 * @returns Short label
 */
export function getLearningTypeLabel(type: LearningType): string {
  const labels: Record<LearningType, string> = {
    conceptual: 'Conceptual',
    practical: 'Practical',
    debugging: 'Debugging',
    exploratory: 'Exploratory',
    'deep-dive': 'Deep Dive',
  };
  
  return labels[type];
}

/**
 * Get a human-readable description of a learning type
 * 
 * @param type - Learning type to describe
 * @returns User-friendly description
 */
export function getLearningTypeDescription(type: LearningType): string {
  const descriptions: Record<LearningType, string> = {
    conceptual: 'Understanding concepts and theory',
    practical: 'Hands-on implementation and building',
    debugging: 'Problem-solving and troubleshooting',
    exploratory: 'Discovering and exploring new topics',
    'deep-dive': 'In-depth study of advanced topics',
  };
  
  return descriptions[type];
}

/**
 * Get a color for visualizing learning type
 * 
 * @param type - Learning type
 * @returns Hex color code
 */
export function getLearningTypeColor(type: LearningType): string {
  const colors: Record<LearningType, string> = {
    conceptual: '#00d4ff',    // Blue - understanding
    practical: '#00ffc8',      // Teal - building
    debugging: '#ff6b6b',      // Red - problem-solving
    exploratory: '#b74cff',    // Purple - exploring
    'deep-dive': '#ffd93d',    // Gold - mastery
  };
  
  return colors[type];
}

/**
 * Get confidence level label
 * 
 * @param score - Confidence score (0-1)
 * @returns Human-readable confidence level
 */
export function getConfidenceLabel(score: number): string {
  if (score < 0.3) return 'Beginner';
  if (score < 0.6) return 'Learning';
  if (score < 0.8) return 'Competent';
  if (score < 0.95) return 'Proficient';
  return 'Expert';
}

