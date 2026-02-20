import { useMemo, useState } from 'react';
import { useProspects, useUpdateProspect } from '@/hooks/useProspects';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Phone, CheckCircle, Calendar, Clock } from 'lucide-react';
import { isBefore, parseISO, format } from 'date-fns';
import type { Prospect } from '@/types/prospect';

export default function CallMode() {
  const { data: prospects = [] } = useProspects();
  const updateProspect = useUpdateProspect();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');

  const sorted = useMemo(() => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return [...prospects]
      .filter(p => p.status !== 'Agreement Signed' && p.status !== 'Lost')
      .sort((a, b) => {
        // Overdue first
        const aOverdue = a.next_followup && isBefore(parseISO(a.next_followup), new Date());
        const bOverdue = b.next_followup && isBefore(parseISO(b.next_followup), new Date());
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        // Then priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [prospects]);

  const handleMarkContacted = async (p: Prospect) => {
    try {
      const updates: any = {
        id: p.id,
        date_contacted: format(new Date(), 'yyyy-MM-dd'),
      };
      if (p.status === 'New Lead') updates.status = 'Contacted';
      if (note) updates.notes_internal = p.notes_internal ? `${p.notes_internal}\n\n[${format(new Date(), 'yyyy-MM-dd')}] ${note}` : `[${format(new Date(), 'yyyy-MM-dd')}] ${note}`;
      if (nextFollowup) updates.next_followup = nextFollowup;
      await updateProspect.mutateAsync(updates);
      setActiveId(null);
      setNote('');
      setNextFollowup('');
      toast({ title: 'Updated', description: `${p.company} marked as contacted` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display text-foreground flex items-center gap-3">
          <Phone className="h-8 w-8 text-accent" /> Call Mode
        </h1>
        <p className="text-muted-foreground mt-1">{sorted.length} prospects to contact — sorted by urgency</p>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              All caught up! No prospects to contact.
            </CardContent>
          </Card>
        ) : (
          sorted.map(p => {
            const overdue = p.next_followup && isBefore(parseISO(p.next_followup), new Date());
            const isActive = activeId === p.id;
            return (
              <Card key={p.id} className={`transition-all ${overdue ? 'border-destructive/30 bg-destructive/5' : ''} ${isActive ? 'ring-2 ring-accent' : ''}`}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{p.company}</h3>
                        <StatusBadge status={p.status} />
                        <PriorityBadge priority={p.priority} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {p.contact_person && <span>{p.contact_person}</span>}
                        {p.phone && <span className="font-mono">{p.phone}</span>}
                        {p.email && <span>{p.email}</span>}
                      </div>
                      {p.next_followup && (
                        <div className={`flex items-center gap-1 text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          Follow-up: {p.next_followup} {overdue && '(OVERDUE)'}
                        </div>
                      )}
                      {p.notes_internal && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line border-l-2 border-border pl-3">
                          {p.notes_internal}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={isActive ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => setActiveId(isActive ? null : p.id)}
                    >
                      {isActive ? 'Cancel' : 'Log Call'}
                    </Button>
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-4 border-t space-y-3 animate-fade-in">
                      <Textarea
                        placeholder="Add note about the call..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            value={nextFollowup}
                            onChange={(e) => setNextFollowup(e.target.value)}
                            className="w-auto"
                          />
                        </div>
                        <Button onClick={() => handleMarkContacted(p)} disabled={updateProspect.isPending}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Mark Contacted
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
