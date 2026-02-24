import { useMemo, useState, useRef, useCallback } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { useSnapshots, useCreateSnapshot } from '@/hooks/useSnapshots';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Anchor, Filter, HelpCircle, Camera, TrendingUp, TrendingDown, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COMPANY_TYPES, COMPANY_STATUSES, STAGES, STAGE_DESCRIPTIONS } from '@/types/company';
import { toast } from 'sonner';

// Executive palette – strong, high-contrast colors
const EXEC_COLORS = [
  '#1B2A4A', '#D4820A', '#27AE60', '#2980B9',
  '#C0392B', '#16A085', '#8E44AD', '#E67E22',
];

const STATUS_CHART_COLORS: Record<string, string> = {
  'Active': '#27AE60',
  'On Hold': '#F39C12',
  'Dormant': '#95A5A6',
  'Not Relevant': '#C0392B',
};

const STAGE_CHART_COLORS: Record<string, string> = {
  'New': '#95A5A6',
  'Identified': '#2980B9',
  'Contacted': '#F39C12',
  'In Dialogue': '#D4820A',
  'Presented': '#8E44AD',
  'Proposal': '#1B6B3A',
  'Won': '#27AE60',
  'Rejected': '#C0392B',
};

const PARTNER_FUNNEL_COLORS = [
  '#1B2A4A', '#1F3A5F', '#2980B9', '#D4820A',
  '#F39C12', '#27AE60', '#C0392B', '#95A5A6',
];

const VESSEL_TYPE_COLORS = ['#1B2A4A', '#2C3E6B', '#3B5998', '#4A7EC0', '#6FA8DC', '#1F3A5F', '#34495E', '#5B7DA8'];
const VESSEL_SEGMENT_COLORS = ['#1B2A4A', '#D4820A', '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#C0392B', '#F39C12'];

const TOOLTIP_STYLE = { backgroundColor: '#0D1B2A', border: '1px solid rgba(212, 130, 10, 0.3)', borderRadius: '8px', color: '#E8DCC8', fontSize: '12px', fontWeight: 500 };
const AXIS_TICK = { fontSize: 12, fill: '#8B9DC3', fontWeight: 500 };

