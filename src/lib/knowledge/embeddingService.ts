/**
 * Embedding Service - Handles LLM summarization and embedding generation
 * 
 * This module provides functions to:
 * 1. Summarize conversations using GPT-4o-mini
 * 2. Generate semantic embeddings using text-embedding-3-large
 * 3. Process conversations in batches with rate limiting
 * 
 * @module embeddingService
 */

import OpenAI from 'openai';
import type { ParsedConversation } from './conversationParser';
import { formatConversationText } from './conversationParser';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

/**
 * Represents a summarized conversation
 */
export interface ConversationSummary {
  /** Original conversation ID */
  conversationId: string;
  /** Conversation title */
  title: string;
  /** AI-generated summary (2-3 sentences) */
  summary: string;
  /** Creation timestamp */
  timestamp: Date;
  /** Number of messages in conversation */
  messageCount: number;
}

/**
 * Represents a conversation with both summary and embedding
 */
export interface ConversationEmbedding extends ConversationSummary {
  /** 3072-dimensional embedding vector */
  embedding: number[];
}

/**
 * Summarize a conversation using GPT-4o-mini
 * 
 * Creates a concise 2-3 sentence summary focusing on main topics, key insights,
 * and actionable outcomes. Falls back to first message if API call fails.
 * 
 * @param conversation - Parsed conversation to summarize
 * @returns Promise resolving to conversation summary
 * @throws Never throws - failures return fallback summary
 * 
 * @example
 * ```typescript
 * const summary = await summarizeConversation(conversation);
 * console.log(summary.summary);
 * // "This conversation discusses React hooks and state management..."
 * ```
 */
export async function summarizeConversation(
  conversation: ParsedConversation
): Promise<ConversationSummary> {
  try {
    const conversationText = formatConversationText(conversation);
    
    const prompt = `Summarize this conversation in 2-3 sentences, focusing on:
- Main topics discussed
- Key insights or questions
- Any actionable outcomes

${conversationText}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of conversations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content?.trim() || 'No summary available.';

    return {
      conversationId: conversation.id,
      title: conversation.title,
      summary,
      timestamp: conversation.timestamp,
      messageCount: conversation.messageCount,
    };
  } catch (error) {
    console.error(`Error summarizing conversation ${conversation.id}:`, error);
    
    // Fallback: use title and first message
    const fallbackSummary = conversation.messages[0]?.content.substring(0, 200) || conversation.title;
    
    return {
      conversationId: conversation.id,
      title: conversation.title,
      summary: fallbackSummary,
      timestamp: conversation.timestamp,
      messageCount: conversation.messageCount,
    };
  }
}

/**
 * Generate embedding for a summary using text-embedding-3-large
 * 
 * Creates a 3072-dimensional semantic embedding vector. These embeddings
 * capture the meaning of the text and can be compared using cosine similarity.
 * 
 * @param text - Text to embed (typically title + summary)
 * @returns Promise resolving to 3072-dimensional embedding vector
 * @throws Error if API call fails
 * 
 * @example
 * ```typescript
 * const embedding = await generateEmbedding("Discussion about React hooks");
 * console.log(embedding.length); // 3072
 * ```
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Summarize and embed a conversation
 * 
 * Convenience function that combines summarization and embedding into one step.
 * The embedding is generated from the combined title and summary for richer
 * semantic representation.
 * 
 * @param conversation - Parsed conversation to process
 * @returns Promise resolving to conversation with summary and embedding
 * 
 * @example
 * ```typescript
 * const result = await processConversation(conversation);
 * console.log(result.summary);     // "This conversation..."
 * console.log(result.embedding.length);  // 3072
 * ```
 */
export async function processConversation(
  conversation: ParsedConversation
): Promise<ConversationEmbedding> {
  const summary = await summarizeConversation(conversation);
  
  // Embed the combined title + summary for richer representation
  const textToEmbed = `${summary.title}\n\n${summary.summary}`;
  const embedding = await generateEmbedding(textToEmbed);

  return {
    ...summary,
    embedding,
  };
}

/**
 * Process conversations in batches with rate limiting
 * 
 * Processes multiple conversations efficiently while respecting OpenAI API rate limits.
 * Conversations are processed in parallel batches with delays between batches.
 * 
 * Rate limiting strategy:
 * - Batch size: 5 conversations
 * - Delay between batches: 1000ms
 * - Prevents rate limit errors while maintaining good throughput
 * 
 * @param conversations - Array of conversations to process
 * @param onProgress - Optional callback for progress tracking (processed, total)
 * @returns Promise resolving to array of conversation embeddings
 * 
 * @example
 * ```typescript
 * const results = await processBatch(conversations, (done, total) => {
 *   console.log(`Progress: ${done}/${total}`);
 * });
 * console.log(`Processed ${results.length} conversations`);
 * ```
 */
export async function processBatch(
  conversations: ParsedConversation[],
  onProgress?: (processed: number, total: number) => void
): Promise<ConversationEmbedding[]> {
  const results: ConversationEmbedding[] = [];
  const batchSize = 5; // Process 5 at a time to avoid rate limits
  const delayMs = 1000; // 1 second delay between batches

  for (let i = 0; i < conversations.length; i += batchSize) {
    const batch = conversations.slice(i, i + batchSize);
    
    const batchPromises = batch.map(conv => processConversation(conv));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(results.length, conversations.length);
    }

    // Rate limiting delay (except for last batch)
    if (i + batchSize < conversations.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

