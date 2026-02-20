import { useState, useMemo } from 'react';
import { useProspects, useUpdateProspect, useCreateProspect } from '@/hooks/useProspects';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import type { ProspectStatus, ProspectPriority, ProspectList } from '@/types/prospect';
import { isAfter, isBefore, parseISO } from 'date-fns';

const STATUSES: ProspectStatus[] = ['New Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed', 'Lost', 'On Hold'];
const PRIORITIES: ProspectPriority[] = ['High', 'Medium', 'Low'];
const LISTS: ProspectList[] = ['December 2025 – Dealers/Partners', 'Master Ship Operator – End Users'];

export default function Prospects() {
  const { data: prospects = [], isLoading } = useProspects();
  const updateProspect = useUpdateProspect();
  const createProspect = useCreateProspect();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = !search || 
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        p.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
        p.country?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [prospects, search, statusFilter]);

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return isBefore(parseISO(date), new Date());
  };

  const handleStatusChange = async (id: string, status: ProspectStatus) => {
    try {
      await updateProspect.mutateAsync({ id, status });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createProspect.mutateAsync({
        company: form.get('company') as string,
        country: form.get('country') as string || null,
        segment: form.get('segment') as string || null,
        contact_person: form.get('contact_person') as string || null,
        email: form.get('email') as string || null,
        phone: form.get('phone') as string || null,
        status: 'New Lead' as ProspectStatus,
        estimated_value: Number(form.get('estimated_value')) || 0,
        priority: (form.get('priority') as ProspectPriority) || 'Medium',
        prospect_list: (form.get('prospect_list') as ProspectList) || 'December 2025 – Dealers/Partners',
        notes_internal: form.get('notes_internal') as string || null,
        date_contacted: null,
        next_followup: form.get('next_followup') as string || null,
        created_by: user?.id || null,
      });
      setDialogOpen(false);
      toast({ title: 'Success', description: 'Prospect added successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const fmt = (n: number | null) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-foreground">Prospects</h1>
          <p className="text-muted-foreground mt-1">{prospects.length} prospects in pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Prospect</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProspect} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input name="company" required />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input name="country" />
                </div>
                <div className="space-y-2">
                  <Label>Segment</Label>
                  <Input name="segment" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input name="contact_person" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Value</Label>
                  <Input name="estimated_value" type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select name="priority" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Prospect List</Label>
                  <select name="prospect_list" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {LISTS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Next Follow-up</Label>
                  <Input name="next_followup" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea name="notes_internal" rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={createProspect.isPending}>
                {createProspect.isPending ? 'Adding...' : 'Add Prospect'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company, contact, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold text-right">Est. Value</TableHead>
                <TableHead className="font-semibold text-right">Weighted</TableHead>
                <TableHead className="font-semibold">Follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Loading prospects...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No prospects found. Add your first prospect to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow key={p.id} className={`hover:bg-muted/30 transition-colors ${isOverdue(p.next_followup) ? 'bg-destructive/5' : ''}`}>
                    <TableCell className="font-medium">{p.company}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{p.contact_person || '—'}</div>
                        {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.country || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={p.status}
                        onValueChange={(v) => handleStatusChange(p.id, v as ProspectStatus)}
                      >
                        <SelectTrigger className="w-auto border-0 p-0 h-auto shadow-none">
                          <StatusBadge status={p.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><PriorityBadge priority={p.priority} /></TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(Number(p.estimated_value))}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(Number(p.weighted_value))}</TableCell>
                    <TableCell>
                      {p.next_followup ? (
                        <div className={`flex items-center gap-1 text-sm ${isOverdue(p.next_followup) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue(p.next_followup) && <AlertTriangle className="h-3.5 w-3.5" />}
                          {p.next_followup}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
