import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { COMPANY_STATUSES, COMPANY_PRIORITIES } from '@/types/company';

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
}

interface ValidationResult {
  row: ParsedRow;
  rowIndex: number;
  errors: string[];
  isValid: boolean;
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
      status: get('status') || 'New Lead',
      fleet_size: fleetStr ? parseInt(fleetStr, 10) || null : null,
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
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setResults(rows.map((r, i) => validateRow(r, i)));
    };
    reader.readAsText(file);
  }, []);

  const validCount = results?.filter(r => r.isValid).length ?? 0;
  const errorCount = results?.filter(r => !r.isValid).length ?? 0;

  const handleImport = async () => {
    if (!results || !user) return;
    const validRows = results.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const companyInserts = validRows.map(({ row }) => ({
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
        created_by: user.id,
      }));

      const { data: inserted, error } = await supabase
        .from('companies')
        .insert(companyInserts as any)
        .select('id');

      if (error) throw error;

      // Create activities for rows with activity_log text
      const activityInserts = validRows
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
        const { error: actErr } = await supabase.from('activities').insert(activityInserts as any);
        if (actErr) console.error('Activity insert error:', actErr);
      }

      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: `Imported ${inserted?.length ?? 0} companies` });
      setResults(null);
      setFileName('');
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setResults(null);
    setFileName('');
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
          <div className="flex flex-col items-center gap-4 py-8">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Upload a CSV file with columns: Code, Company, Country, Region, Vessel type, Vessel Segment, Size, Company type, Website, First name, Last name, Source, Email, Phone, Last contact date, Activity log, Next action, Priority, Status, Fleet size
            </p>
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
              <Button variant="outline" asChild><span><Upload className="h-4 w-4 mr-2" /> Choose File</span></Button>
            </label>
          </div>
        ) : (
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
            </div>

            <div className="rounded-lg border overflow-hidden max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.rowIndex} className={r.isValid ? '' : 'bg-destructive/5'}>
                      <TableCell className="font-mono text-xs">{r.rowIndex}</TableCell>
                      <TableCell className="font-medium text-sm">{r.row.company || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.row.company_type || '—'}</TableCell>
                      <TableCell className="text-sm">{r.row.country || '—'}</TableCell>
                      <TableCell className="text-sm">{r.row.status}</TableCell>
                      <TableCell>
                        {r.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <span className="text-xs text-destructive">{r.errors.join('; ')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>Choose Different File</Button>
              <Button onClick={handleImport} disabled={importing || validCount === 0}>
                {importing ? 'Importing...' : `Import ${validCount} Companies`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
