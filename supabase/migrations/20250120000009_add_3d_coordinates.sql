-- Add 3D coordinate support for knowledge graph visualization
-- Migration: 20250120000009_add_3d_coordinates.sql

-- Add z-coordinate for 3D UMAP projection
ALTER TABLE lkg_nodes ADD COLUMN IF NOT EXISTS umap_z REAL;

-- Add index for faster spatial queries (optional but useful)
CREATE INDEX IF NOT EXISTS idx_lkg_nodes_umap_z ON lkg_nodes(umap_z);

COMMENT ON COLUMN lkg_nodes.umap_z IS 'Z-coordinate for 3D UMAP visualization';

