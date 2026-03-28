
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', false);

CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-uploads');

CREATE POLICY "Authenticated users can read chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-uploads');
