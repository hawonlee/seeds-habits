#!/usr/bin/env node
/**
 * UMAP Integration Script
 * 
 * Fetches embeddings from Supabase, runs Python UMAP projection,
 * and uploads the resulting 3D coordinates back to the database.
 * 
 * Usage:
 *   export SUPABASE_SERVICE_KEY="your-service-key"
 *   npm run umap-project -- <user_id>
 * 
 * @requires Python 3.8+ with umap-learn installed
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!; // Need service role key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.error('');
  console.error('Please set:');
  console.error('  VITE_SUPABASE_URL - Your Supabase project URL');
  console.error('  SUPABASE_SERVICE_KEY - Your service role key (from Supabase Dashboard)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node fetchAndProjectUMAP.ts <user_id>');
    console.error('');
    console.error('To get your user ID:');
    console.error('  ./get-user-id.sh');
    process.exit(1);
  }

  console.log(`Fetching embeddings for user ${userId}...`);

  // Fetch all nodes with embeddings
  const { data: nodes, error } = await supabase
    .from('lkg_nodes')
    .select('id, embedding')
    .eq('user_id', userId);

  if (error) throw error;
  if (!nodes || nodes.length === 0) {
    console.error('No nodes found for user');
    process.exit(1);
  }

  console.log(`Fetched ${nodes.length} nodes`);

  // Write embeddings to temp file
  const inputFile = path.join(__dirname, 'umap_input.json');
  const outputFile = path.join(__dirname, 'umap_output.json');

  fs.writeFileSync(inputFile, JSON.stringify({
    embeddings: nodes.map(n => ({ id: n.id, embedding: n.embedding })),
    n_components: 3,
    metric: 'cosine',
  }));

  console.log('Running UMAP projection...');
  console.log('(This may take 1-2 minutes for 100+ nodes)');

  try {
    // Call Python script
    const pythonScript = path.join(__dirname, 'umapProjection.py');
    execSync(`cat ${inputFile} | python3 ${pythonScript} > ${outputFile}`, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('');
    console.error('Failed to run UMAP projection.');
    console.error('Make sure Python 3 and umap-learn are installed:');
    console.error('  pip install umap-learn numpy');
    fs.unlinkSync(inputFile);
    process.exit(1);
  }

  console.log('UMAP projection complete');

  // Read results
  const results = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

  console.log(`Updating ${results.length} node positions...`);

  // Update nodes in database
  for (const result of results) {
    await supabase
      .from('lkg_nodes')
      .update({ x: result.x, y: result.y, z: result.z })
      .eq('id', result.id);
  }

  // Update metadata to mark UMAP as computed
  await supabase
    .from('lkg_recompute_metadata')
    .update({ umap_computed: true })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('✅ UMAP positions updated in database');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Refresh the Knowledge Graph page');
  console.log('  2. Your graph will now display semantic clustering!');

  // Cleanup
  fs.unlinkSync(inputFile);
  fs.unlinkSync(outputFile);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

