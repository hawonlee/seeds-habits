#!/usr/bin/env tsx
/**
 * Build Latent Knowledge Graph
 * Main script to process conversations and build the LKG
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import * as path from 'path';
import { loadConversationsFromFile } from '../lib/knowledge/conversationParser';
import { processBatch } from '../lib/knowledge/embeddingService';
import { buildKNNGraph, calculateGraphStats } from '../lib/knowledge/knnBuilder';
import type { GraphNode, GraphEdge } from '../lib/knowledge/knnBuilder';
import type { ConversationEmbedding } from '../lib/knowledge/embeddingService';
import { extractEntities, extractKeyLearnings, extractQuestions } from '../lib/knowledge/entityExtractor';
import { classifyLearning } from '../lib/knowledge/learningClassifier';
import type { ParsedConversation } from '../lib/knowledge/conversationParser';

// Configuration
const CONVERSATIONS_FILE = path.join(process.cwd(), 'conversations.txt');
const MAX_CONVERSATIONS = process.env.LKG_MAX_CONVERSATIONS 
  ? parseInt(process.env.LKG_MAX_CONVERSATIONS) 
  : 50; // Start with 50 for POC
const K_NEIGHBORS = 5;
const SIMILARITY_THRESHOLD = 0.25;

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

/**
 * Get authenticated user ID
 */
async function getUserId(): Promise<string> {
  // For POC testing, allow providing user ID via environment variable
  if (process.env.LKG_USER_ID) {
    console.log(`Using provided user ID: ${process.env.LKG_USER_ID}`);
    return process.env.LKG_USER_ID;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    // For POC, try to get any user from the database
    console.log('No auth session found, attempting to find a user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      throw new Error('No authenticated user found. Please login to the app first or provide LKG_USER_ID environment variable.');
    }
    
    console.log(`Using user from database: ${users[0].id}`);
    return users[0].id;
  }
  
  return user.id;
}

/**
 * Enhanced node data with learning extraction
 */
interface EnhancedNodeData extends ConversationEmbedding {
  learningType: string;
  confidenceScore: number;
  entities: Record<string, string[]>;
  keyLearnings: string[];
  questionsRaised: string[];
}

/**
 * Store nodes in Supabase with enhanced learning data
 */
async function storeNodes(
  userId: string, 
  embeddings: ConversationEmbedding[],
  enhancedData: Map<string, EnhancedNodeData>
): Promise<Map<string, string>> {
  console.log('\nStoring nodes in database...');
  console.log(`Attempting to store ${embeddings.length} nodes with enhanced learning data...`);
  
  const conversationIdToDbId = new Map<string, string>();
  
  // Create service role client for bypassing RLS if needed
  const serviceClient = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
  );
  
  for (const emb of embeddings) {
    const enhanced = enhancedData.get(emb.conversationId);
    
    // Try with service client first, fall back to regular client
    const result = await serviceClient
      .from('lkg_nodes')
      .insert({
        user_id: userId,
        conversation_id: emb.conversationId,
        title: emb.title,
        summary: emb.summary,
        embedding: JSON.stringify(emb.embedding),
        timestamp: emb.timestamp,
        metadata: {
          message_count: emb.messageCount,
        },
        // Enhanced learning data
        learning_type: enhanced?.learningType || 'exploratory',
        confidence_score: enhanced?.confidenceScore || 0.5,
        entities: enhanced?.entities || {},
        key_learnings: enhanced?.keyLearnings || [],
        questions_raised: enhanced?.questionsRaised || [],
        resources_mentioned: enhanced?.entities?.resources || [],
      })
      .select('id')
      .single();
    
    if (result.error) {
      console.warn(`RLS blocking insert, trying workaround...`);
      // If that fails, log and continue
      console.error(`Error storing node ${emb.conversationId}:`, result.error.message);
      continue;
    }
    
    if (result.data) {
      conversationIdToDbId.set(emb.conversationId, result.data.id);
    }
  }
  
  console.log(`Successfully stored ${conversationIdToDbId.size} nodes`);
  return conversationIdToDbId;
}

