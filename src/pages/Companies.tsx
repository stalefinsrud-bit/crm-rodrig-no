import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanies, useCreateCompany, useUpdateCompany } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, AlertTriangle, Trash2, RotateCcw, Eye, Pencil } from 'lucide-react';
import { COMPANY_STATUSES, COMPANY_PRIORITIES, COMPANY_TYPES, PARTNER_STAGES, STATUS_COLORS, PRIORITY_COLORS } from '@/types/company';
import CsvImportDialog from '@/components/CsvImportDialog';

export default function Companies() {
  const [showDeleted, setShowDeleted] = useState(false);
  const { data: companies = [], isLoading } = useCompanies(showDeleted);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formCompanyType, setFormCompanyType] = useState<string>('');

  // Duplicate detection state
  const [formCompany, setFormCompany] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [duplicateOverride, setDuplicateOverride] = useState(false);

  // Check for duplicates in real-time
  useEffect(() => {
    if (!formCompany.trim()) {
      setDuplicateWarning(null);
      setDuplicateOverride(false);
      return;
    }
    const name = formCompany.toLowerCase().trim();
    const country = formCountry.toLowerCase().trim();
    const match = companies.find(c =>
      c.company.toLowerCase().trim() === name &&
      (c.country || '').toLowerCase().trim() === country &&
      !c.is_deleted
    );
    if (match) {
      setDuplicateWarning(`"${match.company}" in ${match.country || 'no country'} already exists.`);
    } else {
      setDuplicateWarning(null);
      setDuplicateOverride(false);
    }
  }, [formCompany, formCountry, companies]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      // When not showing deleted, filter is already done by the query
      // When showing deleted, show all
      const q = search.toLowerCase();
      const matchSearch = !search ||
        c.company.toLowerCase().includes(q) ||
        c.first_name?.toLowerCase().includes(q) ||
        c.last_name?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q) ||
        c.region?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [companies, search, statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateCompany.mutateAsync({ id, status });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      await updateCompany.mutateAsync({ id, is_deleted: true });
      toast({ title: 'Company archived' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await updateCompany.mutateAsync({ id, is_deleted: false });
      toast({ title: 'Company restored' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Block if duplicate detected and not overridden
    if (duplicateWarning && !duplicateOverride) {
      if (!isAdmin) {
        toast({ title: 'Duplicate detected', description: 'Only admins can override duplicate protection.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Duplicate detected', description: 'Toggle the override switch to confirm.', variant: 'destructive' });
      return;
    }

    const f = new FormData(e.currentTarget);
    try {
      await createCompany.mutateAsync({
        code: null,
        company: f.get('company') as string,
        company_type: (f.get('company_type') as string) || null,
        country: (f.get('country') as string) || null,
        region: (f.get('region') as string) || null,
        vessel_type: (f.get('vessel_type') as string) || null,
        vessel_segment: (f.get('vessel_segment') as string) || null,
        size: (f.get('size') as string) || null,
        role: (f.get('role') as string) || null,
        website: (f.get('website') as string) || null,
        first_name: (f.get('first_name') as string) || null,
        last_name: (f.get('last_name') as string) || null,
        source: (f.get('source') as string) || null,
        email: (f.get('email') as string) || null,
        phone: (f.get('phone') as string) || null,
        last_contact_date: null,
        next_action: (f.get('next_action') as string) || null,
        strategic_insight: (f.get('strategic_insight') as string) || null,
        priority: (f.get('priority') as string) || 'Medium',
        status: 'New Lead',
        fleet_size: Number(f.get('fleet_size')) || null,
        partner_stage: (f.get('partner_stage') as string) || null,
        created_by: user?.id || null,
      });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Company added' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormCompanyType('');
    setFormCompany('');
    setFormCountry('');
    setDuplicateWarning(null);
    setDuplicateOverride(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">{companies.length} companies in pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Company</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Company</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Input name="company" required value={formCompany} onChange={e => setFormCompany(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Type</Label>
                    <select name="company_type" value={formCompanyType} onChange={e => setFormCompanyType(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select type...</option>
                      {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input name="country" value={formCountry} onChange={e => setFormCountry(e.target.value)} />
                  </div>
                  <div className="space-y-2"><Label>Region</Label><Input name="region" /></div>
                  <div className="space-y-2"><Label>First Name</Label><Input name="first_name" /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input name="last_name" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div>
                  <div className="space-y-2"><Label>Vessel Type</Label><Input name="vessel_type" /></div>
                  <div className="space-y-2"><Label>Vessel Segment</Label><Input name="vessel_segment" /></div>
                  <div className="space-y-2"><Label>Fleet Size</Label><Input name="fleet_size" type="number" /></div>
                  <div className="space-y-2"><Label>Size</Label><Input name="size" /></div>
                  <div className="space-y-2"><Label>Role</Label><Input name="role" /></div>
                  <div className="space-y-2"><Label>Website</Label><Input name="website" /></div>
                  <div className="space-y-2"><Label>Source</Label><Input name="source" /></div>
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    <select name="partner_stage" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select stage...</option>
                      {PARTNER_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select name="priority" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {COMPANY_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2"><Label>Next Action</Label><Input name="next_action" /></div>
                  <div className="col-span-2 space-y-2"><Label>Strategic Insight</Label><Textarea name="strategic_insight" rows={3} placeholder="Optional strategic notes..." /></div>
                </div>

                {/* Duplicate warning */}
                {duplicateWarning && (
                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-warning text-sm font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      Duplicate Detected
                    </div>
                    <p className="text-xs text-muted-foreground">{duplicateWarning}</p>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={duplicateOverride}
                          onCheckedChange={setDuplicateOverride}
                          id="override"
                        />
                        <Label htmlFor="override" className="text-xs text-muted-foreground cursor-pointer">
                          Admin override — create anyway
                        </Label>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCompany.isPending || (!!duplicateWarning && !duplicateOverride)}
                >
                  {createCompany.isPending ? 'Adding...' : 'Add Company'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search company, contact, country, region..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {COMPANY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {isAdmin && (
          <div className="flex items-center gap-2 ml-auto">
            <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted" />
            <Label htmlFor="show-deleted" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
              <Eye className="h-3 w-3" /> Show archived
            </Label>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold text-right">Fleet</TableHead>
                <TableHead className="font-semibold">Last Contact</TableHead>
                <TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No companies found.</TableCell></TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow
                    key={c.id}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${c.is_deleted ? 'opacity-50' : ''}`}
                    onClick={() => !c.is_deleted && navigate(`/companies/${c.id}`)}
                  >
                    <TableCell className="font-medium">
                      {c.company}
                      {c.is_deleted && <Badge variant="outline" className="ml-2 text-xs bg-muted text-muted-foreground">Archived</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.company_type || '—'}</TableCell>
                    <TableCell>
                      <div className="text-sm">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</div>
                      {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{c.country || '—'}</TableCell>
                    <TableCell>
                      {c.is_deleted ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">{c.status}</Badge>
                      ) : (
                        <Select value={c.status} onValueChange={v => { handleStatusChange(c.id, v); }}>
                          <SelectTrigger className="w-auto border-0 p-0 h-auto shadow-none" onClick={e => e.stopPropagation()}>
                            <Badge variant="outline" className={`${STATUS_COLORS[c.status] || ''} text-xs font-medium border`}>{c.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${PRIORITY_COLORS[c.priority] || ''} text-xs font-medium border-transparent`}>{c.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{c.fleet_size ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.last_contact_date || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!c.is_deleted && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); navigate(`/companies/${c.id}`); }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          c.is_deleted ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); handleRestore(c.id); }} title="Restore">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); handleSoftDelete(c.id); }} title="Archive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )
                        )}
                      </div>
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
