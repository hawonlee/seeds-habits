-- Add metadata columns to lkg_nodes for UMAP coordinates
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS x numeric DEFAULT NULL;
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS y numeric DEFAULT NULL;
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS z numeric DEFAULT NULL;

-- Create table to track recompute history per user
CREATE TABLE IF NOT EXISTS lkg_recompute_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  last_recompute_at timestamp DEFAULT now(),
  node_count_at_recompute int NOT NULL,
  edges_created int NOT NULL,
  umap_computed boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- RLS for recompute metadata
ALTER TABLE lkg_recompute_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recompute metadata"
  ON lkg_recompute_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage recompute metadata"
  ON lkg_recompute_metadata FOR ALL TO service_role USING (true);

-- Index for faster queries
CREATE INDEX idx_lkg_recompute_user ON lkg_recompute_metadata(user_id);