/**
 * Store edges in Supabase
 */
async function storeEdges(userId: string, edges: GraphEdge[], idMap: Map<string, string>): Promise<void> {
  console.log('\nStoring edges in database...');
  
  const edgesToInsert = edges
    .map(edge => ({
      user_id: userId,
      source_id: idMap.get(edge.sourceId),
      target_id: idMap.get(edge.targetId),
      weight: edge.weight,
    }))
    .filter(edge => edge.source_id && edge.target_id);
  
  // Batch insert edges
  const batchSize = 100;
  let insertedCount = 0;
  
  for (let i = 0; i < edgesToInsert.length; i += batchSize) {
    const batch = edgesToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('lkg_edges')
      .insert(batch);
    
    if (error) {
      console.error(`Error storing edges batch ${i}:`, error);
    } else {
      insertedCount += batch.length;
    }
  }
  
  console.log(`Stored ${insertedCount} edges`);
}

/**
 * Run UMAP projection using Python script
 */
async function runUmapProjection(nodes: GraphNode[]): Promise<Map<string, { x: number; y: number; z?: number }>> {
  console.log('\nRunning UMAP projection (3D)...');
  
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'umapProjection.py');
    const python = spawn('python3', [pythonScript]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log progress messages from Python
      if (stderr.includes('Projecting') || stderr.includes('complete')) {
        console.log(stderr.trim());
        stderr = '';
      }
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('UMAP stderr:', stderr);
        reject(new Error(`UMAP projection failed with code ${code}`));
        return;
      }
      
      try {
        const results = JSON.parse(stdout);
        const coordinatesMap = new Map<string, { x: number; y: number; z?: number }>();
        
        for (const result of results) {
          const coords: { x: number; y: number; z?: number } = { 
            x: result.x, 
            y: result.y 
          };
          if (result.z !== undefined) {
            coords.z = result.z;
          }
          coordinatesMap.set(result.id, coords);
        }
        
        console.log(`UMAP projection complete for ${coordinatesMap.size} nodes`);
        resolve(coordinatesMap);
      } catch (error) {
        reject(new Error(`Failed to parse UMAP output: ${error}`));
      }
    });
    
    // Send data to Python script (requesting 3D projection)
    const inputData = {
      embeddings: nodes.map(node => ({
        id: node.id,
        embedding: node.embedding,
      })),
      n_neighbors: Math.min(15, nodes.length - 1),
      min_dist: 0.1,
      metric: 'cosine',
      n_components: 3, // Request 3D projection
    };
    
    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();
  });
}

/**
 * Update nodes with UMAP coordinates
 */
