import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'owner' | 'editor';

export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['userRole', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data.role as AppRole;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** @deprecated Use useUserRole instead */
export function useIsAdmin() {
  const { data: role, ...rest } = useUserRole();
  return { data: role === 'owner', ...rest };
}

export function useIsOwner() {
  const { data: role, ...rest } = useUserRole();
  return { data: role === 'owner', ...rest };
}
