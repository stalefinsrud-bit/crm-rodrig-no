import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle, CheckCircle2, RefreshCw, PlusCircle, ArrowUpDown } from 'lucide-react';
import { COMPANY_STATUSES, COMPANY_PRIORITIES } from '@/types/company';

type ImportMode = 'create' | 'upsert';

interface ParsedRow {
  code: string | null;
  company: string;
  country: string | null;
  region: string | null;
  vessel_type: string | null;
  vessel_segment: string | null;
  size: string | null;
  company_type: string | null;
  website: string | null;
  first_name: string | null;
  last_name: string | null;
  source: string | null;
  email: string | null;
  phone: string | null;
  last_contact_date: string | null;
  activity_log: string | null;
  next_action: string | null;
  priority: string;
  status: string;
  fleet_size: number | null;
  strategic_insight: string | null;
  partner_stage: string | null;
}

interface ValidationResult {
  row: ParsedRow;
  rowIndex: number;
  errors: string[];
  isValid: boolean;
}

type MatchAction = 'create' | 'update' | 'skip';

interface MatchedRow extends ValidationResult {
  action: MatchAction;
  existingId?: string;
}

const CSV_FIELD_MAP: Record<string, keyof ParsedRow> = {
  'code': 'code',
  'company': 'company',
  'company_name': 'company',
  'country': 'country',
  'region': 'region',
  'vessel type': 'vessel_type',
  'vessel_type': 'vessel_type',
  'vessel segment': 'vessel_segment',
  'vessel_segment': 'vessel_segment',
  'size': 'size',
  'company type': 'company_type',
  'company_type': 'company_type',
  'website': 'website',
  'first name': 'first_name',
  'first_name': 'first_name',
  'last name': 'last_name',
  'last_name': 'last_name',
  'source': 'source',
  'email': 'email',
  'phone': 'phone',
  'last contact date': 'last_contact_date',
  'last_contact_date': 'last_contact_date',
  'activity log': 'activity_log',
  'activity_log': 'activity_log',
  'next action': 'next_action',
  'next_action': 'next_action',
  'priority': 'priority',
  'status': 'status',
  'fleet size': 'fleet_size',
  'fleet_size': 'fleet_size',
  'strategic insight': 'strategic_insight',
  'strategic_insight': 'strategic_insight',
  'partner stage': 'partner_stage',
  'partner_stage': 'partner_stage',
  'stage': 'partner_stage',
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  const fieldIndices: Partial<Record<keyof ParsedRow, number>> = {};

  headers.forEach((header, index) => {
    const mapped = CSV_FIELD_MAP[header];
    if (mapped) fieldIndices[mapped] = index;
  });

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const get = (key: keyof ParsedRow): string => {
      const idx = fieldIndices[key];
      return idx !== undefined ? (values[idx] || '').trim() : '';
    };

    const fleetStr = get('fleet_size');
    return {
      code: get('code') || null,
      company: get('company'),
      country: get('country') || null,
      region: get('region') || null,
      vessel_type: get('vessel_type') || null,
      vessel_segment: get('vessel_segment') || null,
      size: get('size') || null,
      company_type: get('company_type') || null,
      website: get('website') || null,
      first_name: get('first_name') || null,
      last_name: get('last_name') || null,
      source: get('source') || null,
      email: get('email') || null,
      phone: get('phone') || null,
      last_contact_date: get('last_contact_date') || null,
      activity_log: get('activity_log') || null,
      next_action: get('next_action') || null,
      priority: get('priority') || 'Medium',
      status: get('status') || 'Active',
      fleet_size: fleetStr ? parseInt(fleetStr, 10) || null : null,
      strategic_insight: get('strategic_insight') || null,
      partner_stage: get('partner_stage') || null,
    };
  });
}

function validateRow(row: ParsedRow, index: number): ValidationResult {
  const errors: string[] = [];
  if (!row.company) errors.push('Company name is required');
  if (row.company && row.company.length > 255) errors.push('Company name too long (max 255)');
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push(`Invalid email: ${row.email}`);
  if (row.priority && !COMPANY_PRIORITIES.includes(row.priority as any)) errors.push(`Invalid priority: ${row.priority}`);
  if (row.status && !COMPANY_STATUSES.includes(row.status as any)) errors.push(`Invalid status: ${row.status}`);
  if (row.last_contact_date && isNaN(Date.parse(row.last_contact_date))) errors.push(`Invalid date: ${row.last_contact_date}`);

  return { row, rowIndex: index + 2, errors, isValid: errors.length === 0 };
}

