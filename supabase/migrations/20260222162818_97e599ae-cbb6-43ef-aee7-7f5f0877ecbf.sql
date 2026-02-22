
-- Create board_snapshots table for storing performance snapshots
CREATE TABLE public.board_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  filters JSONB NOT NULL DEFAULT '{}',
  kpi_data JSONB NOT NULL DEFAULT '{}',
  funnel_data JSONB NOT NULL DEFAULT '{}',
  partner_conversion_rate NUMERIC,
  total_pipeline INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.board_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view snapshots"
ON public.board_snapshots FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
ON public.board_snapshots FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can delete snapshots"
ON public.board_snapshots FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
