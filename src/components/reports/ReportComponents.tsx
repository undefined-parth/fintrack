import { type ClassValue, clsx } from 'clsx';
import { motion } from 'framer-motion';
import { type LucideIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlassCard = memo(
  ({
    children,
    className,
    onClick,
  }: {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    onClick?: () => void;
  }) => (
    <motion.div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-4xl border border-white/5 bg-white/2 p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/10 hover:bg-white/4',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  )
);

GlassCard.displayName = 'GlassCard';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: number;
  colorClass?: string;
}

export const StatCard = memo(
  ({ label, value, subValue, icon: Icon, trend, colorClass }: StatCardProps) => (
    <GlassCard>
      <div className="mb-6 flex items-center justify-between">
        <div className={cn('rounded-2xl bg-white/3 p-3 shadow-inner', colorClass)}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-black',
              trend > 0 ? 'text-secondary' : 'text-tertiary'
            )}
          >
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mb-2 text-[10px] font-black tracking-[0.4em] text-outline uppercase">{label}</p>
      <p
        className={cn(
          'mb-3 font-mono text-3xl leading-none font-black tracking-tighter',
          colorClass
        )}
      >
        {value}
      </p>

      {subValue && (
        <p className="text-[8px] font-bold tracking-widest text-outline/50 uppercase">{subValue}</p>
      )}
    </GlassCard>
  )
);

StatCard.displayName = 'StatCard';

export const SectionHeader = memo(
  ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: LucideIcon }) => (
    <div className="mb-14 flex items-center gap-8">
      <div className="flex items-center gap-5 whitespace-nowrap">
        {Icon && <Icon className="h-6 w-6 text-primary md:h-10 md:w-10" />}
        <h2 className="text-2xl font-black tracking-tighter text-on-background uppercase italic md:text-4xl">
          {title.split(' ')[0]}{' '}
          <span className="text-outline-variant not-italic opacity-40">
            {title.split(' ').slice(1).join(' ')}
          </span>
        </h2>
      </div>
      <div className="h-0.5 flex-1 bg-linear-to-r from-primary/30 to-transparent" />
      <p className="text-[10px] font-bold tracking-[0.3em] text-outline uppercase">{subtitle}</p>
    </div>
  )
);

SectionHeader.displayName = 'SectionHeader';
