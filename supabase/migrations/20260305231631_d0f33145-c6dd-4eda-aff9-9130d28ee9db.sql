
-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public) VALUES ('facturas', 'facturas', true) ON CONFLICT DO NOTHING;

-- Allow public read for facturas bucket
CREATE POLICY "Public can read facturas" ON storage.objects FOR SELECT USING (bucket_id = 'facturas');

-- Allow admins to upload facturas
CREATE POLICY "Admins can upload facturas" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'facturas' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete facturas
CREATE POLICY "Admins can delete facturas" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'facturas' AND has_role(auth.uid(), 'admin'::app_role));
