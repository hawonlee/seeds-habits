-- Create storage bucket for knowledge graph uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-graph-uploads',
  'knowledge-graph-uploads',
  false, -- Private bucket
  104857600, -- 100MB limit
  ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for knowledge-graph-uploads bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-graph-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-graph-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-graph-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can access all files (for Edge Function)
CREATE POLICY "Service role can read all files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-graph-uploads' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can delete all files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-graph-uploads' AND
  auth.role() = 'service_role'
);

