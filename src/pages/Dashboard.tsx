import { useMemo, useState } from 'react';
import { Users, Phone, Handshake, TrendingUp, DollarSign, Globe, Ship, BarChart3, Filter, Calendar } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { useCompanies, useAllActivities } from '@/hooks/useCompanies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Company } from '@/types/company';

const CHART_COLORS = [
  'hsl(205, 80%, 50%)', 'hsl(152, 60%, 40%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(215, 28%, 50%)',
  'hsl(180, 60%, 40%)', 'hsl(320, 60%, 50%)',
];

const FUNNEL_COLORS = [
  'hsl(215, 28%, 17%)', 'hsl(205, 80%, 50%)', 'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(152, 60%, 30%)',
];

const TRAFFIC_LIGHT: Record<string, { color: string; label: string }> = {
  'New Lead': { color: 'bg-destructive', label: 'Red' },
  'Contacted': { color: 'bg-warning', label: 'Yellow' },
  'Meeting Scheduled': { color: 'bg-success', label: 'Green' },
  'Negotiation': { color: 'bg-success', label: 'Green' },
  'Proposal Sent': { color: 'bg-info', label: 'Blue' },
  'Agreement Signed': { color: 'bg-emerald-800', label: 'Dark Green' },
  'Lost': { color: 'bg-muted-foreground', label: 'Grey' },
  'On Hold': { color: 'bg-muted-foreground', label: 'Grey' },
};

const RESPONDED_STATUSES = ['Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed'];
const DIALOGUE_STATUSES = ['Meeting Scheduled', 'Negotiation'];
const CONTACTED_STATUSES = ['Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed'];

export default function Dashboard() {
  const { data: companies = [], isLoading } = useCompanies();
  const { data: allActivities = [] } = useAllActivities();
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');

  const regions = useMemo(() => [...new Set(companies.map(c => c.region).filter(Boolean))].sort(), [companies]);
  const segments = useMemo(() => [...new Set(companies.map(c => c.vessel_segment).filter(Boolean))].sort(), [companies]);

  // Get company IDs that have a given activity type
  const companyIdsWithActivityType = useMemo(() => {
    if (activityTypeFilter === 'all') return null;
    return new Set(allActivities.filter(a => a.activity_type === activityTypeFilter).map(a => a.company_id));
  }, [allActivities, activityTypeFilter]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (regionFilter !== 'all' && c.region !== regionFilter) return false;
      if (segmentFilter !== 'all' && c.vessel_segment !== segmentFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (companyIdsWithActivityType && !companyIdsWithActivityType.has(c.id)) return false;
      return true;
    });
  }, [companies, regionFilter, segmentFilter, statusFilter, priorityFilter, companyIdsWithActivityType]);

  const meetingCount = useMemo(() =>
    allActivities.filter(a => a.activity_type === 'meeting').length
  , [allActivities]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const contacted = filtered.filter(c => CONTACTED_STATUSES.includes(c.status)).length;
    const responded = filtered.filter(c => RESPONDED_STATUSES.includes(c.status)).length;
    const dialogue = filtered.filter(c => DIALOGUE_STATUSES.includes(c.status)).length;
    const signed = filtered.filter(c => c.status === 'Agreement Signed').length;

    const hitRate = contacted ? Math.round((responded / contacted) * 100) : 0;
    const conversionRate = contacted ? Math.round((signed / contacted) * 100) : 0;

    // Fleet
    const fleetTotal = filtered.reduce((s, c) => s + (c.fleet_size || 0), 0);
    const fleetSigned = filtered.filter(c => c.status === 'Agreement Signed').reduce((s, c) => s + (c.fleet_size || 0), 0);
    const fleetPenetration = fleetTotal ? Math.round((fleetSigned / fleetTotal) * 100) : 0;

    const funnelData = [
      { name: 'Identified', value: total, fill: FUNNEL_COLORS[0] },
      { name: 'Contacted', value: contacted, fill: FUNNEL_COLORS[1] },
      { name: 'Responded', value: responded, fill: FUNNEL_COLORS[2] },
      { name: 'Dialogue', value: dialogue, fill: FUNNEL_COLORS[3] },
      { name: 'Signed', value: signed, fill: FUNNEL_COLORS[5] },
    ];

    const byCountry: Record<string, number> = {};
    filtered.forEach(c => { byCountry[c.country || 'Unknown'] = (byCountry[c.country || 'Unknown'] || 0) + 1; });
    const countryData = Object.entries(byCountry).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    const byStatus: Record<string, number> = {};
    filtered.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

    return { total, contacted, responded, dialogue, signed, hitRate, conversionRate, fleetTotal, fleetSigned, fleetPenetration, funnelData, countryData, statusData };
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-display text-foreground">AWT Strategic Pipeline Dashboard</h1>
        <p className="text-muted-foreground mt-1">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">AWT Strategic Pipeline Dashboard</h1>
          <p className="text-muted-foreground mt-1">Performance & hit rate analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(r => <SelectItem key={r!} value={r!}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Segment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {segments.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['New Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Agreement Signed', 'Lost', 'On Hold'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {['High', 'Medium', 'Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Activity Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {['email', 'phone', 'meeting', 'linkedin', 'presentation', 'internal'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Companies" value={stats.total} icon={Users} />
        <KPICard title="Contacted" value={stats.contacted} icon={Phone} variant="info" />
        <KPICard title="In Dialogue" value={stats.dialogue} icon={TrendingUp} variant="accent" />
        <KPICard title="Closed" value={stats.signed} icon={Handshake} variant="success" />
        <KPICard title="Meetings Held" value={meetingCount} icon={Calendar} variant="info" />
        <KPICard title="Hit Rate" value={`${stats.hitRate}%`} icon={BarChart3} variant="accent" subtitle="Meetings / Contacted" />
      </div>

      {/* Fleet + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" /> Sales Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.funnelData.map(stage => {
                const maxVal = stats.funnelData[0].value || 1;
                const pct = Math.round((stage.value / maxVal) * 100);
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20 text-muted-foreground">{stage.name}</span>
                    <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                      <div className="h-full rounded-md transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.fill }} />
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
              <Ship className="h-5 w-5 text-muted-foreground" /> Fleet Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fleet</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetTotal.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fleet Signed</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetSigned.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Penetration</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetPenetration}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Globe className="h-5 w-5 text-muted-foreground" /> By Country</CardTitle></CardHeader>
          <CardContent>
            {stats.countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.countryData} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(215, 28%, 17%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {stats.statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Light Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Company Status Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Country</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold text-right">Fleet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No companies match filters</TableCell></TableRow>
                ) : (
                  filtered.slice(0, 25).map(c => {
                    const tl = TRAFFIC_LIGHT[c.status] || { color: 'bg-muted-foreground', label: '?' };
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell><div className={`h-3 w-3 rounded-full ${tl.color}`} title={`${tl.label}: ${c.status}`} /></TableCell>
                        <TableCell className="font-medium">{c.company}</TableCell>
                        <TableCell className="text-sm">{c.country || '—'}</TableCell>
                        <TableCell className="text-sm">{c.region || '—'}</TableCell>
                        <TableCell className="text-sm">{c.status}</TableCell>
                        <TableCell className="text-sm">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{c.fleet_size ?? '—'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 25 && <p className="text-xs text-muted-foreground mt-3 text-center">Showing top 25 of {filtered.length}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
