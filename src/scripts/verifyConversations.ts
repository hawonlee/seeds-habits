#!/usr/bin/env tsx
/**
 * Verify Conversations File
 * Simple script to check if conversations.txt is valid
 */

import * as path from 'path';
import { loadConversationsFromFile } from '../lib/knowledge/conversationParser';

const CONVERSATIONS_FILE = path.join(process.cwd(), 'conversations.txt');

async function main() {
  console.log('=== Verifying Conversations File ===\n');
  
  try {
    console.log(`Loading: ${CONVERSATIONS_FILE}`);
    
    const conversations = await loadConversationsFromFile(CONVERSATIONS_FILE);
    
    console.log(`\n✓ Successfully parsed ${conversations.length} conversations`);
    
    if (conversations.length > 0) {
      const sample = conversations[0];
      console.log('\n--- Sample Conversation ---');
      console.log(`Title: ${sample.title}`);
      console.log(`ID: ${sample.id}`);
      console.log(`Timestamp: ${sample.timestamp}`);
      console.log(`Messages: ${sample.messageCount}`);
      console.log(`First message: ${sample.messages[0]?.content.substring(0, 100)}...`);
    }
    
    // Show distribution
    const messageCounts = conversations.map(c => c.messageCount);
    const avgMessages = messageCounts.reduce((a, b) => a + b, 0) / messageCounts.length;
    const maxMessages = Math.max(...messageCounts);
    
    console.log('\n--- Statistics ---');
    console.log(`Total conversations: ${conversations.length}`);
    console.log(`Avg messages per conversation: ${avgMessages.toFixed(1)}`);
    console.log(`Max messages in a conversation: ${maxMessages}`);
    
    // Time range
    const timestamps = conversations.map(c => c.timestamp.getTime());
    const minTime = new Date(Math.min(...timestamps));
    const maxTime = new Date(Math.max(...timestamps));
    
    console.log(`\nTime range: ${minTime.toLocaleDateString()} to ${maxTime.toLocaleDateString()}`);
    
    console.log('\n✓ Verification complete!');
    console.log('\nYou can now run: npm run build-lkg');
    
  } catch (error) {
    console.error('\n✗ Error:', error);
    process.exit(1);
  }
}

main();

