import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  text: string;
}

export function KPITooltip({ text }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex p-0.5 rounded text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
