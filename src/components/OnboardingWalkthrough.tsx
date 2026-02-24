import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Filter, GitBranch, BarChart3, Ship, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Filter,
    title: 'Filters',
    description: 'Use filters to narrow results by company type, vessel segment, region, stage, status and priority.',
  },
  {
    icon: GitBranch,
    title: 'Stage vs Status',
    description: 'Stage tracks pipeline progression (New → Identified → Contacted → In Dialogue → Presented → Proposal → Won). Status is the operational state (Active, On Hold, Dormant, Not Relevant). These are independent dimensions.',
  },
  {
    icon: BarChart3,
    title: 'Stage Funnel',
    description: 'Visual pipeline movement based on Stage. Track drop-off rates between each stage from Total down to Won.',
  },
  {
    icon: Ship,
    title: 'Fleet Metrics',
    description: 'Total fleet size of filtered companies and penetration rate of Won accounts.',
  },
  {
    icon: Target,
    title: 'Hit Rate & Conversion',
    description: 'Hit Rate = Dialogue+ ÷ Contacted+. Conversion = Won ÷ Contacted+. Engagement tracks active pipeline ratio.',
  },
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWalkthrough({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card shadow-2xl">
        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-muted'}`}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg p-2.5 bg-accent/10">
              <Icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Step {step + 1} of {STEPS.length}
              </p>
              <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border mt-4">
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Don't show again
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={onComplete}>
                Get Started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
