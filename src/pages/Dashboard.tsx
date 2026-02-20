import { useMemo, useState } from 'react';
import { Users, Phone, Handshake, TrendingUp, DollarSign, Globe, Ship, BarChart3, Filter } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { useProspects } from '@/hooks/useProspects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import type { Prospect, ProspectStatus } from '@/types/prospect';

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

const FUNNEL_COLORS = [
  'hsl(215, 28%, 17%)',
  'hsl(205, 80%, 50%)',
  'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(152, 60%, 30%)',
];

// Traffic light mapping
const TRAFFIC_LIGHT: Record<ProspectStatus, { color: string; label: string }> = {
  'New Lead': { color: 'bg-destructive', label: 'Red' },
  'Contacted': { color: 'bg-warning', label: 'Yellow' },
  'Meeting Scheduled': { color: 'bg-success', label: 'Green' },
  'Negotiation': { color: 'bg-success', label: 'Green' },
  'Proposal Sent': { color: 'bg-info', label: 'Blue' },
  'Agreement Signed': { color: 'bg-emerald-800', label: 'Dark Green' },
  'Lost': { color: 'bg-muted-foreground', label: 'Grey' },
  'On Hold': { color: 'bg-muted-foreground', label: 'Grey' },
};

// Funnel stage definitions
const RESPONDED_STATUSES: ProspectStatus[] = ['Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed'];
const DIALOGUE_STATUSES: ProspectStatus[] = ['Meeting Scheduled', 'Negotiation'];
const PROPOSAL_STATUSES: ProspectStatus[] = ['Proposal Sent', 'Negotiation', 'Agreement Signed'];
const CONTACTED_STATUSES: ProspectStatus[] = ['Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed'];

