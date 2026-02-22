
-- Create activity_type enum
CREATE TYPE public.activity_type AS ENUM ('email', 'phone', 'meeting', 'linkedin', 'presentation', 'internal');

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT,
  company TEXT NOT NULL,
  country TEXT,
  region TEXT,
  vessel_type TEXT,
  vessel_segment TEXT,
  size TEXT,
  role TEXT,
  website TEXT,
  first_name TEXT,
  last_name TEXT,
  source TEXT,
  email TEXT,
  phone TEXT,
  last_contact_date DATE,
  next_action TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'New Lead',
  fleet_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_text TEXT NOT NULL,
  activity_type public.activity_type NOT NULL DEFAULT 'internal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_system_generated BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Companies RLS policies
CREATE POLICY "Authenticated users can view companies"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own companies or admins"
  ON public.companies FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Activities RLS policies
CREATE POLICY "Authenticated users can view activities"
  ON public.activities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activities"
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-update companies.updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when activity is inserted, update company's last_contact_date
CREATE OR REPLACE FUNCTION public.update_company_last_contact()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET last_contact_date = CURRENT_DATE
  WHERE id = NEW.company_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER activity_updates_last_contact
  AFTER INSERT ON public.activities
  FOR EACH ROW
  WHEN (NEW.is_system_generated = false)
  EXECUTE FUNCTION public.update_company_last_contact();
