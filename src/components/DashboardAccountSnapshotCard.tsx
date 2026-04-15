import type { Account } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const DashboardAccountSnapshotCard = ({ a, currency }: { a: Account; currency?: string }) => {
  const displayValue = a.type === 'credit' ? (a.limit ?? 0) - (a.used ?? 0) : (a.balance ?? 0);

  return (
    <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
        <p className="text-[12px] font-semibold text-on-surface-variant capitalize">{a.name}</p>
        {a.type === 'credit' && (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
            Credit
          </span>
        )}
      </div>
      <p className="font-mono text-[13px] font-medium text-on-surface">
        {formatCurrency(displayValue, false, currency)}
      </p>
    </div>
  );
};

export default DashboardAccountSnapshotCard;
