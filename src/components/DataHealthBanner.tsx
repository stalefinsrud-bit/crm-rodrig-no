import { useState, useMemo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Company } from '@/types/company';

interface Props {
  companies: Company[];
}

export function DataHealthBanner({ companies }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const issues = useMemo(() => {
    const warnings: string[] = [];
    const missingStage = companies.filter(c => !c.stage).length;
    const missingFleet = companies.filter(c => c.fleet_size == null).length;
    const missingType = companies.filter(c => !c.company_type).length;

    // Duplicate detection (case-insensitive company name)
    const nameMap = new Map<string, number>();
    companies.forEach(c => {
      const key = c.company.trim().toLowerCase();
      nameMap.set(key, (nameMap.get(key) || 0) + 1);
    });
    const dupes = [...nameMap.values()].filter(v => v > 1).length;

    if (missingStage > 0) warnings.push(`${missingStage} records missing stage data`);
    if (missingFleet > 0) warnings.push(`${missingFleet} records missing fleet size`);
    if (missingType > 0) warnings.push(`${missingType} records missing company type`);
    if (dupes > 0) warnings.push(`${dupes} potential duplicate companies detected`);

    return warnings;
  }, [companies]);

  if (dismissed || issues.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Data Quality Notice</p>
        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
          {issues.map((issue, i) => (
            <li key={i}>• {issue}. Review for accurate reporting.</li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
