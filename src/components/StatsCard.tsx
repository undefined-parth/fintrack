import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type AccentVariant = 'primary' | 'secondary' | 'tertiary' | 'warning';
export type BadgeVariant = 'up' | 'down' | 'neutral';

const accentStyles: Record<AccentVariant, { bar: string }> = {
  primary: { bar: 'bg-primary' },
  secondary: { bar: 'bg-secondary' },
  tertiary: { bar: 'bg-tertiary' },
  warning: { bar: 'bg-warning' },
};

const badgeStyles: Record<BadgeVariant, string> = {
  up: 'bg-secondary/10 text-secondary',
  down: 'bg-tertiary/10 text-tertiary',
  neutral: 'bg-primary/10 text-primary',
};

const renderBadgeIcon = (variant: BadgeVariant) => {
  switch (variant) {
    case 'up':
      return <TrendingUp className="mr-1 h-3 w-3 shrink-0" />;
    case 'down':
      return <TrendingDown className="mr-1 h-3 w-3 shrink-0" />;
    case 'neutral':
      return <span className="mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />;
    default:
      return null;
  }
};

interface StatsCardProps {
  title: string;
  value: number;
  accent?: AccentVariant;
  badge?: string;
  badgeVariant?: BadgeVariant;
  currency?: string;
  variant?: 'default' | 'compact';
}

const StatsCard = ({
  title,
  value,
  accent = 'primary',
  badge,
  badgeVariant = 'neutral',
  currency,
  variant = 'default',
}: StatsCardProps) => {
  const styles = accentStyles[accent];

  if (variant === 'default') {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-all duration-200 hover:border-outline-variant/30">
        <div className={`absolute top-0 right-0 left-0 h-0.5 ${styles.bar} opacity-50`} />
        <p className="mb-3 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
          {title}
        </p>
        <p className="font-mono text-2xl font-semibold tracking-tight text-on-surface">
          {formatCurrency(value, false, currency)}
        </p>
        {badge && (
          <span
            className={`mt-2.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStyles[badgeVariant]}`}
          >
            {renderBadgeIcon(badgeVariant)}
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-all duration-200 hover:border-outline-variant/30">
      <div className={`absolute top-0 right-0 left-0 h-0.5 ${styles.bar} opacity-50`} />
      <p className="mb-3 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
        {title}
      </p>
      <p className="font-mono text-2xl font-semibold tracking-tight text-on-surface">
        {formatCurrency(value, false, currency)}
      </p>
    </div>
  );
};

export default StatsCard;
