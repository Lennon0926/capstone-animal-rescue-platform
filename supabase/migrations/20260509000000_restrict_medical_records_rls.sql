-- Restrict medical_records RLS: drop overly permissive public read policy
-- and replace with service_role-only read to protect sensitive veterinary data.
DROP POLICY IF EXISTS "Allow public read access on medical_records" ON public.medical_records;

CREATE POLICY "Allow service role read access on medical_records"
    ON public.medical_records FOR SELECT
    USING (auth.role() = 'service_role');
