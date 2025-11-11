-- Create storage bucket for department files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'department-files',
  'department-files',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload department files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'department-files');

-- Policy: Allow public read access to files (since bucket is public)
CREATE POLICY "Public read access for department files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'department-files');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own department files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'department-files' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'department-files' AND auth.uid() = owner);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own department files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'department-files' AND auth.uid() = owner);
