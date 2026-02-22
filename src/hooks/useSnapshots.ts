import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Snapshot {
  id: string;
  snapshot_date: string;
  filters: Record<string, string>;
  kpi_data: Record<string, number>;
  funnel_data: Record<string, number>;
  partner_conversion_rate: number | null;
  total_pipeline: number;
  created_by: string | null;
  created_at: string;
}

export function useSnapshots() {
  return useQuery({
    queryKey: ['board_snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Snapshot[];
    },
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (snapshot: {
      filters: Record<string, string>;
      kpi_data: Record<string, number>;
      funnel_data: Record<string, number>;
      partner_conversion_rate: number | null;
      total_pipeline: number;
      created_by: string | null;
    }) => {
      const { data, error } = await supabase
        .from('board_snapshots')
        .insert(snapshot)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board_snapshots'] });
    },
  });
}
