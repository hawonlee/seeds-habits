-- Enhanced Learning Extraction Schema
-- Adds columns to support learning-focused knowledge graph

-- Add learning classification and metadata
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS learning_type TEXT;
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1);

-- Add extracted entities (stored as JSONB for flexibility)
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '{"technologies": [], "concepts": [], "people": [], "resources": [], "skills": []}';

-- Add learning insights
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS key_learnings TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS questions_raised TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS resources_mentioned TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add 3D visualization support
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS umap_z REAL;

-- Add clustering support
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS cluster_id INTEGER;
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS cluster_label TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lkg_nodes_learning_type ON lkg_nodes(learning_type);
CREATE INDEX IF NOT EXISTS idx_lkg_nodes_confidence ON lkg_nodes(confidence_score);
CREATE INDEX IF NOT EXISTS idx_lkg_nodes_cluster ON lkg_nodes(cluster_id);

-- Create GIN index for entity searches (JSONB)
CREATE INDEX IF NOT EXISTS idx_lkg_nodes_entities ON lkg_nodes USING GIN (entities);

-- Add comments for documentation
COMMENT ON COLUMN lkg_nodes.learning_type IS 'Type of learning: conceptual, practical, debugging, exploratory, deep-dive';
COMMENT ON COLUMN lkg_nodes.confidence_score IS 'Understanding depth (0-1): 0=beginner, 1=expert';
COMMENT ON COLUMN lkg_nodes.entities IS 'Extracted entities: {technologies, concepts, people, resources, skills}';
COMMENT ON COLUMN lkg_nodes.key_learnings IS 'Main takeaways and learnings from conversation';
COMMENT ON COLUMN lkg_nodes.questions_raised IS 'Questions asked (answered or unanswered)';
COMMENT ON COLUMN lkg_nodes.resources_mentioned IS 'URLs, documentation, books referenced';
COMMENT ON COLUMN lkg_nodes.umap_z IS 'Z-coordinate for 3D UMAP projection';
COMMENT ON COLUMN lkg_nodes.cluster_id IS 'Topic cluster ID from community detection';
COMMENT ON COLUMN lkg_nodes.cluster_label IS 'Human-readable cluster label (LLM-generated)';