export default function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [matchedRows, setMatchedRows] = useState<MatchedRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('create');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: existingCompanies = [] } = useCompanies();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMatchedRows(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setResults(rows.map((r, i) => validateRow(r, i)));
    };
    reader.readAsText(file);
  }, []);

  // Match rows against existing companies
  const processMatching = useCallback(() => {
    if (!results) return;
    const validRows = results.filter(r => r.isValid);

    const matched: MatchedRow[] = validRows.map(r => {
      const csvName = r.row.company.toLowerCase().trim();
      const csvCountry = (r.row.country || '').toLowerCase().trim();

      const existing = existingCompanies.find(c => {
        const eName = c.company.toLowerCase().trim();
        const eCountry = (c.country || '').toLowerCase().trim();
        return eName === csvName && eCountry === csvCountry;
      });

      if (existing) {
        if (importMode === 'upsert') {
          return { ...r, action: 'update' as const, existingId: existing.id };
        }
        return { ...r, action: 'skip' as const, existingId: existing.id };
      }
      return { ...r, action: 'create' as const };
    });

    setMatchedRows(matched);
  }, [results, existingCompanies, importMode]);

  const summary = useMemo(() => {
    if (!matchedRows) return null;
    const creates = matchedRows.filter(r => r.action === 'create').length;
    const updates = matchedRows.filter(r => r.action === 'update').length;
    const skips = matchedRows.filter(r => r.action === 'skip').length;
    return { creates, updates, skips };
  }, [matchedRows]);

  const validCount = results?.filter(r => r.isValid).length ?? 0;
  const errorCount = results?.filter(r => !r.isValid).length ?? 0;

  const handleImport = async () => {
    if (!matchedRows || !user) return;

    const toCreate = matchedRows.filter(r => r.action === 'create');
    const toUpdate = matchedRows.filter(r => r.action === 'update');
    if (toCreate.length === 0 && toUpdate.length === 0) return;

    setImporting(true);
    try {
      let insertedCount = 0;
      let updatedCount = 0;

      // Insert new companies
      if (toCreate.length > 0) {
        const companyInserts = toCreate.map(({ row }) => ({
          code: row.code,
          company: row.company,
          country: row.country,
          region: row.region,
          vessel_type: row.vessel_type,
          vessel_segment: row.vessel_segment,
          size: row.size,
          company_type: row.company_type,
          website: row.website,
          first_name: row.first_name,
          last_name: row.last_name,
          source: row.source,
          email: row.email,
          phone: row.phone,
          last_contact_date: row.last_contact_date,
          next_action: row.next_action,
          priority: row.priority,
          status: row.status,
          fleet_size: row.fleet_size,
          strategic_insight: row.strategic_insight,
          partner_stage: row.partner_stage,
          created_by: user.id,
        }));

        const { data: inserted, error } = await supabase
          .from('companies')
          .insert(companyInserts as any)
          .select('id');

        if (error) throw error;
        insertedCount = inserted?.length ?? 0;

        // Create activities for rows with activity_log
        const activityInserts = toCreate
          .map(({ row }, i) => {
            if (!row.activity_log || !inserted?.[i]) return null;
            return {
              company_id: inserted[i].id,
              activity_text: row.activity_log,
              activity_type: 'internal' as const,
              created_by: user.id,
            };
          })
          .filter(Boolean);

        if (activityInserts.length > 0) {
          await supabase.from('activities').insert(activityInserts as any);
        }
      }

      // Update existing companies (only non-empty CSV fields)
      if (toUpdate.length > 0) {
        for (const { row, existingId } of toUpdate) {
          const updates: Record<string, any> = {};
          const fields: (keyof ParsedRow)[] = [
            'code', 'region', 'vessel_type', 'vessel_segment', 'size',
            'company_type', 'website', 'first_name', 'last_name', 'source',
            'email', 'phone', 'last_contact_date', 'next_action',
            'strategic_insight', 'partner_stage',
          ];
          for (const f of fields) {
            if (row[f]) updates[f] = row[f];
          }
          // Handle special fields
          if (row.priority && row.priority !== 'Medium') updates.priority = row.priority;
          if (row.status && row.status !== 'Active') updates.status = row.status;
          if (row.fleet_size !== null) updates.fleet_size = row.fleet_size;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('companies')
              .update(updates)
              .eq('id', existingId!);
            if (error) throw error;
            updatedCount++;
          }

          // Activity log for updates
          if (row.activity_log) {
            await supabase.from('activities').insert({
              company_id: existingId!,
              activity_text: row.activity_log,
              activity_type: 'internal' as const,
              created_by: user.id,
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });

      const parts = [];
      if (insertedCount > 0) parts.push(`${insertedCount} created`);
      if (updatedCount > 0) parts.push(`${updatedCount} updated`);
      const skipped = matchedRows.filter(r => r.action === 'skip').length;
      if (skipped > 0) parts.push(`${skipped} skipped`);

      toast({ title: `Import complete: ${parts.join(', ')}` });
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setResults(null);
    setMatchedRows(null);
    setFileName('');
    setImportMode('create');
  };

  const actionColor = (action: MatchAction) => {
    switch (action) {
      case 'create': return 'bg-success/10 text-success';
      case 'update': return 'bg-warning/10 text-warning';
      case 'skip': return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Import Companies from CSV</DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="space-y-6 py-4">
            {/* Import mode selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Import Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('create')}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    importMode === 'create' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <PlusCircle className={`h-5 w-5 shrink-0 ${importMode === 'create' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">Create Only</p>
                    <p className="text-xs text-muted-foreground">Skip duplicates</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('upsert')}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    importMode === 'upsert' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <ArrowUpDown className={`h-5 w-5 shrink-0 ${importMode === 'upsert' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">Create + Update</p>
                    <p className="text-xs text-muted-foreground">Upsert by name + country</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Upload a CSV file. Duplicates matched by company name + country (case-insensitive).
              </p>
              <label className="cursor-pointer">
                <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
                <Button variant="outline" asChild><span><Upload className="h-4 w-4 mr-2" /> Choose File</span></Button>
              </label>
            </div>
          </div>
        ) : !matchedRows ? (
          /* Step 2: Validation results, prompt to analyze matches */
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{fileName}</span>
              <Badge variant="outline" className="bg-success/10 text-success">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {validCount} valid
              </Badge>
              {errorCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                  <AlertCircle className="h-3 w-3 mr-1" /> {errorCount} errors
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {importMode === 'create' ? 'Create Only' : 'Create + Update'}
              </Badge>
            </div>

            {errorCount > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                <p className="text-xs font-medium text-destructive mb-1">Errors (these rows will be skipped):</p>
                {results.filter(r => !r.isValid).map(r => (
                  <p key={r.rowIndex} className="text-xs text-destructive/80">Row {r.rowIndex}: {r.errors.join('; ')}</p>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>Choose Different File</Button>
              <Button onClick={processMatching} disabled={validCount === 0}>
                <RefreshCw className="h-4 w-4 mr-2" /> Analyze & Preview
              </Button>
            </div>
          </div>
        ) : (
          /* Step 3: Match preview + confirm */
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="text-muted-foreground font-medium">Preview:</span>
              {summary && (
                <>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    <PlusCircle className="h-3 w-3 mr-1" /> {summary.creates} new
                  </Badge>
                  {summary.updates > 0 && (
                    <Badge variant="outline" className="bg-warning/10 text-warning">
                      <RefreshCw className="h-3 w-3 mr-1" /> {summary.updates} to update
                    </Badge>
                  )}
                  {summary.skips > 0 && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      {summary.skips} skipped (duplicates)
                    </Badge>
                  )}
                </>
              )}
            </div>

            <div className="rounded-lg border overflow-hidden max-h-[45vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchedRows.map((r) => (
                    <TableRow key={r.rowIndex} className={r.action === 'skip' ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-xs">{r.rowIndex}</TableCell>
                      <TableCell className="font-medium text-sm">{r.row.company}</TableCell>
                      <TableCell className="text-sm">{r.row.country || '—'}</TableCell>
                      <TableCell className="text-sm">{r.row.status}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${actionColor(r.action)}`}>
                          {r.action === 'create' ? 'New' : r.action === 'update' ? 'Update' : 'Skip'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setMatchedRows(null)}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={importing || (summary?.creates === 0 && summary?.updates === 0)}
              >
                {importing ? 'Importing...' : 'Confirm Import'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
