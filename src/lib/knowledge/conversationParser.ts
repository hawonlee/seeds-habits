/**
 * Conversation Parser - Extracts messages from ChatGPT export format
 * 
 * This module parses the complex nested JSON structure exported from ChatGPT
 * and extracts user/assistant message pairs for processing.
 * 
 * @module conversationParser
 */

/**
 * Represents a single message in a conversation
 */
export interface Message {
  /** Role of the message author */
  role: 'user' | 'assistant' | 'system';
  /** Text content of the message */
  content: string;
  /** Unix timestamp of message creation (optional) */
  timestamp?: number;
}

/**
 * Represents a parsed conversation with extracted messages
 */
export interface ParsedConversation {
  /** Unique conversation ID from ChatGPT */
  id: string;
  /** User-defined or auto-generated title */
  title: string;
  /** Creation timestamp */
  timestamp: Date;
  /** Array of messages in conversation order */
  messages: Message[];
  /** Total number of messages */
  messageCount: number;
}

interface ConversationNode {
  id: string;
  message: {
    id: string;
    author: {
      role: string;
    };
    content: {
      content_type: string;
      parts: string[];
    };
    create_time: number | null;
  } | null;
  children: string[];
}

interface RawConversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ConversationNode>;
}

/**
 * Parse ChatGPT conversations.txt export file
 * 
 * @param jsonData - Array of raw conversation objects from ChatGPT export
 * @returns Array of parsed conversations with extracted messages
 * 
 * @example
 * ```typescript
 * const raw = JSON.parse(fs.readFileSync('conversations.txt', 'utf-8'));
 * const conversations = parseConversations(raw);
 * console.log(`Parsed ${conversations.length} conversations`);
 * ```
 */
export function parseConversations(jsonData: RawConversation[]): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];

  for (const conv of jsonData) {
    try {
      const messages = extractMessages(conv.mapping);
      
      // Skip conversations with no meaningful content
      if (messages.length === 0) {
        continue;
      }

      conversations.push({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        timestamp: new Date(conv.create_time * 1000),
        messages,
        messageCount: messages.length,
      });
    } catch (error) {
      console.error(`Error parsing conversation ${conv.id}:`, error);
    }
  }

  return conversations;
}

/**
 * Extract messages from the conversation mapping structure
 * Follows the tree structure from root to leaves using depth-first traversal
 * 
 * ChatGPT conversations are stored as a tree (branching conversations), but we
 * follow the main thread (first child) for simplicity.
 * 
 * @param mapping - Conversation node mapping from ChatGPT export
 * @returns Array of messages in conversation order
 * @private
 */
function extractMessages(mapping: Record<string, ConversationNode>): Message[] {
  const messages: Message[] = [];
  
  // Find the root node
  const rootNode = Object.values(mapping).find(
    node => node.id === 'client-created-root' || node.message === null
  );
  
  if (!rootNode) {
    return messages;
  }

  // Traverse the conversation tree (depth-first)
  const visited = new Set<string>();
  
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = mapping[nodeId];
    if (!node) return;

    // Extract message content if present
    if (node.message?.content?.parts && Array.isArray(node.message.content.parts)) {
      const role = node.message.author?.role;
      const content = node.message.content.parts.join('\n').trim();
      
      // Only include user and assistant messages with content
      if ((role === 'user' || role === 'assistant') && content) {
        messages.push({
          role: role as 'user' | 'assistant',
          content,
          timestamp: node.message.create_time || undefined,
        });
      }
    }

    // Traverse children (follow the main branch - first child)
    if (node.children && node.children.length > 0) {
      // In most cases, follow the first child (main conversation thread)
      traverse(node.children[0]);
    }
  }

  traverse(rootNode.id);

  return messages;
}

/**
 * Format messages into a single text for summarization
 * 
 * Converts a parsed conversation into a human-readable format suitable for
 * LLM summarization. Long messages are truncated to prevent token overflow.
 * 
 * @param conversation - Parsed conversation to format
 * @returns Formatted text with "User:" and "Assistant:" prefixes
 * 
 * @example
 * ```typescript
 * const formatted = formatConversationText(conversation);
 * // Output:
 * // Title: How to learn React
 * //
 * // User: How do I get started with React?
 * // Assistant: React is a JavaScript library...
 * ```
 */
export function formatConversationText(conversation: ParsedConversation): string {
  const lines = [`Title: ${conversation.title}`, ''];
  
  for (const msg of conversation.messages) {
    const prefix = msg.role === 'user' ? 'User:' : 'Assistant:';
    // Truncate very long messages
    const content = msg.content.length > 2000 
      ? msg.content.substring(0, 2000) + '...' 
      : msg.content;
    lines.push(`${prefix} ${content}`, '');
  }

  return lines.join('\n');
}

/**
 * Load and parse conversations from file
 * 
 * Convenience function that reads a file and parses it in one step.
 * 
 * @param filePath - Path to conversations.txt file
 * @returns Promise resolving to array of parsed conversations
 * @throws Error if file doesn't exist, is not valid JSON, or is not an array
 * 
 * @example
 * ```typescript
 * const conversations = await loadConversationsFromFile('./conversations.txt');
 * console.log(`Loaded ${conversations.length} conversations`);
 * ```
 */
export async function loadConversationsFromFile(filePath: string): Promise<ParsedConversation[]> {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    if (!Array.isArray(jsonData)) {
      throw new Error('Invalid conversations format: expected array');
    }

    return parseConversations(jsonData);
  } catch (error) {
    console.error('Error loading conversations file:', error);
    throw error;
  }
}

