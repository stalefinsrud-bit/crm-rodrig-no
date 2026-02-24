import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { KPITooltip } from '@/components/KPITooltip';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'accent' | 'success' | 'info';
  tooltip?: string;
}

const variantStyles = {
  default: 'bg-card',
  accent: 'bg-accent/5 border-accent/20',
  success: 'bg-success/5 border-success/20',
  info: 'bg-info/5 border-info/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default', tooltip }: KPICardProps) {
  return (
    <Card className={`${variantStyles[variant]} animate-fade-in`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              {tooltip && <KPITooltip text={tooltip} />}
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={`text-xs font-medium ${trend.value >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
