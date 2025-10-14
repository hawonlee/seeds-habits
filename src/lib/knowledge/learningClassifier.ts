/**
 * Learning Classifier - Classifies conversations by learning type and depth
 * 
 * This module is for Node.js use only (build scripts).
 * For browser-safe utilities, import from './learningTypes' instead.
 * 
 * Determines:
 * - Learning type (conceptual, practical, debugging, exploratory, deep-dive)
 * - Confidence score (0-1) indicating understanding depth
 * 
 * @module learningClassifier
 */

import OpenAI from 'openai';
import type { ParsedConversation } from './conversationParser';

// Re-export browser-safe utilities
export type { LearningType } from './learningTypes';
export {
  getLearningTypeLabel,
  getLearningTypeDescription,
  getLearningTypeColor,
  getConfidenceLabel,
} from './learningTypes';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

/**
 * Result of learning classification
 */
export interface LearningClassification {
  /** Primary learning type */
  learningType: LearningType;
  /** Confidence score (0-1) indicating depth of understanding */
  confidenceScore: number;
  /** Reasoning for the classification (for debugging/transparency) */
  reasoning?: string;
}

/**
 * Heuristic-based classification (fast, used as fallback)
 * 
 * Analyzes message patterns to infer learning type
 */
function classifyHeuristic(conversation: ParsedConversation): LearningClassification {
  const allText = conversation.messages.map(m => m.content.toLowerCase()).join(' ');
  
  // Count indicators for each type
  const indicators = {
    debugging: ['error', 'bug', 'fix', 'issue', 'problem', 'doesn\'t work', 'not working', 'failed'],
    practical: ['build', 'create', 'implement', 'code', 'write', 'develop', 'make', 'deploy'],
    conceptual: ['understand', 'explain', 'what is', 'why', 'how does', 'theory', 'concept', 'principle'],
    exploratory: ['learn about', 'new to', 'getting started', 'introduction', 'basics', 'overview'],
    deepDive: ['deep dive', 'advanced', 'detailed', 'comprehensive', 'in-depth', 'expert'],
  };
  
  const scores: Record<string, number> = {};
  for (const [type, words] of Object.entries(indicators)) {
    scores[type] = words.reduce((count, word) => {
      return count + (allText.split(word).length - 1);
    }, 0);
  }
  
  // Determine type with highest score
  const sortedTypes = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primaryType = sortedTypes[0][0];
  const primaryScore = sortedTypes[0][1];
  
  // Map to LearningType
  const typeMap: Record<string, LearningType> = {
    debugging: 'debugging',
    practical: 'practical',
    conceptual: 'conceptual',
    exploratory: 'exploratory',
    deepDive: 'deep-dive',
  };
  
  // Calculate confidence based on message exchange depth
  const messageCount = conversation.messageCount;
  const hasResolution = allText.includes('thanks') || allText.includes('solved') || allText.includes('worked');
  
  let confidence = 0.5; // Base confidence
  if (primaryScore > 3) confidence += 0.2; // Clear indicators
  if (messageCount > 5) confidence += 0.1; // Substantial conversation
  if (messageCount > 10) confidence += 0.1; // Deep conversation
  if (hasResolution) confidence += 0.1; // Resolution reached
  
  confidence = Math.min(confidence, 0.95); // Cap at 0.95
  
  return {
    learningType: typeMap[primaryType] || 'exploratory',
    confidenceScore: confidence,
    reasoning: `Heuristic: ${primaryScore} ${primaryType} indicators, ${messageCount} messages`,
  };
}

/**
 * LLM-based classification (accurate, comprehensive)
 * 
 * Uses GPT to analyze conversation and classify learning type with confidence
 * 
 * @param conversation - Parsed conversation to classify
 * @returns Promise resolving to classification result
 */
export async function classifyLearning(
  conversation: ParsedConversation
): Promise<LearningClassification> {
  try {
    // Build prompt with conversation excerpt
    const messagesText = conversation.messages
      .slice(0, 8) // First 8 messages capture intent well
      .map(m => `${m.role}: ${m.content.substring(0, 400)}`)
      .join('\n\n');
    
    const prompt = `Classify the learning type and depth for this conversation.

Conversation:
${messagesText}

Learning Types:
- conceptual: Understanding theory, concepts, "how does X work?"
- practical: Hands-on implementation, building, coding
- debugging: Problem-solving, fixing errors, troubleshooting
- exploratory: Discovering new topics, "what is X?", getting started
- deep-dive: In-depth study of familiar topic, advanced details

Confidence Score (0.0-1.0):
- How well did the user understand by conversation end?
- 0.0-0.3: Just introduced, many open questions
- 0.4-0.6: Decent understanding, some gaps
- 0.7-0.9: Good understanding, most questions answered
- 0.9-1.0: Deep mastery, teaching others

Return as JSON:
{
  "learningType": "one of the 5 types above",
  "confidenceScore": 0.75,
  "reasoning": "brief explanation of classification"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You classify learning conversations. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2, // Low temperature for consistent classification
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const result = JSON.parse(content) as LearningClassification;
    
    // Validate learning type
    const validTypes: LearningType[] = ['conceptual', 'practical', 'debugging', 'exploratory', 'deep-dive'];
    if (!validTypes.includes(result.learningType)) {
      console.warn(`Invalid learning type: ${result.learningType}, falling back to exploratory`);
      result.learningType = 'exploratory';
    }
    
    // Clamp confidence score
    result.confidenceScore = Math.max(0, Math.min(1, result.confidenceScore));
    
    return result;
    
  } catch (error) {
    console.error('Error classifying learning:', error);
    
    // Fallback to heuristic classification
    return classifyHeuristic(conversation);
  }
}
