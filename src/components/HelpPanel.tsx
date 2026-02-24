import { useState } from 'react';
import { HelpCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFINITIONS = [
  { term: 'Status', definition: 'Tracks contact progress: New Lead → Contacted → Meeting Scheduled → Proposal Sent → Negotiation → Agreement Signed.' },
  { term: 'Stage', definition: 'Measures partnership maturity: Identified → Presented → In Dialogue → Proposal Sent → Negotiation → Active.' },
  { term: 'Hit Rate', definition: 'Percentage of contacted companies that responded. Formula: Responded ÷ Contacted.' },
  { term: 'Conversion', definition: 'Percentage of contacted companies that signed. Formula: Signed ÷ Contacted.' },
  { term: 'Engagement', definition: 'Ratio of actively engaged companies (responded + dialogue + proposal) to total contacted.' },
  { term: 'Fleet Penetration', definition: 'Share of total fleet covered by signed agreements. Formula: Fleet Signed ÷ Total Fleet.' },
];

interface Props {
  onRelaunchWalkthrough: () => void;
}

export function HelpPanel({ onRelaunchWalkthrough }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Help & Definitions"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border-l border-border shadow-2xl h-full overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Quick Reference</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  onRelaunchWalkthrough();
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Relaunch Walkthrough
              </Button>

              <div className="space-y-3">
                {DEFINITIONS.map(d => (
                  <div key={d.term} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm font-semibold text-foreground">{d.term}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{d.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