export default function BoardReport() {
  const { data: companies = [] } = useCompanies();
  const { data: snapshots = [] } = useSnapshots();
  const createSnapshot = useCreateSnapshot();
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const [boardMode, setBoardMode] = useState(false);
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [fleetFilter, setFleetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partnerStageFilter, setPartnerStageFilter] = useState<string>('all'); // now uses STAGES
  const [compareSnapshot, setCompareSnapshot] = useState<string>('none');

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
      if (partnerStageFilter !== 'all' && c.stage !== partnerStageFilter) return false;
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
    // Stage-based funnel stats
    const contacted = filtered.filter(c => !['New', 'Identified'].includes(c.stage || '')).length;
    const won = filtered.filter(c => c.stage === 'Won').length;
    const lost = filtered.filter(c => c.stage === 'Rejected').length;
    const inDialogue = filtered.filter(c => ['In Dialogue', 'Presented'].includes(c.stage || '')).length;
    const contactRate = total ? Math.round((contacted / total) * 100) : 0;
    const conversionRate = contacted ? Math.round((won / contacted) * 100) : 0;

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
    const fleetWon = filtered.filter(c => c.stage === 'Won').reduce((s, c) => s + (c.fleet_size || 0), 0);

    const byPartnerStage: Record<string, number> = {};
    filtered.forEach(c => { if (c.stage) byPartnerStage[c.stage] = (byPartnerStage[c.stage] || 0) + 1; });

    // Stage Conversion Rate: Won / (Contacted + In Dialogue + Presented + Proposal)
    const wonCount = byPartnerStage['Won'] || 0;
    const funnelDenominator = (byPartnerStage['Contacted'] || 0) + (byPartnerStage['In Dialogue'] || 0) + (byPartnerStage['Presented'] || 0) + (byPartnerStage['Proposal'] || 0);
    const partnerConversionRate = funnelDenominator > 0 ? Math.round((wonCount / funnelDenominator) * 100) : 0;

    return { total, contacted, won, lost, inDialogue, contactRate, conversionRate, byStatus, countryData, regionData, vesselTypeData, vesselSegmentData, fleetTotal, fleetWon, byPartnerStage, partnerConversionRate };
  }, [filtered]);

  // Top 10 Priority Accounts
  const top10 = useMemo(() => {
    const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return [...filtered]
      .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
      .slice(0, 10);
  }, [filtered]);

  // Snapshot comparison
  const selectedSnapshot = useMemo(() => {
    if (compareSnapshot === 'none') return null;
    return snapshots.find(s => s.id === compareSnapshot) || null;
  }, [compareSnapshot, snapshots]);

  const getDelta = (current: number, field: string): { value: number; direction: 'up' | 'down' | 'flat' } | null => {
    if (!selectedSnapshot) return null;
    const prev = (selectedSnapshot.kpi_data as Record<string, number>)[field];
    if (prev === undefined || prev === null) return null;
    const diff = current - prev;
    return { value: diff, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' };
  };

  const handleSaveSnapshot = useCallback(async () => {
    const kpiData: Record<string, number> = {
      total: stats.total,
      contacted: stats.contacted,
      won: stats.won,
      lost: stats.lost,
      inDialogue: stats.inDialogue,
      contactRate: stats.contactRate,
      conversionRate: stats.conversionRate,
      partnerConversionRate: stats.partnerConversionRate,
      fleetTotal: stats.fleetTotal,
      fleetWon: stats.fleetWon,
    };
    await createSnapshot.mutateAsync({
      filters: { companyTypeFilter, regionFilter, fleetFilter, statusFilter, partnerStageFilter },
      kpi_data: kpiData,
      funnel_data: stats.byPartnerStage,
      partner_conversion_rate: stats.partnerConversionRate,
      total_pipeline: stats.total,
      created_by: user?.id || null,
    });
    toast.success('Performance snapshot saved');
  }, [stats, companyTypeFilter, regionFilter, fleetFilter, statusFilter, partnerStageFilter, isSalesPartner, user, createSnapshot]);

  const handleExportPDF = useCallback(async () => {
    const el = reportRef.current;
    if (!el) return;
    toast.info('Generating PDF...');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#f8f9fb' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      while (heightLeft > 0) {
        position = position - (pageHeight - 20);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      pdf.save(`AWT_Board_Report_${dateStr}.pdf`);
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  }, []);

  const activeFilters = [
    companyTypeFilter !== 'all' && `Type: ${companyTypeFilter}`,
    regionFilter !== 'all' && `Region: ${regionFilter}`,
    fleetFilter !== 'all' && `Fleet: ${fleetFilter}`,
    statusFilter !== 'all' && `Status: ${statusFilter}`,
    partnerStageFilter !== 'all' && `Stage: ${partnerStageFilter}`,
  ].filter(Boolean);

  const DeltaIndicator = ({ current, field }: { current: number; field: string }) => {
    const delta = getDelta(current, field);
    if (!delta) return null;
    if (delta.direction === 'flat') return null;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${delta.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
        {delta.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {delta.direction === 'up' ? '+' : ''}{delta.value}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-display text-foreground tracking-tight">Board Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">Executive pipeline overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Board Mode</span>
            <Switch checked={boardMode} onCheckedChange={setBoardMode} />
          </div>
          {!boardMode && (
            <Button variant="outline" size="sm" onClick={handleSaveSnapshot} disabled={createSnapshot.isPending} className="border-border">
              <Camera className="h-4 w-4 mr-1.5" /> Save Snapshot
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="border-border">
            <Download className="h-4 w-4 mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Bar - hidden in board mode */}
      {!boardMode && (
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
              {(
                <div className="flex items-center gap-1">
                  <Select value={partnerStageFilter} onValueChange={setPartnerStageFilter}>
                    <SelectTrigger className="w-44 border-border"><SelectValue placeholder="Stage" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 text-sm space-y-1.5" align="start">
                      {STAGES.map(s => (
                        <div key={s}>
                          <span className="font-medium text-foreground">{s}</span>
                          <span className="text-muted-foreground"> – {STAGE_DESCRIPTIONS[s]}</span>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {/* Snapshot comparison selector */}
              {snapshots.length > 0 && (
                <Select value={compareSnapshot} onValueChange={setCompareSnapshot}>
                  <SelectTrigger className="w-48 border-border"><SelectValue placeholder="Compare snapshot" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    {snapshots.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {format(new Date(s.snapshot_date), 'MMM d, yyyy HH:mm')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <div className="space-y-6" id="board-report" ref={reportRef}>
        {/* Report Header */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2A4A 60%, #2C3E6B 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(212, 130, 10, 0.2)', border: '1px solid rgba(212, 130, 10, 0.3)' }}>
                  <Anchor className="h-5 w-5" style={{ color: '#D4820A' }} />
                </div>
                <div>
                  <h2 className="text-xl font-display tracking-tight" style={{ color: '#E8DCC8' }}>AWT Pipeline Report</h2>
                  <p className="text-sm" style={{ color: 'rgba(232, 220, 200, 0.5)' }}>{format(new Date(), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(232, 220, 200, 0.3)' }}>Confidential</p>
                {activeFilters.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(232, 220, 200, 0.45)' }}>{activeFilters.join(' · ')}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Summary with Traffic Light Indicators */}
        <div className={`grid gap-4 ${isSalesPartner ? 'grid-cols-2 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-5'}`}>
          {[
            {
              label: 'Total Pipeline',
              value: stats.total,
              field: 'total',
              health: stats.total > 0 ? 'green' as const : 'red' as const,
            },
            {
              label: 'Contacted',
              value: stats.contacted,
              field: 'contacted',
              health: (stats.contactRate > 50 ? 'green' : stats.contactRate >= 20 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
              sub: `${stats.contactRate}% rate`,
            },
            {
              label: 'In Dialogue',
              value: stats.inDialogue,
              field: 'inDialogue',
              health: (stats.inDialogue > 0 ? 'green' : 'yellow') as 'green' | 'yellow' | 'red',
            },
            {
              label: 'Won',
              value: stats.won,
              field: 'won',
              health: (stats.won > 0 ? 'green' : 'red') as 'green' | 'yellow' | 'red',
            },
            {
              label: 'Conversion',
              value: `${stats.conversionRate}%`,
              field: 'conversionRate',
              rawValue: stats.conversionRate,
              health: (stats.conversionRate > 10 ? 'green' : stats.conversionRate > 0 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
            },
            ...(true ? [{
              label: 'Stage Conv.',
              value: `${stats.partnerConversionRate}%`,
              field: 'partnerConversionRate',
              rawValue: stats.partnerConversionRate,
              health: (stats.partnerConversionRate > 10 ? 'green' : stats.partnerConversionRate > 0 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
            }] : []),
          ].map(kpi => {
            const healthColors = {
              green: { strip: '#27AE60', dot: '#27AE60', bg: 'rgba(39, 174, 96, 0.06)', border: 'rgba(39, 174, 96, 0.25)' },
              yellow: { strip: '#F39C12', dot: '#F39C12', bg: 'rgba(243, 156, 18, 0.06)', border: 'rgba(243, 156, 18, 0.25)' },
              red: { strip: '#C0392B', dot: '#C0392B', bg: 'rgba(192, 57, 43, 0.06)', border: 'rgba(192, 57, 43, 0.25)' },
            };
            const c = healthColors[kpi.health];
            return (
              <Card key={kpi.label} className="overflow-hidden" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                {/* Colored strip */}
                <div className="h-1.5" style={{ backgroundColor: c.strip }} />
                <CardContent className="pt-4 pb-4 text-center relative">
                  {/* Traffic light dot */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: c.dot, boxShadow: `0 0 6px ${c.dot}40` }} />
                  </div>
                  <p className={`font-bold tracking-tight ${boardMode ? 'text-4xl' : 'text-3xl'}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{kpi.label}</p>
                  {kpi.sub && <p className="text-xs mt-0.5" style={{ color: c.dot }}>{kpi.sub}</p>}
                  <DeltaIndicator current={kpi.rawValue ?? (typeof kpi.value === 'number' ? kpi.value : 0)} field={kpi.field} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stage Funnel */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-display">Stage Funnel</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-sm space-y-1.5" align="start">
                    {STAGES.map(s => (
                      <div key={s}>
                        <span className="font-medium text-foreground">{s}</span>
                        <span className="text-muted-foreground"> – {STAGE_DESCRIPTIONS[s]}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {STAGES.map((stage, i) => {
                  const count = stats.byPartnerStage[stage] || 0;
                  const maxVal = Math.max(...Object.values(stats.byPartnerStage), 1);
                  const pct = Math.round((count / maxVal) * 100);
                  const prevCount = selectedSnapshot ? ((selectedSnapshot.funnel_data as Record<string, number>)[stage] || 0) : null;
                  const delta = prevCount !== null ? count - prevCount : null;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-24 text-muted-foreground truncate">{stage}</span>
                      <div className="flex-1 h-7 bg-muted/40 rounded overflow-hidden relative">
                        <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: PARTNER_FUNNEL_COLORS[i] }} />
                        <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-background mix-blend-difference">
                          {count}
                        </span>
                      </div>
                      {delta !== null && delta !== 0 && (
                        <span className={`text-xs font-medium ${delta > 0 ? 'text-success' : 'text-destructive'}`}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regional Distribution */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base font-display font-bold">Regional Distribution</CardTitle></CardHeader>
            <CardContent>
              {stats.regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.regionData} layout="vertical" margin={{ left: 70 }}>
                    <defs>
                      <linearGradient id="regionGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1B2A4A" />
                        <stop offset="100%" stopColor="#2980B9" />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" tick={AXIS_TICK} axisLine={{ stroke: '#2C3E6B' }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={70} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="url(#regionGrad)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">No data</div>}
            </CardContent>
          </Card>

          {/* Stage Distribution – Horizontal Stacked Bar */}
          {!boardMode && (
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display font-bold">Stage Distribution</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const PIPELINE_STAGES = ['New', 'Identified', 'Contacted', 'In Dialogue', 'Presented'] as const;
                  const STAGE_BAR_COLORS: Record<string, string> = {
                    'New': '#95A5A6',
                    'Identified': '#5B7DA8',
                    'Contacted': '#2980B9',
                    'In Dialogue': '#D4820A',
                    'Presented': '#1B2A4A',
                  };
                  const total = PIPELINE_STAGES.reduce((sum, s) => sum + (stats.byPartnerStage[s] || 0), 0);
                  if (total === 0) return <div className="flex h-[120px] items-center justify-center text-muted-foreground text-sm">No data</div>;
                  const segments = PIPELINE_STAGES.map(s => ({
                    stage: s,
                    count: stats.byPartnerStage[s] || 0,
                    pct: Math.round(((stats.byPartnerStage[s] || 0) / total) * 100),
                    color: STAGE_BAR_COLORS[s],
                  })).filter(s => s.count > 0);
                  return (
                    <div className="space-y-4">
                      {/* Stacked bar */}
                      <div className="flex h-10 rounded-md overflow-hidden">
                        {segments.map((seg) => (
                          <div
                            key={seg.stage}
                            className="flex items-center justify-center transition-all duration-500 relative"
                            style={{ width: `${Math.max(seg.pct, 2)}%`, backgroundColor: seg.color }}
                            title={`${seg.stage}: ${seg.count} (${seg.pct}%)`}
                          >
                            {seg.pct > 5 && (
                              <span className="text-[11px] font-semibold text-white truncate px-1">
                                {seg.pct}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                        {segments.map((seg) => (
                          <div key={seg.stage} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                            <span className="text-xs text-muted-foreground">{seg.stage}</span>
                            <span className="text-xs font-medium">{seg.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Geographic Distribution (board mode) */}
          {boardMode && (
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base font-display font-bold">Geographic Distribution</CardTitle></CardHeader>
              <CardContent>
                {stats.countryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.countryData} layout="vertical" margin={{ left: 70 }}>
                      <defs>
                        <linearGradient id="geoGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1B2A4A" />
                          <stop offset="100%" stopColor="#D4820A" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" tick={AXIS_TICK} axisLine={{ stroke: '#2C3E6B' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={70} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" fill="url(#geoGrad)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Conditional Vessel / Fleet Charts */}
        {showVesselCharts && (stats.vesselTypeData.length > 0 || stats.vesselSegmentData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.vesselTypeData.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display font-bold">Vessel Type Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.vesselTypeData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={AXIS_TICK} axisLine={{ stroke: '#2C3E6B' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={80} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {stats.vesselTypeData.map((_, i) => <Cell key={i} fill={VESSEL_TYPE_COLORS[i % VESSEL_TYPE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {stats.vesselSegmentData.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base font-display font-bold">Vessel Segment Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.vesselSegmentData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={AXIS_TICK} axisLine={{ stroke: '#2C3E6B' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={80} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {stats.vesselSegmentData.map((_, i) => <Cell key={i} fill={VESSEL_SEGMENT_COLORS[i % VESSEL_SEGMENT_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showFleetCharts && stats.fleetTotal > 0 && (
          <Card className="border-border overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #1B2A4A, #D4820A, #27AE60)' }} />
            <CardHeader><CardTitle className="text-base font-display font-bold">Fleet Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg p-5 text-center" style={{ backgroundColor: 'rgba(27, 42, 74, 0.08)', border: '1px solid rgba(27, 42, 74, 0.15)' }}>
                  <p className={`font-bold ${boardMode ? 'text-4xl' : 'text-3xl'}`} style={{ color: '#1B2A4A' }}>{stats.fleetTotal.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide font-semibold">Total Vessels</p>
                </div>
                <div className="rounded-lg p-5 text-center" style={{ backgroundColor: 'rgba(39, 174, 96, 0.06)', border: '1px solid rgba(39, 174, 96, 0.2)' }}>
                  <p className={`font-bold ${boardMode ? 'text-4xl' : 'text-3xl'}`} style={{ color: '#27AE60' }}>{stats.fleetWon.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide font-semibold">Vessels Won</p>
                </div>
                <div className="rounded-lg p-5 text-center" style={{ backgroundColor: 'rgba(212, 130, 10, 0.06)', border: '1px solid rgba(212, 130, 10, 0.2)' }}>
                  <p className={`font-bold ${boardMode ? 'text-4xl' : 'text-3xl'}`} style={{ color: '#D4820A' }}>{stats.fleetTotal ? Math.round((stats.fleetWon / stats.fleetTotal) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide font-semibold">Penetration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Priority Accounts */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base font-display font-bold">Top 10 Priority Accounts</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'rgba(27, 42, 74, 0.15)' }}>
                    <TableHead className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B2A4A' }}>Company</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B2A4A' }}>Type</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B2A4A' }}>Country</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B2A4A' }}>Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B2A4A' }}>Priority</TableHead>
                    {isSalesPartner && <TableHead className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B2A4A' }}>Stage</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top10.length === 0 ? (
                    <TableRow><TableCell colSpan={isSalesPartner ? 6 : 5} className="text-center py-8 text-muted-foreground text-sm">No companies match filters</TableCell></TableRow>
                  ) : (
                    top10.map(c => (
                      <TableRow key={c.id} className="hover:bg-muted/20 transition-colors" style={{ borderColor: 'rgba(27, 42, 74, 0.08)' }}>
                        <TableCell className="font-semibold text-sm">{c.company}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.company_type || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.country || '—'}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: `${STATUS_CHART_COLORS[c.status] || '#95A5A6'}18`, color: STATUS_CHART_COLORS[c.status] || '#95A5A6' }}>
                            {c.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{
                            backgroundColor: c.priority === 'High' ? '#C0392B18' : c.priority === 'Medium' ? '#F39C1218' : '#27AE6018',
                            color: c.priority === 'High' ? '#C0392B' : c.priority === 'Medium' ? '#D4820A' : '#27AE60',
                          }}>
                            {c.priority}
                          </span>
                        </TableCell>
                        {isSalesPartner && <TableCell className="text-sm text-muted-foreground">{c.stage || '—'}</TableCell>}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Full Pipeline Detail - hidden in board mode */}
        {!boardMode && (
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
                      {isSalesPartner && <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage</TableHead>}
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
                          {isSalesPartner && <TableCell className="text-sm text-muted-foreground">{c.stage || '—'}</TableCell>}
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
        )}

        {/* Strategic Insights / Executive Summary */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base font-display">Strategic Insights</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground/80 text-sm leading-relaxed space-y-3">
              <p>
                As of {format(new Date(), 'MMMM d, yyyy')}, the pipeline comprises{' '}
                <strong className="text-foreground">{stats.total} companies</strong>
                {companyTypeFilter !== 'all' && <> (filtered to {companyTypeFilter})</>}.
                Contact rate stands at <strong className="text-foreground">{stats.contactRate}%</strong> with
                a conversion rate of <strong className="text-foreground">{stats.conversionRate}%</strong>.
              </p>
              <p>
                Currently <strong className="text-foreground">{stats.inDialogue}</strong> companies are in active dialogue,
                with <strong className="text-foreground">{stats.won} won</strong>
                {stats.lost > 0 && <> and {stats.lost} rejected</>}.
              </p>
              {stats.partnerConversionRate > 0 && (
                <p>
                  Stage conversion rate is at <strong className="text-foreground">{stats.partnerConversionRate}%</strong>,
                  with {stats.byPartnerStage['Won'] || 0} won out of {
                    (stats.byPartnerStage['Contacted'] || 0) + (stats.byPartnerStage['In Dialogue'] || 0) +
                    (stats.byPartnerStage['Presented'] || 0) + (stats.byPartnerStage['Proposal'] || 0)
                  } in the pipeline.
                </p>
              )}
              {selectedSnapshot && (
                <p className="border-t border-border pt-3 mt-3">
                  Compared to snapshot from <strong className="text-foreground">{format(new Date(selectedSnapshot.snapshot_date), 'MMM d, yyyy')}</strong>:
                  Pipeline {stats.total >= (selectedSnapshot.kpi_data as Record<string, number>).total ? 'grew' : 'decreased'} by{' '}
                  <strong className="text-foreground">{Math.abs(stats.total - ((selectedSnapshot.kpi_data as Record<string, number>).total || 0))}</strong> companies.
                  Agreements moved from {(selectedSnapshot.kpi_data as Record<string, number>).signed || (selectedSnapshot.kpi_data as Record<string, number>).won || 0} to {stats.won}.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
