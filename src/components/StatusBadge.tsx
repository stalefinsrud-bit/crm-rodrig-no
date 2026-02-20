import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, PRIORITY_COLORS, type ProspectStatus, type ProspectPriority } from '@/types/prospect';

export function StatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <Badge variant="outline" className={`${STATUS_COLORS[status]} text-xs font-medium border`}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: ProspectPriority }) {
  return (
    <Badge variant="outline" className={`${PRIORITY_COLORS[priority]} text-xs font-medium border-transparent`}>
      {priority}
    </Badge>
  );
}
