import { useMemo, useState } from 'react';
import { Users, Phone, Handshake, TrendingUp, BarChart3, Filter, Target, Zap, MessageSquare, FileText } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { KPITooltip } from '@/components/KPITooltip';
import { DataHealthBanner } from '@/components/DataHealthBanner';
import { OnboardingWalkthrough } from '@/components/OnboardingWalkthrough';
import { useOnboarding } from '@/hooks/useOnboarding';
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
  'hsl(215, 28%, 17%)', 'hsl(205, 70%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 50%)', 'hsl(152, 60%, 40%)', 'hsl(205, 80%, 50%)',
  'hsl(152, 60%, 30%)', 'hsl(0, 60%, 45%)',
];

// Stage-based traffic light for the overview table
const STAGE_TRAFFIC_LIGHT: Record<string, { color: string; label: string }> = {
  'New': { color: 'bg-muted-foreground', label: 'New' },
  'Identified': { color: 'bg-info', label: 'Identified' },
  'Contacted': { color: 'bg-warning', label: 'Contacted' },
  'In Dialogue': { color: 'bg-warning', label: 'In Dialogue' },
  'Presented': { color: 'bg-accent', label: 'Presented' },
  'Proposal': { color: 'bg-info', label: 'Proposal' },
  'Won': { color: 'bg-success', label: 'Won' },
  'Rejected': { color: 'bg-destructive', label: 'Rejected' },
};

