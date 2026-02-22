import { useMemo, useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Anchor, Filter, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { COMPANY_TYPES, COMPANY_STATUSES, PARTNER_STAGES, PARTNER_STAGE_DESCRIPTIONS } from '@/types/company';

const MUTED_COLORS = [
  'hsl(215, 25%, 27%)', 'hsl(215, 20%, 40%)', 'hsl(215, 15%, 53%)',
  'hsl(215, 12%, 65%)', 'hsl(200, 15%, 45%)', 'hsl(180, 10%, 50%)',
  'hsl(160, 12%, 42%)', 'hsl(140, 10%, 48%)',
];

const PARTNER_FUNNEL_COLORS = [
  'hsl(215, 25%, 20%)', 'hsl(215, 20%, 30%)', 'hsl(200, 18%, 38%)',
  'hsl(200, 15%, 46%)', 'hsl(180, 12%, 42%)', 'hsl(160, 15%, 38%)',
  'hsl(0, 15%, 50%)', 'hsl(215, 10%, 60%)',
];

export default function BoardReport() {
  const { data: companies = [] } = useCompanies();

  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [fleetFilter, setFleetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partnerStageFilter, setPartnerStageFilter] = useState<string>('all');

  const isSalesPartner = companyTypeFilter === 'Sales Partner';
  const isOperator = companyTypeFilter === 'Ship Operator' || companyTypeFilter === 'Offshore Operator';
  const isYard = companyTypeFilter === 'Yard';
  const showVesselCharts = isOperator || isYard || companyTypeFilter === 'all';
  const showFleetCharts = isOperator || companyTypeFilter === 'all';
  const showPartnerFunnel = isSalesPartner;

  const regions = useMemo(() => [...new Set(companies.map(c => c.region).filter(Boolean))].sort(), [companies]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (companyTypeFilter !== 'all' && c.company_type !== companyTypeFilter) return false;
      if (regionFilter !== 'all' && c.region !== regionFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (partnerStageFilter !== 'all' && c.partner_stage !== partnerStageFilter) return false;
      if (fleetFilter !== 'all') {
        const fs = c.fleet_size || 0;
        if (fleetFilter === 'small' && fs > 10) return false;
        if (fleetFilter === 'medium' && (fs <= 10 || fs > 50)) return false;
        if (fleetFilter === 'large' && fs <= 50) return false;
      }
      return true;
    });
  }, [companies, companyTypeFilter, regionFilter, statusFilter, partnerStageFilter, fleetFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const contacted = filtered.filter(c => c.status !== 'New Lead').length;
    const signed = filtered.filter(c => c.status === 'Agreement Signed').length;
    const lost = filtered.filter(c => c.status === 'Lost').length;
    const inDialogue = filtered.filter(c => ['Meeting Scheduled', 'Negotiation'].includes(c.status)).length;
    const contactRate = total ? Math.round((contacted / total) * 100) : 0;
    const conversionRate = contacted ? Math.round((signed / contacted) * 100) : 0;

    const byStatus: Record<string, number> = {};
    filtered.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });

    const byCountry: Record<string, number> = {};
    filtered.forEach(c => { byCountry[c.country || 'Unknown'] = (byCountry[c.country || 'Unknown'] || 0) + 1; });
    const countryData = Object.entries(byCountry).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    const byRegion: Record<string, number> = {};
    filtered.forEach(c => { byRegion[c.region || 'Unknown'] = (byRegion[c.region || 'Unknown'] || 0) + 1; });
    const regionData = Object.entries(byRegion).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const byVesselType: Record<string, number> = {};
    filtered.forEach(c => { if (c.vessel_type) byVesselType[c.vessel_type] = (byVesselType[c.vessel_type] || 0) + 1; });
    const vesselTypeData = Object.entries(byVesselType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const byVesselSegment: Record<string, number> = {};
    filtered.forEach(c => { if (c.vessel_segment) byVesselSegment[c.vessel_segment] = (byVesselSegment[c.vessel_segment] || 0) + 1; });
    const vesselSegmentData = Object.entries(byVesselSegment).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const fleetTotal = filtered.reduce((s, c) => s + (c.fleet_size || 0), 0);
    const fleetSigned = filtered.filter(c => c.status === 'Agreement Signed').reduce((s, c) => s + (c.fleet_size || 0), 0);

    const byPartnerStage: Record<string, number> = {};
    filtered.forEach(c => { if (c.partner_stage) byPartnerStage[c.partner_stage] = (byPartnerStage[c.partner_stage] || 0) + 1; });

    return { total, contacted, signed, lost, inDialogue, contactRate, conversionRate, byStatus, countryData, regionData, vesselTypeData, vesselSegmentData, fleetTotal, fleetSigned, byPartnerStage };
  }, [filtered]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-display text-foreground tracking-tight">Board Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">Executive pipeline overview</p>
        </div>
        <Button variant="outline" onClick={handlePrint} className="border-border">
          <Download className="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="print:hidden border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={companyTypeFilter} onValueChange={v => { setCompanyTypeFilter(v); if (v !== 'Sales Partner') setPartnerStageFilter('all'); }}>
              <SelectTrigger className="w-44 border-border"><SelectValue placeholder="Company Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {COMPANY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40 border-border"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(r => <SelectItem key={r!} value={r!}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fleetFilter} onValueChange={setFleetFilter}>
              <SelectTrigger className="w-40 border-border"><SelectValue placeholder="Fleet Size" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fleets</SelectItem>
                <SelectItem value="small">≤ 10 vessels</SelectItem>
                <SelectItem value="medium">11–50 vessels</SelectItem>
                <SelectItem value="large">50+ vessels</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {COMPANY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {isSalesPartner && (
              <div className="flex items-center gap-1">
                <Select value={partnerStageFilter} onValueChange={setPartnerStageFilter}>
                  <SelectTrigger className="w-44 border-border"><SelectValue placeholder="Partner Stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {PARTNER_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-sm space-y-1.5" align="start">
                    {PARTNER_STAGES.map(s => (
                      <div key={s}>
                        <span className="font-medium text-foreground">{s}</span>
                        <span className="text-muted-foreground"> – {PARTNER_STAGE_DESCRIPTIONS[s]}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div className="space-y-6" id="board-report">
        {/* Report Header */}
        <Card className="overflow-hidden border-border">
          <div className="bg-foreground px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-background/10">
                  <Anchor className="h-5 w-5 text-background" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-background tracking-tight">AWT Pipeline Report</h2>
                  <p className="text-background/50 text-sm">{format(new Date(), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-background/40 uppercase tracking-widest">Confidential</p>
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Pipeline', value: stats.total },
            { label: 'Contacted', value: stats.contacted },
            { label: 'In Dialogue', value: stats.inDialogue },
            { label: 'Agreements', value: stats.signed },
            { label: 'Conversion', value: `${stats.conversionRate}%` },
          ].map(kpi => (
            <Card key={kpi.label} className="border-border">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partner Stage Funnel (Sales Partner only) */}
        {showPartnerFunnel && (
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-display">Partner Stage Funnel</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-sm space-y-1.5" align="start">
                    {PARTNER_STAGES.map(s => (
                      <div key={s}>
                        <span className="font-medium text-foreground">{s}</span>
                        <span className="text-muted-foreground"> – {PARTNER_STAGE_DESCRIPTIONS[s]}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PARTNER_STAGES.map((stage, i) => {
                  const count = stats.byPartnerStage[stage] || 0;
                  const maxVal = Math.max(...Object.values(stats.byPartnerStage), 1);
                  const pct = Math.round((count / maxVal) * 100);
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-24 text-muted-foreground truncate">{stage}</span>
                      <div className="flex-1 h-7 bg-muted/40 rounded overflow-hidden relative">
                        <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: PARTNER_FUNNEL_COLORS[i] }} />
                        <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-background mix-blend-difference">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Distribution */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base font-display">Geographic Distribution</CardTitle></CardHeader>
            <CardContent>
              {stats.countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.countryData} layout="vertical" margin={{ left: 70 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(215, 25%, 12%)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="hsl(215, 25%, 27%)" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">No data</div>}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base font-display">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(stats.byStatus).length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: 'hsl(215, 15%, 55%)' }}
                      style={{ fontSize: '11px' }}
                    >
                      {Object.keys(stats.byStatus).map((_, i) => <Cell key={i} fill={MUTED_COLORS[i % MUTED_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(215, 25%, 12%)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">No data</div>}
            </CardContent>
          </Card>
        </div>

        {/* Conditional Vessel / Fleet Charts */}
        {showVesselCharts && (stats.vesselTypeData.length > 0 || stats.vesselSegmentData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.vesselTypeData.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display">Vessel Type Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.vesselTypeData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(215, 25%, 12%)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="hsl(200, 18%, 38%)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {stats.vesselSegmentData.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display">Vessel Segment Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.vesselSegmentData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(215, 25%, 12%)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="hsl(180, 12%, 42%)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showFleetCharts && stats.fleetTotal > 0 && (
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base font-display">Fleet Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{stats.fleetTotal.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Total Vessels</p>
                </div>
                <div className="rounded border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{stats.fleetSigned.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Vessels Signed</p>
                </div>
                <div className="rounded border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{stats.fleetTotal ? Math.round((stats.fleetSigned / stats.fleetTotal) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Penetration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Table */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base font-display">Pipeline Detail</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    {isSalesPartner && <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Partner Stage</TableHead>}
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Fleet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={isSalesPartner ? 7 : 6} className="text-center py-8 text-muted-foreground text-sm">No companies match filters</TableCell></TableRow>
                  ) : (
                    filtered.slice(0, 30).map(c => (
                      <TableRow key={c.id} className="border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium text-sm">{c.company}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.company_type || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.country || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.region || '—'}</TableCell>
                        <TableCell className="text-sm">{c.status}</TableCell>
                        {isSalesPartner && <TableCell className="text-sm text-muted-foreground">{c.partner_stage || '—'}</TableCell>}
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{c.fleet_size ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 30 && <p className="text-xs text-muted-foreground mt-3 text-center">Showing 30 of {filtered.length}</p>}
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base font-display">Executive Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground/80 text-sm leading-relaxed">
              <p>
                As of {format(new Date(), 'MMMM d, yyyy')}, the pipeline comprises{' '}
                <strong className="text-foreground">{stats.total} companies</strong>
                {companyTypeFilter !== 'all' && <> (filtered to {companyTypeFilter})</>}.
                Contact rate stands at <strong className="text-foreground">{stats.contactRate}%</strong> with
                a conversion rate of <strong className="text-foreground">{stats.conversionRate}%</strong>.
              </p>
              <p>
                Currently <strong className="text-foreground">{stats.inDialogue}</strong> companies are in active dialogue,
                with <strong className="text-foreground">{stats.signed} agreements</strong> signed
                {stats.lost > 0 && <> and {stats.lost} marked as lost</>}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
