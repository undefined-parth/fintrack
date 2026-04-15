import { formatCurrency } from '@/utils/formatters';

export type AccentVariant = 'primary' | 'secondary' | 'tertiary' | 'warning';
export type BadgeVariant = 'up' | 'down' | 'neutral';

const accentTopBar: Record<AccentVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  warning: 'bg-[#fbbf24]',
};

const badgeStyles: Record<BadgeVariant, string> = {
  up: 'bg-secondary/10 text-secondary',
  down: 'bg-tertiary/10 text-tertiary',
  neutral: 'bg-primary/10 text-primary',
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
  // ─── Default variant (Dashboard) ────────────────────────────────────────────
  if (variant === 'default') {
    return (
      <div className="relative overflow-hidden rounded-[14px] border border-outline-variant/30 bg-surface-container p-5">
        {/* Top accent bar */}
        <div className={`absolute top-0 right-0 left-0 h-0.5 opacity-60 ${accentTopBar[accent]}`} />

        <p className="mb-2.5 text-[10px] font-bold tracking-[0.12em] text-outline uppercase">
          {title}
        </p>

        <p className="font-mono text-[26px] leading-none font-medium tracking-tight text-on-surface">
          {formatCurrency(value, false, currency)}
        </p>

        {badge && (
          <span
            className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${badgeStyles[badgeVariant]}`}
          >
            {badge}
          </span>
        )}
      </div>
    );
  }

  // ─── Compact variant (Transactions page) ────────────────────────────────────
  return (
    <div className="group relative overflow-hidden rounded-[14px] border border-outline-variant/30 bg-surface-container p-5 transition-all hover:border-outline-variant/40">
      {/* Top accent bar */}
      <div className={`absolute top-0 right-0 left-0 h-1 opacity-60 ${accentTopBar[accent]} `} />
      <p className="mb-2.5 text-[12px] font-bold tracking-[0.12em] text-outline uppercase">
        {title}
      </p>
      <p className="font-mono text-[26px] leading-none font-medium tracking-tight text-on-surface">
        {formatCurrency(value, false, currency)}
      </p>
    </div>
  );
};

export default StatsCard;