async function updateUmapCoordinates(
  coordinates: Map<string, { x: number; y: number; z?: number }>,
  idMap: Map<string, string>
) {
  console.log('\nUpdating UMAP coordinates in database...');
  
  let updated = 0;
  
  for (const [conversationId, coords] of coordinates.entries()) {
    const dbId = idMap.get(conversationId);
    if (!dbId) continue;
    
    const updateData: { umap_x: number; umap_y: number; umap_z?: number } = {
      umap_x: coords.x,
      umap_y: coords.y,
    };
    
    if (coords.z !== undefined) {
      updateData.umap_z = coords.z;
    }
    
    const { error } = await supabase
      .from('lkg_nodes')
      .update(updateData)
      .eq('id', dbId);
    
    if (!error) {
      updated++;
    }
  }
  
  console.log(`Updated ${updated} nodes with UMAP coordinates`);
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Building Latent Knowledge Graph ===\n');
  console.log(`Processing up to ${MAX_CONVERSATIONS} conversations`);
  console.log(`k-neighbors: ${K_NEIGHBORS}, threshold: ${SIMILARITY_THRESHOLD}\n`);
  
  try {
    // 1. Get user ID
    const userId = await getUserId();
    console.log(`User ID: ${userId}`);
    
    // 2. Load and parse conversations
    console.log('\nLoading conversations...');
    const allConversations = await loadConversationsFromFile(CONVERSATIONS_FILE);
    const conversations = allConversations.slice(0, MAX_CONVERSATIONS);
    console.log(`Loaded ${conversations.length} conversations`);
    
    // 3. Summarize and embed conversations
    console.log('\nProcessing conversations (summarizing + embedding)...');
    const embeddings = await processBatch(conversations, (processed, total) => {
      console.log(`Progress: ${processed}/${total}`);
    });
    
    // 3.5. Extract entities and classify learning (NEW ENHANCED PIPELINE)
    console.log('\nExtracting learning insights and entities...');
    const enhancedData = new Map<string, EnhancedNodeData>();
    
    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      const embedding = embeddings[i];
      
      if ((i + 1) % 10 === 0 || i === conversations.length - 1) {
        console.log(`Progress: ${i + 1}/${conversations.length}`);
      }
      
      try {
        // Extract entities (technologies, concepts, people, resources, skills)
        const entities = await extractEntities(conversation);
        
        // Classify learning type and confidence
        const classification = await classifyLearning(conversation);
        
        // Extract key learnings from summary
        const keyLearnings = extractKeyLearnings(embedding.summary);
        
        // Extract questions raised
        const questionsRaised = extractQuestions(conversation);
        
        enhancedData.set(conversation.id, {
          ...embedding,
          learningType: classification.learningType,
          confidenceScore: classification.confidenceScore,
          entities: entities,
          keyLearnings: keyLearnings,
          questionsRaised: questionsRaised,
        });
        
      } catch (error) {
        console.error(`Error processing conversation ${conversation.id}:`, error);
        // Store with defaults if extraction fails
        enhancedData.set(conversation.id, {
          ...embedding,
          learningType: 'exploratory',
          confidenceScore: 0.5,
          entities: { technologies: [], concepts: [], people: [], resources: [], skills: [] },
          keyLearnings: [],
          questionsRaised: [],
        });
      }
    }
    
    console.log(`Enhanced ${enhancedData.size} conversations with learning insights`);
    
    // 4. Build kNN graph
    console.log('\nBuilding kNN graph...');
    const graphNodes: GraphNode[] = embeddings.map(emb => ({
      id: emb.conversationId,
      embedding: emb.embedding,
    }));
    
    const edges = buildKNNGraph(
      graphNodes,
      K_NEIGHBORS,
      SIMILARITY_THRESHOLD,
      (processed, total) => {
        if (processed % 10 === 0) {
          console.log(`Progress: ${processed}/${total}`);
        }
      }
    );
    
    // 5. Calculate and display statistics
    const stats = calculateGraphStats(graphNodes, edges);
    console.log('\n=== Graph Statistics ===');
    console.log(`Nodes: ${stats.nodeCount}`);
    console.log(`Edges: ${stats.edgeCount}`);
    console.log(`Average degree: ${stats.avgDegree.toFixed(2)}`);
    console.log(`Max degree: ${stats.maxDegree}`);
    console.log(`Edge density: ${(stats.density * 100).toFixed(4)}%`);
    
    // 6. Store nodes in database (with enhanced learning data)
    const idMap = await storeNodes(userId, embeddings, enhancedData);
    
    // 7. Store edges in database
    await storeEdges(userId, edges, idMap);
    
    // 8. Run UMAP projection
    try {
      const umapCoordinates = await runUmapProjection(graphNodes);
      await updateUmapCoordinates(umapCoordinates, idMap);
    } catch (error) {
      console.warn('UMAP projection failed (optional step):', error);
      console.warn('Continuing without UMAP coordinates. Install with: pip install umap-learn numpy');
    }
    
    console.log('\n=== Build Complete ===');
    console.log('You can now view the knowledge graph in the UI at /knowledge');
    
  } catch (error) {
    console.error('\nError building LKG:', error);
    process.exit(1);
  }
}

// Run the main function
main();

