import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn(
      'p-5 shadow-card border-border/50 hover:shadow-elevated transition-shadow relative overflow-hidden group',
      className
    )}>
      {/* Decorative mini sparkline */}
      <div className="absolute right-3 bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg width="60" height="30" viewBox="0 0 60 30" className="text-primary">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points="0,25 10,20 20,22 30,12 40,15 50,8 60,10"
          />
        </svg>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              'text-xs font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground',
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shrink-0 shadow-gold">
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}
