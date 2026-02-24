import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user_preferences', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const markComplete = useMutation({
    mutationFn: async () => {
      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ onboarding_completed: true })
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({ user_id: user!.id, onboarding_completed: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences', user?.id] });
    },
  });

  return {
    showOnboarding: !isLoading && !!user && !preferences?.onboarding_completed,
    isLoading,
    markComplete: markComplete.mutate,
  };
}
