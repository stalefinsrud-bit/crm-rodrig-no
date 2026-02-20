import { useMemo } from 'react';
import { useProspects } from '@/hooks/useProspects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/KPICard';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';
import type { ProspectStatus } from '@/types/prospect';

const CONVERSION_RATES: Record<ProspectStatus, number> = {
  'New Lead': 0.05,
  'Contacted': 0.15,
  'Meeting Scheduled': 0.30,
  'Proposal Sent': 0.50,
  'Negotiation': 0.70,
  'Agreement Signed': 1.0,
  'Lost': 0,
  'On Hold': 0.10,
};

export default function Forecast() {
  const { data: prospects = [] } = useProspects();

  const forecast = useMemo(() => {
    const now = new Date();
    const active = prospects.filter(p => p.status !== 'Lost' && p.status !== 'Agreement Signed');

    const windows = [
      { label: '30 Days', days: 30 },
      { label: '60 Days', days: 60 },
      { label: '90 Days', days: 90 },
    ];

    const data = windows.map(w => {
      const cutoff = addDays(now, w.days);
      const inWindow = active.filter(p => {
        if (!p.next_followup) return true; // include if no followup set
        return isBefore(parseISO(p.next_followup), cutoff);
      });
      const totalPipeline = inWindow.reduce((s, p) => s + (Number(p.estimated_value) || 0), 0);
      const weightedRevenue = inWindow.reduce((s, p) => s + (Number(p.estimated_value) || 0) * CONVERSION_RATES[p.status], 0);
      const avgConversion = inWindow.length
        ? (inWindow.reduce((s, p) => s + CONVERSION_RATES[p.status], 0) / inWindow.length) * 100
        : 0;

      return {
        name: w.label,
        prospects: inWindow.length,
        pipeline: totalPipeline,
        weighted: weightedRevenue,
        conversion: Math.round(avgConversion),
      };
    });

    return data;
  }, [prospects]);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display text-foreground">Revenue Forecast</h1>
        <p className="text-muted-foreground mt-1">30 / 60 / 90 day pipeline projections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecast.map((f, i) => (
          <Card key={f.name} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {f.name} Outlook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Prospects in Window</p>
                <p className="text-2xl font-bold">{f.prospects}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-xl font-semibold">{fmt(f.pipeline)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weighted Expected Revenue</p>
                <p className="text-xl font-bold text-accent">{fmt(f.weighted)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion Probability</p>
                <p className="text-lg font-semibold">{f.conversion}%</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" /> Forecast Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={forecast}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="pipeline" name="Pipeline Value" fill="hsl(215, 28%, 17%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="weighted" name="Weighted Revenue" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
