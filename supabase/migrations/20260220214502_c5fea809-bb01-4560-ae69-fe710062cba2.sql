
-- Tighten INSERT policy to require created_by = auth.uid()
DROP POLICY "Authenticated users can insert prospects" ON public.prospects;
CREATE POLICY "Authenticated users can insert prospects" ON public.prospects 
  FOR INSERT TO authenticated 
  WITH CHECK (created_by = auth.uid());

-- Tighten UPDATE policy to authenticated users only (not true)
DROP POLICY "Authenticated users can update prospects" ON public.prospects;
CREATE POLICY "Authenticated users can update prospects" ON public.prospects 
  FOR UPDATE TO authenticated 
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
