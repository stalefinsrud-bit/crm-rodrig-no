import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompany, useCompanyActivities, useCreateActivity } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Plus, Globe, Mail, Phone, User, Ship, Calendar, Building2, HelpCircle, Tag, Lightbulb } from 'lucide-react';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, STATUS_COLORS, PRIORITY_COLORS, PARTNER_STAGES, PARTNER_STAGE_DESCRIPTIONS } from '@/types/company';
import type { ActivityType } from '@/types/company';
import { format } from 'date-fns';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading } = useCompany(id);
  const { data: activities = [] } = useCompanyActivities(id);
  const createActivity = useCreateActivity();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  if (isLoading || !company) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Loading company...</div>
    );
  }

  const contactName = [company.first_name, company.last_name].filter(Boolean).join(' ');
  const isSalesPartner = company.company_type === 'Sales Partner';

  return (
    <div className="space-y-6 animate-fade-in">
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
      </div>

      {/* Company info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Company Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company.company_type && <InfoRow icon={Tag} label="Type" value={company.company_type} />}
            {contactName && <InfoRow icon={User} label="Contact" value={contactName} />}
            {company.email && <InfoRow icon={Mail} label="Email" value={company.email} />}
            {company.phone && <InfoRow icon={Phone} label="Phone" value={company.phone} />}
            {company.website && <InfoRow icon={Globe} label="Website" value={company.website} />}
            {company.vessel_type && <InfoRow icon={Ship} label="Vessel Type" value={company.vessel_type} />}
            {company.vessel_segment && <InfoRow icon={Ship} label="Segment" value={company.vessel_segment} />}
            {company.fleet_size != null && <InfoRow icon={Ship} label="Fleet Size" value={String(company.fleet_size)} />}
            {company.size && <InfoRow icon={Building2} label="Size" value={company.size} />}
            {company.role && <InfoRow icon={User} label="Role" value={company.role} />}
            {company.source && <InfoRow icon={Building2} label="Source" value={company.source} />}
            {isSalesPartner && company.partner_stage && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Partner Stage</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 text-sm space-y-2" align="start">
                      {PARTNER_STAGES.map(s => (
                        <div key={s}>
                          <span className="font-medium text-foreground">{s}</span>
                          <span className="text-muted-foreground"> – {PARTNER_STAGE_DESCRIPTIONS[s]}</span>
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
          </CardContent>
        </Card>

        {/* Activity timeline */}
        <Card className="lg:col-span-2">
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
