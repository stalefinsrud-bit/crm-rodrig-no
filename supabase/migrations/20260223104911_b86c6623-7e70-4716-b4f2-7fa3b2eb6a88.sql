ALTER TABLE public.companies ADD COLUMN code text;
CREATE INDEX idx_companies_code ON public.companies(code);