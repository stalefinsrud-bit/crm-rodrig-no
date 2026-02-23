import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
  created_by: string | null;
}

export function useCompanyContacts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId!)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'created_at'>) => {
      // If marking as primary, unset other primaries first
      if (contact.is_primary) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('company_id', contact.company_id);
      }
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['contacts', data.company_id] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string; company_id: string }) => {
      if (updates.is_primary) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('company_id', updates.company_id);
      }
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['contacts', data.company_id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, company_id }: { id: string; company_id: string }) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { company_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['contacts', data.company_id] });
    },
  });
}
