ALTER TABLE bikes
  ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-photos', 'bike-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "bike photos auth read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bike-photos');

CREATE POLICY "bike photos auth write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bike-photos' AND auth.role() = 'authenticated');

CREATE POLICY "bike photos auth update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'bike-photos' AND auth.role() = 'authenticated');

CREATE POLICY "bike photos auth delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'bike-photos' AND auth.role() = 'authenticated');
