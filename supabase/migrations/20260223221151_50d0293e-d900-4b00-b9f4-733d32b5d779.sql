
-- Add soft delete support to companies
ALTER TABLE public.companies ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

-- Create index for filtering non-deleted companies
CREATE INDEX idx_companies_is_deleted ON public.companies (is_deleted);