export default function Dashboard() {
  const { data: companies = [], isLoading } = useCompanies();
  const { data: allActivities = [] } = useAllActivities();
  const { showOnboarding, markComplete } = useOnboarding();
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Dynamic filter values from database
  const regions = useMemo(() => [...new Set(companies.map(c => c.region).filter(Boolean))].sort(), [companies]);
  const segments = useMemo(() => [...new Set(companies.map(c => c.vessel_segment).filter(Boolean))].sort(), [companies]);
  const companyTypes = useMemo(() => [...new Set(companies.map(c => c.company_type).filter(Boolean))].sort(), [companies]);
  const statuses = useMemo(() => [...new Set(companies.map(c => c.status).filter(Boolean))].sort(), [companies]);
  const stages = useMemo(() => [...new Set(companies.map(c => c.partner_stage).filter(Boolean))].sort(), [companies]);

  const companyIdsWithActivityType = useMemo(() => {
    if (activityTypeFilter === 'all') return null;
    return new Set(allActivities.filter(a => a.activity_type === activityTypeFilter).map(a => a.company_id));
  }, [allActivities, activityTypeFilter]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (regionFilter !== 'all' && c.region !== regionFilter) return false;
      if (segmentFilter !== 'all' && c.vessel_segment !== segmentFilter) return false;
      if (statusFilter !== 'all' && c.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (companyTypeFilter !== 'all' && c.company_type?.toLowerCase() !== companyTypeFilter.toLowerCase()) return false;
      if (stageFilter !== 'all' && c.partner_stage?.toLowerCase() !== stageFilter.toLowerCase()) return false;
      if (companyIdsWithActivityType && !companyIdsWithActivityType.has(c.id)) return false;
      return true;
    });
  }, [companies, regionFilter, segmentFilter, statusFilter, priorityFilter, companyTypeFilter, stageFilter, companyIdsWithActivityType]);

  // Funnel is now fully based on Stage
  const stats = useMemo(() => {
    const total = filtered.length;
    const stageNew = filtered.filter(c => c.partner_stage === 'New').length;
    const identified = filtered.filter(c => c.partner_stage === 'Identified').length;
    const contacted = filtered.filter(c => c.partner_stage === 'Contacted').length;
    const inDialogue = filtered.filter(c => c.partner_stage === 'In Dialogue').length;
    const presented = filtered.filter(c => c.partner_stage === 'Presented').length;
    const proposal = filtered.filter(c => c.partner_stage === 'Proposal').length;
    const won = filtered.filter(c => c.partner_stage === 'Won').length;
    const rejected = filtered.filter(c => c.partner_stage === 'Rejected').length;

    // Funnel: progressive pipeline stages (excluding Rejected)
    const funnelData = [
      { name: 'Total', value: total, fill: FUNNEL_COLORS[0] },
      { name: 'Identified+', value: total - stageNew, fill: FUNNEL_COLORS[1] },
      { name: 'Contacted+', value: contacted + inDialogue + presented + proposal + won, fill: FUNNEL_COLORS[2] },
      { name: 'In Dialogue+', value: inDialogue + presented + proposal + won, fill: FUNNEL_COLORS[3] },
      { name: 'Presented+', value: presented + proposal + won, fill: FUNNEL_COLORS[4] },
      { name: 'Proposal+', value: proposal + won, fill: FUNNEL_COLORS[5] },
      { name: 'Won', value: won, fill: FUNNEL_COLORS[6] },
    ];

    // KPI rates based on stage progression
    const contactedPlus = contacted + inDialogue + presented + proposal + won;
    const dialoguePlus = inDialogue + presented + proposal + won;
    const hitRate = contactedPlus > 0 ? Math.round((dialoguePlus / contactedPlus) * 100) : 0;
    const conversionRate = contactedPlus > 0 ? ((won / contactedPlus) * 100).toFixed(1) : '0';
    const engagementRate = contactedPlus > 0 ? Math.round(((dialoguePlus + proposal) / contactedPlus) * 100) : 0;

    const fleetTotal = filtered.reduce((s, c) => s + (c.fleet_size || 0), 0);
    const fleetWon = filtered.filter(c => c.partner_stage === 'Won').reduce((s, c) => s + (c.fleet_size || 0), 0);
    const fleetPenetration = fleetTotal ? Math.round((fleetWon / fleetTotal) * 100) : 0;

    const byCountry: Record<string, number> = {};
    filtered.forEach(c => { byCountry[c.country || 'Unknown'] = (byCountry[c.country || 'Unknown'] || 0) + 1; });
    const countryData = Object.entries(byCountry).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    const byStage: Record<string, number> = {};
    filtered.forEach(c => { byStage[c.partner_stage || 'Unknown'] = (byStage[c.partner_stage || 'Unknown'] || 0) + 1; });
    const stageDistribution = Object.entries(byStage).map(([name, value]) => ({ name, value }));

    return {
      total, stageNew, identified, contacted, inDialogue, presented, proposal, won, rejected,
      hitRate, conversionRate, engagementRate,
      fleetTotal, fleetWon, fleetPenetration,
      funnelData, countryData, stageDistribution,
    };
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
      {(showOnboarding || walkthroughOpen) && (
        <OnboardingWalkthrough
          onComplete={() => { markComplete(); setWalkthroughOpen(false); }}
          onSkip={() => { markComplete(); setWalkthroughOpen(false); }}
        />
      )}

      <DataHealthBanner companies={filtered} />

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">AWT Strategic Pipeline Dashboard</h1>
          <p className="text-muted-foreground mt-1">Stage-based funnel & pipeline analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Company Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {companyTypes.map(t => <SelectItem key={t!} value={t!}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
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
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
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

      {/* Performance KPIs – Stage-based */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <KPICard title="Total" value={stats.total} icon={Users} tooltip="Total companies in the pipeline" />
        <KPICard title="Contacted" value={stats.contacted + stats.inDialogue + stats.presented + stats.proposal + stats.won} icon={Phone} variant="info" tooltip="Companies at Contacted stage or beyond" />
        <KPICard title="In Dialogue" value={stats.inDialogue} icon={MessageSquare} variant="accent" tooltip="Companies in active discussion" />
        <KPICard title="Presented" value={stats.presented} icon={TrendingUp} variant="accent" tooltip="Companies with intro/presentation shared" />
        <KPICard title="Won" value={stats.won} icon={Handshake} variant="success" tooltip="Companies with agreements in place" />
        <KPICard title="Hit Rate" value={`${stats.hitRate}%`} icon={Target} variant="info" subtitle="Dialogue+ / Contacted+" tooltip="Dialogue+ ÷ Contacted+. Measures outreach effectiveness." />
        <KPICard title="Conversion" value={`${stats.conversionRate}%`} icon={Zap} variant="success" subtitle="Won / Contacted+" tooltip="Won ÷ Contacted+. Measures deal closure rate." />
        <KPICard title="Engagement" value={`${stats.engagementRate}%`} icon={BarChart3} variant="accent" subtitle="Active / Contacted+" tooltip="Active pipeline ratio of dialogue + proposal to contacted+." />
      </div>

      {/* Funnel + Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" /> Stage Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.funnelData.map((stage, idx) => {
                const maxVal = stats.funnelData[0].value || 1;
                const pct = Math.round((stage.value / maxVal) * 100);
                const dropOff = idx > 0 && stats.funnelData[idx - 1].value > 0
                  ? Math.round(((stats.funnelData[idx - 1].value - stage.value) / stats.funnelData[idx - 1].value) * 100)
                  : null;
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 text-muted-foreground">{stage.name}</span>
                    <div className="flex-1 h-9 bg-muted rounded-md overflow-hidden relative">
                      <div className="h-full rounded-md transition-all duration-700 ease-out" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: stage.fill }} />
                      <span className="absolute inset-0 flex items-center pl-3 text-sm font-bold text-primary-foreground mix-blend-difference">
                        {stage.value}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right font-mono">
                      {pct}%
                    </span>
                    {dropOff !== null && dropOff > 0 && (
                      <span className="text-xs text-destructive/70 w-12 text-right font-mono">
                        −{dropOff}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" /> Fleet Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fleet</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetTotal.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fleet Won</p>
                <p className="text-2xl font-bold mt-1">{stats.fleetWon.toLocaleString()}</p>
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
          <CardHeader><CardTitle className="text-lg font-display">By Country</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-lg font-display">Stage Distribution</CardTitle></CardHeader>
          <CardContent>
            {stats.stageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.stageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {stats.stageDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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

      {/* Company Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Company Stage Overview</CardTitle>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground inline-block" /> New</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-info inline-block" /> Identified</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning inline-block" /> Contacted / In Dialogue</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent inline-block" /> Presented</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success inline-block" /> Won</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" /> Rejected</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Country</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                  <TableHead className="font-semibold">Stage</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Fleet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No companies match filters</TableCell></TableRow>
                ) : (
                  filtered.slice(0, 25).map(c => {
                    const tl = STAGE_TRAFFIC_LIGHT[c.partner_stage || ''] || { color: 'bg-muted-foreground', label: '?' };
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell><div className={`h-3 w-3 rounded-full ${tl.color}`} title={`${tl.label}`} /></TableCell>
                        <TableCell className="font-medium">{c.company}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.company_type || '—'}</TableCell>
                        <TableCell className="text-sm">{c.country || '—'}</TableCell>
                        <TableCell className="text-sm">{c.region || '—'}</TableCell>
                        <TableCell className="text-sm">{c.partner_stage || '—'}</TableCell>
                        <TableCell className="text-sm">{c.status || '—'}</TableCell>
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
