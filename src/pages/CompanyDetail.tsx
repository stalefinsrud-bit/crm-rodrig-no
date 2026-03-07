import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompany, useCompanyActivities, useCreateActivity, useUpdateCompany } from '@/hooks/useCompanies';
import { useCompanyContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { useIsOwner } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Globe, Mail, Phone, User, Ship, Calendar, Building2, HelpCircle, Tag, Lightbulb, Trash2, Pencil, X, Save, Star } from 'lucide-react';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, STATUS_COLORS, PRIORITY_COLORS, STAGES, STAGE_DESCRIPTIONS, COMPANY_STATUSES, COMPANY_PRIORITIES, COMPANY_TYPES } from '@/types/company';
import type { ActivityType } from '@/types/company';
import type { Contact } from '@/hooks/useContacts';
import { format } from 'date-fns';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading } = useCompany(id);
  const { data: activities = [] } = useCompanyActivities(id);
  const { data: contacts = [] } = useCompanyContacts(id);
  const createActivity = useCreateActivity();
  const updateCompany = useUpdateCompany();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { user } = useAuth();
  const { data: isOwner } = useIsOwner();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});

  // Contact dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const startEditing = () => {
    if (!company) return;
    setEditData({
      company: company.company,
      company_type: company.company_type || '',
      country: company.country || '',
      region: company.region || '',
      vessel_type: company.vessel_type || '',
      vessel_segment: company.vessel_segment || '',
      fleet_size: company.fleet_size ?? '',
      size: company.size || '',
      website: company.website || '',
      source: company.source || '',
      status: company.status,
      priority: company.priority,
      partner_stage: company.partner_stage || '',
      next_action: company.next_action || '',
      strategic_insight: company.strategic_insight || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateCompany.mutateAsync({
        id: id!,
        company: editData.company,
        company_type: editData.company_type || null,
        country: editData.country || null,
        region: editData.region || null,
        vessel_type: editData.vessel_type || null,
        vessel_segment: editData.vessel_segment || null,
        fleet_size: editData.fleet_size ? Number(editData.fleet_size) : null,
        size: editData.size || null,
        website: editData.website || null,
        source: editData.source || null,
        status: editData.status,
        priority: editData.priority,
        partner_stage: editData.partner_stage || null,
        next_action: editData.next_action || null,
        strategic_insight: editData.strategic_insight || null,
      });
      setEditing(false);
      toast({ title: 'Company updated successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleArchive = async () => {
    try {
      await updateCompany.mutateAsync({ id: id!, is_deleted: true });
      toast({ title: 'Company archived successfully.' });
      navigate('/companies');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createActivity.mutateAsync({
        company_id: id!,
        activity_text: form.get('activity_text') as string,
        activity_type: form.get('activity_type') as ActivityType,
        created_by: user?.id || null,
      });
      setDialogOpen(false);
      toast({ title: 'Activity added' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const contactData = {
      company_id: id!,
      first_name: (f.get('first_name') as string) || null,
      last_name: (f.get('last_name') as string) || null,
      email: (f.get('email') as string) || null,
      phone: (f.get('phone') as string) || null,
      role: (f.get('role') as string) || null,
      is_primary: f.get('is_primary') === 'on',
      created_by: user?.id || null,
    };
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, ...contactData });
        toast({ title: 'Contact updated' });
      } else {
        await createContact.mutateAsync(contactData);
        toast({ title: 'Contact added' });
      }
      setContactDialogOpen(false);
      setEditingContact(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      await deleteContact.mutateAsync({ id: contact.id, company_id: contact.company_id });
      toast({ title: 'Contact deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading || !company) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Loading company...</div>
    );
  }

  const showStage = true; // Stage is now shown for all company types

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/companies')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display text-foreground">{company.company}</h1>
          <p className="text-muted-foreground">
            {company.company_type && <span>{company.company_type} • </span>}
            {company.country}{company.region ? ` • ${company.region}` : ''}
          </p>
        </div>
        <Badge variant="outline" className={`${STATUS_COLORS[company.status] || ''} text-sm`}>
          {company.status}
        </Badge>
        <Badge variant="outline" className={`${PRIORITY_COLORS[company.priority] || ''} text-sm border-transparent`}>
          {company.priority}
        </Badge>

        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Company
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateCompany.isPending}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        )}

        {isOwner && !editing && (
          <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50">
                <Trash2 className="h-4 w-4 mr-2" /> Archive
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Archive Company</DialogTitle>
                <DialogDescription>
                  Are you sure you want to archive <strong>{company.company}</strong>? It will be removed from the active list but can be restored by the owner.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleArchive} disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? 'Archiving...' : 'Confirm Archive'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info / Edit */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Company Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Company Name</Label>
                  <Input value={editData.company} onChange={e => setEditData(d => ({ ...d, company: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company Type</Label>
                  <select value={editData.company_type} onChange={e => setEditData(d => ({ ...d, company_type: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select type...</option>
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Country</Label>
                    <Input value={editData.country} onChange={e => setEditData(d => ({ ...d, country: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Region</Label>
                    <Input value={editData.region} onChange={e => setEditData(d => ({ ...d, region: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {COMPANY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <select value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {COMPANY_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Vessel Type</Label>
                    <Input value={editData.vessel_type} onChange={e => setEditData(d => ({ ...d, vessel_type: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vessel Segment</Label>
                    <Input value={editData.vessel_segment} onChange={e => setEditData(d => ({ ...d, vessel_segment: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fleet Size</Label>
                    <Input type="number" value={editData.fleet_size} onChange={e => setEditData(d => ({ ...d, fleet_size: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <Input value={editData.size} onChange={e => setEditData(d => ({ ...d, size: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Website</Label>
                  <Input value={editData.website} onChange={e => setEditData(d => ({ ...d, website: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Source</Label>
                  <Input value={editData.source} onChange={e => setEditData(d => ({ ...d, source: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stage</Label>
                  <select value={editData.partner_stage} onChange={e => setEditData(d => ({ ...d, partner_stage: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select stage...</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Next Action</Label>
                  <Input value={editData.next_action} onChange={e => setEditData(d => ({ ...d, next_action: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Strategic Insight</Label>
                  <Textarea value={editData.strategic_insight} onChange={e => setEditData(d => ({ ...d, strategic_insight: e.target.value }))} rows={3} />
                </div>
              </div>
            ) : (
              <>
                {company.company_type && <InfoRow icon={Tag} label="Type" value={company.company_type} />}
                {company.website && <InfoRow icon={Globe} label="Website" value={company.website} />}
                {company.vessel_type && <InfoRow icon={Ship} label="Vessel Type" value={company.vessel_type} />}
                {company.vessel_segment && <InfoRow icon={Ship} label="Segment" value={company.vessel_segment} />}
                {company.fleet_size != null && <InfoRow icon={Ship} label="Fleet Size" value={String(company.fleet_size)} />}
                {company.size && <InfoRow icon={Building2} label="Size" value={company.size} />}
                {company.source && <InfoRow icon={Building2} label="Source" value={company.source} />}
                {company.partner_stage && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Stage</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 text-sm space-y-2" align="start">
                          {STAGES.map(s => (
                            <div key={s}>
                              <span className="font-medium text-foreground">{s}</span>
                              <span className="text-muted-foreground"> – {STAGE_DESCRIPTIONS[s]}</span>
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-foreground font-medium">{company.partner_stage}</p>
                  </div>
                )}
                {company.next_action && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Next Action</p>
                    <p className="text-foreground">{company.next_action}</p>
                  </div>
                )}
                {company.strategic_insight && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" /> Strategic Insight
                    </p>
                    <p className="text-foreground whitespace-pre-wrap">{company.strategic_insight}</p>
                  </div>
                )}
                {company.last_contact_date && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Last Contact</p>
                    <p className="text-foreground">{company.last_contact_date}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Contacts Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Contacts ({contacts.length})
              </CardTitle>
              <Dialog open={contactDialogOpen} onOpenChange={(o) => { setContactDialogOpen(o); if (!o) setEditingContact(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingContact(null)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveContact} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>First Name</Label>
                        <Input name="first_name" defaultValue={editingContact?.first_name || ''} />
                      </div>
                      <div className="space-y-1">
                        <Label>Last Name</Label>
                        <Input name="last_name" defaultValue={editingContact?.last_name || ''} />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input name="email" type="email" defaultValue={editingContact?.email || ''} />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input name="phone" defaultValue={editingContact?.phone || ''} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label>Role / Title</Label>
                        <Input name="role" defaultValue={editingContact?.role || ''} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch name="is_primary" id="is_primary" defaultChecked={editingContact?.is_primary ?? false} />
                      <Label htmlFor="is_primary" className="text-sm cursor-pointer">Primary contact</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={createContact.isPending || updateContact.isPending}>
                      {editingContact ? 'Update Contact' : 'Add Contact'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No contacts yet. Add one to start tracking.</div>
              ) : (
                <div className="space-y-3">
                  {contacts.map(c => {
                    const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed';
                    return (
                      <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{name}</span>
                            {c.is_primary && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                <Star className="h-3 w-3 mr-1" /> Primary
                              </Badge>
                            )}
                            {c.role && <span className="text-xs text-muted-foreground">• {c.role}</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
                            {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact(c); setContactDialogOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteContact(c)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Activity Timeline
              </CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Add Activity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <Select name="activity_type" defaultValue="internal">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map(t => (
                            <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Textarea name="activity_text" required rows={4} placeholder="Describe the activity..." />
                    </div>
                    <Button type="submit" className="w-full" disabled={createActivity.isPending}>
                      {createActivity.isPending ? 'Saving...' : 'Save Activity'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No activities yet. Add one to start tracking.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(a => (
                    <div key={a.id} className="flex gap-4 border-l-2 border-border pl-4 pb-4 relative">
                      <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {ACTIVITY_TYPE_LABELS[a.activity_type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(a.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          {a.is_system_generated && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">System</Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{a.activity_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground font-medium">{value}</span>
      </div>
    </div>
  );
}