export default function Dashboard() {
  const { data: prospects = [], isLoading } = useProspects();
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [listFilter, setListFilter] = useState<string>('all');

  const countries = useMemo(() => [...new Set(prospects.map(p => p.country).filter(Boolean))].sort(), [prospects]);
  const lists = useMemo(() => [...new Set(prospects.map(p => p.prospect_list))].sort(), [prospects]);

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      const matchCountry = countryFilter === 'all' || p.country === countryFilter;
      const matchList = listFilter === 'all' || p.prospect_list === listFilter;
      return matchCountry && matchList;
    });
  }, [prospects, countryFilter, listFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const contacted = filtered.filter(p => CONTACTED_STATUSES.includes(p.status)).length;
    const responded = filtered.filter(p => RESPONDED_STATUSES.includes(p.status)).length;
    const dialogue = filtered.filter(p => DIALOGUE_STATUSES.includes(p.status)).length;
    const proposal = filtered.filter(p => PROPOSAL_STATUSES.includes(p.status)).length;
    const signed = filtered.filter(p => p.status === 'Agreement Signed').length;
    const lost = filtered.filter(p => p.status === 'Lost').length;

    const hitRate = contacted ? Math.round((responded / contacted) * 100) : 0;
    const responseRate = total ? Math.round((responded / total) * 100) : 0;
    const conversionRate = contacted ? Math.round((signed / contacted) * 100) : 0;
    const contactRate = total ? Math.round((contacted / total) * 100) : 0;

    const pipelineValue = filtered.reduce((sum, p) => sum + (Number(p.estimated_value) || 0), 0);
    const weightedValue = filtered.reduce((sum, p) => sum + (Number(p.weighted_value) || 0), 0);

    // Fleet metrics
    const fleetContacted = filtered.filter(p => CONTACTED_STATUSES.includes(p.status)).reduce((sum, p) => sum + (p.fleet_size || 0), 0);
    const fleetResponded = filtered.filter(p => RESPONDED_STATUSES.includes(p.status)).reduce((sum, p) => sum + (p.fleet_size || 0), 0);
    const fleetSigned = filtered.filter(p => p.status === 'Agreement Signed').reduce((sum, p) => sum + (p.fleet_size || 0), 0);
    const fleetTotal = filtered.reduce((sum, p) => sum + (p.fleet_size || 0), 0);
    const fleetPenetration = fleetTotal ? Math.round((fleetSigned / fleetTotal) * 100) : 0;

    // Funnel data
    const funnelData = [
      { name: 'Identified', value: total, fill: FUNNEL_COLORS[0] },
      { name: 'Contacted', value: contacted, fill: FUNNEL_COLORS[1] },
      { name: 'Responded', value: responded, fill: FUNNEL_COLORS[2] },
      { name: 'Dialogue', value: dialogue, fill: FUNNEL_COLORS[3] },
      { name: 'Proposal', value: proposal, fill: FUNNEL_COLORS[4] },
      { name: 'Signed', value: signed, fill: FUNNEL_COLORS[5] },
    ];

    // Country ranking
    const byCountry: Record<string, number> = {};
    filtered.forEach(p => {
      const c = p.country || 'Unknown';
      byCountry[c] = (byCountry[c] || 0) + (Number(p.estimated_value) || 0);
    });
    const countryData = Object.entries(byCountry)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Status distribution
    const byStatus: Record<string, number> = {};
    filtered.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

    return {
      total, contacted, responded, signed, lost, dialogue, proposal,
      hitRate, responseRate, conversionRate, contactRate,
      pipelineValue, weightedValue,
      fleetContacted, fleetResponded, fleetSigned, fleetTotal, fleetPenetration,
      funnelData, countryData, statusData,
    };
  }, [filtered]);

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
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">AWT Strategic Pipeline Dashboard</h1>
          <p className="text-muted-foreground mt-1">Performance & hit rate analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={listFilter} onValueChange={setListFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Lists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              {lists.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Identified" value={stats.total} icon={Users} />
        <KPICard title="Contacted" value={stats.contacted} icon={Phone} variant="info" />
        <KPICard title="Responded" value={stats.responded} icon={TrendingUp} variant="accent" />
        <KPICard title="Hit Rate" value={`${stats.hitRate}%`} icon={BarChart3} variant="accent" subtitle="Responded / Contacted" />
        <KPICard title="Response Rate" value={`${stats.responseRate}%`} icon={TrendingUp} subtitle="Responded / Total" />
        <KPICard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={Handshake} variant="success" subtitle="Signed / Contacted" />
      </div>

      {/* Value KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Pipeline Value" value={fmt(stats.pipelineValue)} icon={DollarSign} />
        <KPICard title="Weighted Value" value={fmt(stats.weightedValue)} icon={DollarSign} variant="accent" />
        <KPICard title="Agreements Signed" value={stats.signed} icon={Handshake} variant="success" />
        <KPICard title="Contact Rate" value={`${stats.contactRate}%`} icon={Phone} variant="info" />
      </div>

      {/* Funnel + Fleet metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Sales Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.funnelData.map((stage, i) => {
                const maxVal = stats.funnelData[0].value || 1;
                const pct = Math.round((stage.value / maxVal) * 100);
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20 text-muted-foreground">{stage.name}</span>
                    <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.fill }}
                      />
                      <span className="absolute inset-0 flex items-center pl-3 text-sm font-semibold text-primary-foreground mix-blend-difference">
                        {stage.value} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Ship className="h-5 w-5 text-muted-foreground" />
              Fleet-Based Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fleet Contacted</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetContacted.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fleet Responded</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetResponded.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fleet Signed</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetSigned.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fleet Penetration</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetPenetration}%</p>
              </div>
            </div>
            {stats.fleetTotal === 0 && (
              <p className="text-xs text-muted-foreground mt-4 text-center">No fleet size data entered yet. Add fleet sizes to prospects to see metrics.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No prospect data yet</div>
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
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No prospect data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Light Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Prospect Status Overview (Traffic Light)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Country</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold text-right">Est. Value</TableHead>
                  <TableHead className="font-semibold text-right">Fleet Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No prospects match current filters</TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 25).map(p => {
                    const tl = TRAFFIC_LIGHT[p.status];
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className={`h-3 w-3 rounded-full ${tl.color}`} title={`${tl.label}: ${p.status}`} />
                        </TableCell>
                        <TableCell className="font-medium">{p.company}</TableCell>
                        <TableCell className="text-sm">{p.country || '—'}</TableCell>
                        <TableCell className="text-sm">{p.status}</TableCell>
                        <TableCell className="text-sm">{p.contact_person || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {p.estimated_value ? fmt(Number(p.estimated_value)) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {p.fleet_size || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 25 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">Showing top 25 of {filtered.length} prospects</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
