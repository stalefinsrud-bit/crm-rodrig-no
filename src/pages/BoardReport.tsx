import { useMemo } from 'react';
import { useProspects } from '@/hooks/useProspects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Anchor } from 'lucide-react';
import { format } from 'date-fns';

export default function BoardReport() {
  const { data: prospects = [] } = useProspects();

  const stats = useMemo(() => {
    const total = prospects.length;
    const contacted = prospects.filter(p => p.status !== 'New Lead').length;
    const signed = prospects.filter(p => p.status === 'Agreement Signed').length;
    const lost = prospects.filter(p => p.status === 'Lost').length;
    const contactRate = total ? Math.round((contacted / total) * 100) : 0;
    const conversionRate = contacted ? Math.round((signed / contacted) * 100) : 0;
    const pipelineValue = prospects.reduce((sum, p) => sum + (Number(p.estimated_value) || 0), 0);
    const weightedValue = prospects.reduce((sum, p) => sum + (Number(p.weighted_value) || 0), 0);

    const byStatus: Record<string, number> = {};
    prospects.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });

    const topCountries: Record<string, number> = {};
    prospects.forEach(p => {
      const c = p.country || 'Unknown';
      topCountries[c] = (topCountries[c] || 0) + (Number(p.estimated_value) || 0);
    });

    return { total, contacted, signed, lost, contactRate, conversionRate, pipelineValue, weightedValue, byStatus, topCountries };
  }, [prospects]);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-display text-foreground">Board Report</h1>
          <p className="text-muted-foreground mt-1">Generate investor-ready pipeline report</p>
        </div>
        <Button onClick={handlePrint}>
          <Download className="h-4 w-4 mr-2" /> Print / Export PDF
        </Button>
      </div>

      {/* Printable Report */}
      <div className="space-y-8 print:space-y-6" id="board-report">
        {/* Header */}
        <Card className="overflow-hidden">
          <div className="bg-primary px-8 py-8 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <Anchor className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-display">NordCRM Pipeline Report</h2>
                  <p className="text-primary-foreground/70">{format(new Date(), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-foreground/60">CONFIDENTIAL</p>
                <p className="text-sm text-primary-foreground/60">Board Document</p>
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Prospects', value: stats.total },
                { label: 'Contact Rate', value: `${stats.contactRate}%` },
                { label: 'Conversion Rate', value: `${stats.conversionRate}%` },
                { label: 'Agreements Signed', value: stats.signed },
              ].map(kpi => (
                <div key={kpi.label} className="text-center space-y-1">
                  <p className="text-3xl font-bold">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Pipeline Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <p className="text-4xl font-bold">{fmt(stats.pipelineValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Pipeline Value</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-accent/10">
                <p className="text-4xl font-bold text-accent">{fmt(stats.weightedValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">Weighted Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.topCountries)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([country, value]) => (
                  <div key={country} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-medium">{country}</span>
                    <span className="font-mono text-sm">{fmt(value)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground">
              <p>
                As of {format(new Date(), 'MMMM d, yyyy')}, the sales pipeline consists of{' '}
                <strong>{stats.total} prospects</strong> with a total pipeline value of{' '}
                <strong>{fmt(stats.pipelineValue)}</strong>. The weighted pipeline value stands at{' '}
                <strong>{fmt(stats.weightedValue)}</strong>.
              </p>
              <p>
                Our contact rate is <strong>{stats.contactRate}%</strong> with a conversion rate of{' '}
                <strong>{stats.conversionRate}%</strong>. We have successfully signed{' '}
                <strong>{stats.signed} agreements</strong> to date
                {stats.lost > 0 && <>, with {stats.lost} prospects marked as lost</>}.
              </p>
              <p>
                The pipeline shows{' '}
                {stats.pipelineValue > 0
                  ? 'active engagement across multiple markets with opportunities at various stages of maturity.'
                  : 'early-stage development. Focus should be on prospect identification and initial outreach.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
