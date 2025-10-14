/**
 * Entity Extractor - Extracts structured entities from conversations
 * 
 * Identifies and categorizes:
 * - Technologies (languages, frameworks, tools)
 * - Concepts (abstract ideas, patterns, principles)
 * - People (experts, authors mentioned)
 * - Resources (links, documentation, books)
 * - Skills (actionable capabilities)
 * 
 * Uses hybrid approach: keyword matching + LLM extraction
 * 
 * @module entityExtractor
 */

import OpenAI from 'openai';
import type { ParsedConversation } from './conversationParser';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

/**
 * Extracted entities from a conversation
 */
export interface ExtractedEntities {
  /** Programming languages, frameworks, libraries, tools */
  technologies: string[];
  /** Abstract concepts, patterns, principles */
  concepts: string[];
  /** People mentioned (authors, experts) */
  people: string[];
  /** Resources referenced (URLs, books, docs) */
  resources: string[];
  /** Actionable skills or capabilities */
  skills: string[];
}

/**
 * Common technology keywords for fast extraction
 */
const TECH_KEYWORDS = new Set([
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
  'Ruby', 'PHP', 'HTML', 'CSS', 'SQL', 'Bash', 'Shell',
  // Frameworks/Libraries
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'Express', 'FastAPI', 'Django', 'Flask',
  'Spring', 'Laravel', 'Rails', 'TensorFlow', 'PyTorch', 'Keras',
  // Tools
  'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Firebase', 'Supabase', 'PostgreSQL',
  'MongoDB', 'Redis', 'Nginx', 'Apache', 'VSCode', 'Vim', 'Webpack', 'Vite', 'npm', 'yarn',
  // Concepts (common ones)
  'API', 'REST', 'GraphQL', 'OAuth', 'JWT', 'WebSocket', 'HTTP', 'HTTPS', 'DNS', 'CDN',
]);

/**
 * Extract entities using keyword matching (fast, for common terms)
 */
function extractKeywordEntities(text: string): Partial<ExtractedEntities> {
  const technologies: Set<string> = new Set();
  const textUpper = text.toUpperCase();
  
  // Check for tech keywords
  for (const tech of TECH_KEYWORDS) {
    const techUpper = tech.toUpperCase();
    if (textUpper.includes(techUpper)) {
      technologies.add(tech);
    }
  }
  
  return {
    technologies: Array.from(technologies),
  };
}

/**
 * Extract entities using LLM (comprehensive, for nuanced extraction)
 * 
 * @param conversation - Parsed conversation to extract from
 * @returns Promise resolving to extracted entities
 */
export async function extractEntities(
  conversation: ParsedConversation
): Promise<ExtractedEntities> {
  try {
    // Fast keyword extraction first
    const keywordEntities = extractKeywordEntities(
      conversation.messages.map(m => m.content).join(' ')
    );
    
    // Build prompt for LLM extraction
    const messagesText = conversation.messages
      .slice(0, 10) // Limit to first 10 messages for token efficiency
      .map(m => `${m.role}: ${m.content.substring(0, 500)}`)
      .join('\n\n');
    
    const prompt = `Extract structured entities from this conversation. Be specific and concise.

Conversation:
${messagesText}

Extract ONLY entities that are clearly mentioned or central to the discussion. Return as JSON:
{
  "technologies": ["specific frameworks, languages, tools mentioned"],
  "concepts": ["key ideas, patterns, principles discussed"],
  "people": ["experts, authors referenced by name"],
  "resources": ["books, URLs, documentation mentioned"],
  "skills": ["actionable capabilities: 'debugging', 'API integration', etc."]
}

Keep arrays focused (max 5 items each). Use empty arrays if category not applicable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You extract structured entities from conversations. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const llmEntities = JSON.parse(content) as ExtractedEntities;
    
    // Merge keyword and LLM extractions (LLM takes precedence, deduplicate)
    const merged: ExtractedEntities = {
      technologies: [
        ...new Set([
          ...(keywordEntities.technologies || []),
          ...(llmEntities.technologies || []),
        ])
      ].slice(0, 10), // Limit total
      concepts: (llmEntities.concepts || []).slice(0, 8),
      people: (llmEntities.people || []).slice(0, 5),
      resources: (llmEntities.resources || []).slice(0, 5),
      skills: (llmEntities.skills || []).slice(0, 8),
    };
    
    return merged;
    
  } catch (error) {
    console.error('Error extracting entities:', error);
    
    // Fallback: return keyword extraction only
    return {
      technologies: keywordEntities.technologies || [],
      concepts: [],
      people: [],
      resources: [],
      skills: [],
    };
  }
}

/**
 * Extract key learnings from conversation summary
 * 
 * Parses the summary to identify specific things learned
 * 
 * @param summary - Conversation summary text
 * @returns Array of key learning points
 */
export function extractKeyLearnings(summary: string): string[] {
  // Simple heuristic: look for sentences with learning indicators
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const learningIndicators = [
    'learned', 'understood', 'discovered', 'explored', 'implemented',
    'solved', 'debugged', 'figured out', 'realized', 'grasped',
  ];
  
  const keyLearnings = sentences.filter(sentence => {
    const lower = sentence.toLowerCase();
    return learningIndicators.some(indicator => lower.includes(indicator));
  }).map(s => s.trim());
  
  return keyLearnings.slice(0, 5); // Max 5 key learnings
}

/**
 * Extract questions that were raised (answered or unanswered)
 * 
 * @param conversation - Parsed conversation
 * @returns Array of questions
 */
export function extractQuestions(conversation: ParsedConversation): string[] {
  const questions: string[] = [];
  
  for (const message of conversation.messages) {
    if (message.role === 'user') {
      // Extract sentences ending with '?'
      const questionSentences = message.content
        .split(/[.!]/)
        .filter(s => s.trim().endsWith('?'))
        .map(s => s.trim());
      
      questions.push(...questionSentences);
    }
  }
  
  // Return first 5 most substantial questions
  return questions
    .filter(q => q.split(' ').length > 3) // At least 4 words
    .slice(0, 5);
}

