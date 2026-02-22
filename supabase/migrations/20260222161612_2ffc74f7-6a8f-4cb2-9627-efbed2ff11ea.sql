
-- Rename 'code' column to 'company_type' in companies table
ALTER TABLE public.companies RENAME COLUMN code TO company_type;

-- Add partner_stage column
ALTER TABLE public.companies ADD COLUMN partner_stage text;
