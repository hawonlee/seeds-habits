-- Latent Knowledge Graph Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension for storing embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversation nodes with embeddings
CREATE TABLE lkg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,  
  embedding vector(3072), -- text-embedding-3-large dimension
  timestamp TIMESTAMPTZ NOT NULL,
  umap_x REAL, -- Precomputed UMAP coordinates
  umap_y REAL,
  metadata JSONB DEFAULT '{}', -- {message_count, tokens, etc}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Computed kNN edges
CREATE TABLE lkg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES lkg_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES lkg_nodes(id) ON DELETE CASCADE,
  weight REAL NOT NULL, -- cosine similarity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lkg_nodes_user ON lkg_nodes(user_id);
CREATE INDEX idx_lkg_nodes_timestamp ON lkg_nodes(timestamp);
CREATE INDEX idx_lkg_nodes_conversation ON lkg_nodes(conversation_id);
CREATE INDEX idx_lkg_edges_source ON lkg_edges(source_id);
CREATE INDEX idx_lkg_edges_target ON lkg_edges(target_id);
CREATE INDEX idx_lkg_edges_user ON lkg_edges(user_id);

-- Enable Row Level Security
ALTER TABLE lkg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lkg_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage their own nodes" 
ON lkg_nodes FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own edges" 
ON lkg_edges FOR ALL 
USING (auth.uid() = user_id);

