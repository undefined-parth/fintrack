import type { Loan } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const DashboardLoanSnapshotCard = ({ l, currency }: { l: Loan; currency?: string }) => {
  const isGiven = l.type === 'given';

  return (
    <div className="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-container-highest/30">
      <div className="flex items-center gap-2.5">
        <div className={`h-1.5 w-1.5 rounded-full ${isGiven ? 'bg-warning' : 'bg-tertiary'}`} />
        <div>
          <p className="text-[12px] font-semibold text-on-surface">
            {isGiven ? `Given → ${l.personName}` : `Taken ← ${l.personName}`}
          </p>
        </div>
      </div>
      <p
        className={`font-mono text-sm font-medium ${isGiven ? 'text-secondary' : 'text-tertiary'}`}
      >
        {formatCurrency(l.remainingAmount, false, currency)}
      </p>
    </div>
  );
};

export default DashboardLoanSnapshotCard;
