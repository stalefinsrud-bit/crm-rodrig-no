
-- Enums
CREATE TYPE public.prospect_list AS ENUM (
  'December 2025 – Dealers/Partners',
  'Master Ship Operator – End Users'
);

CREATE TYPE public.prospect_status AS ENUM (
  'New Lead',
  'Contacted',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Agreement Signed',
  'Lost',
  'On Hold'
);

CREATE TYPE public.prospect_priority AS ENUM ('High', 'Medium', 'Low');

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Prospects table
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_list prospect_list NOT NULL DEFAULT 'December 2025 – Dealers/Partners',
  company TEXT NOT NULL,
  country TEXT,
  segment TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  status prospect_status NOT NULL DEFAULT 'New Lead',
  probability INTEGER NOT NULL DEFAULT 5,
  estimated_value NUMERIC(15,2) DEFAULT 0,
  weighted_value NUMERIC(15,2) GENERATED ALWAYS AS (estimated_value * probability / 100) STORED,
  priority prospect_priority NOT NULL DEFAULT 'Medium',
  notes_internal TEXT,
  date_contacted DATE,
  next_followup DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prospects" ON public.prospects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert prospects" ON public.prospects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update prospects" ON public.prospects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete prospects" ON public.prospects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set probability based on status
CREATE OR REPLACE FUNCTION public.set_probability_from_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.probability := CASE NEW.status
    WHEN 'New Lead' THEN 5
    WHEN 'Contacted' THEN 15
    WHEN 'Meeting Scheduled' THEN 30
    WHEN 'Proposal Sent' THEN 50
    WHEN 'Negotiation' THEN 70
    WHEN 'Agreement Signed' THEN 100
    WHEN 'Lost' THEN 0
    WHEN 'On Hold' THEN 10
    ELSE 5
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_set_probability
  BEFORE INSERT OR UPDATE OF status ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_probability_from_status();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
