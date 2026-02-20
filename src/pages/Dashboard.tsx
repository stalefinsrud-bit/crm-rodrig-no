import { useMemo } from 'react';
import { Users, Phone, Handshake, TrendingUp, DollarSign, Globe } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { useProspects } from '@/hooks/useProspects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ProspectStatus } from '@/types/prospect';

const CHART_COLORS = [
  'hsl(205, 80%, 50%)',
  'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(215, 28%, 50%)',
  'hsl(180, 60%, 40%)',
  'hsl(320, 60%, 50%)',
];

export default function Dashboard() {
  const { data: prospects = [], isLoading } = useProspects();

  const stats = useMemo(() => {
    const total = prospects.length;
    const contacted = prospects.filter(p => p.status !== 'New Lead').length;
    const signed = prospects.filter(p => p.status === 'Agreement Signed').length;
    const lost = prospects.filter(p => p.status === 'Lost').length;
    const active = total - lost;
    const contactRate = total ? Math.round((contacted / total) * 100) : 0;
    const conversionRate = contacted ? Math.round((signed / contacted) * 100) : 0;
    const pipelineValue = prospects.reduce((sum, p) => sum + (Number(p.estimated_value) || 0), 0);
    const weightedValue = prospects.reduce((sum, p) => sum + (Number(p.weighted_value) || 0), 0);

    // Country ranking
    const byCountry: Record<string, number> = {};
    prospects.forEach(p => {
      const c = p.country || 'Unknown';
      byCountry[c] = (byCountry[c] || 0) + (Number(p.estimated_value) || 0);
    });
    const countryData = Object.entries(byCountry)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Status distribution
    const byStatus: Record<string, number> = {};
    prospects.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    const statusData = Object.entries(byStatus)
      .map(([name, value]) => ({ name, value }));

    return { total, contacted, signed, contactRate, conversionRate, pipelineValue, weightedValue, countryData, statusData };
  }, [prospects]);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display text-foreground">AWT Strategic Pipeline Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading pipeline data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display text-foreground">AWT Strategic Pipeline Dashboard</h1>
        <p className="text-muted-foreground mt-1">Pipeline overview & key performance indicators</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Prospects" value={stats.total} icon={Users} />
        <KPICard title="Contact Rate" value={`${stats.contactRate}%`} icon={Phone} variant="info" />
        <KPICard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={TrendingUp} variant="accent" />
        <KPICard title="Agreements Signed" value={stats.signed} icon={Handshake} variant="success" />
        <KPICard title="Pipeline Value" value={fmt(stats.pipelineValue)} icon={DollarSign} />
        <KPICard title="Weighted Value" value={fmt(stats.weightedValue)} icon={DollarSign} variant="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Country Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.countryData} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" fill="hsl(215, 28%, 17%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No prospect data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {stats.statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No prospect data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
