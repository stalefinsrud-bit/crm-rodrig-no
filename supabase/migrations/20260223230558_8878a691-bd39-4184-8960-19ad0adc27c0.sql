
-- 1. Drop ALL policies that depend on has_role function
DROP POLICY IF EXISTS "Admins can delete prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can update prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can update own companies or admins" ON public.companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can delete activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can delete snapshots" ON public.board_snapshots;

-- 2. Drop has_role function
DROP FUNCTION public.has_role(uuid, app_role);

-- 3. Convert role column to text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;

-- 4. Update existing roles
UPDATE public.user_roles SET role = 'owner' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'editor' WHERE role = 'user';

-- 5. Recreate enum
DROP TYPE public.app_role;
CREATE TYPE public.app_role AS ENUM ('owner', 'editor');

-- 6. Cast column back
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- 7. Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 8. Recreate companies RLS
CREATE POLICY "Owner can delete companies"
ON public.companies FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Authenticated users can update companies"
ON public.companies FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'editor') OR created_by = auth.uid());

-- 9. Recreate activities RLS
CREATE POLICY "Authenticated users can delete own activities"
ON public.activities FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR created_by = auth.uid());

-- 10. Recreate board_snapshots RLS
CREATE POLICY "Owner can delete snapshots"
ON public.board_snapshots FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- 11. Recreate prospects RLS
CREATE POLICY "Owner can delete prospects"
ON public.prospects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Authenticated users can update prospects"
ON public.prospects FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'editor'));

-- 12. Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 13. Migrate existing contact data
INSERT INTO public.contacts (company_id, first_name, last_name, email, phone, role, is_primary, created_by)
SELECT id, first_name, last_name, email, phone, role, true, created_by
FROM public.companies
WHERE first_name IS NOT NULL OR last_name IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL;

-- 14. RLS for contacts
CREATE POLICY "Authenticated users can view contacts"
ON public.contacts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert contacts"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Authenticated users can update contacts"
ON public.contacts FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Authenticated users can delete contacts"
ON public.contacts FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'editor'));

-- 15. Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'editor');
  
  RETURN NEW;
END;
$$;
