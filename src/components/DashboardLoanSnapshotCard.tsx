import type { Loan } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const DashboardLoanSnapshotCard = ({ l, currency }: { l: Loan; currency?: string }) => {
  const isGiven = l.type === 'given';

  return (
    <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className={`h-1.5 w-1.5 rounded-full ${isGiven ? 'bg-[#fbbf24]' : 'bg-tertiary'}`} />
        <div>
          <p className="text-[12px] font-semibold text-on-surface-variant">
            {isGiven ? `Given → ${l.personName}` : `Taken ← ${l.personName}`}
          </p>
        </div>
      </div>
      <p className="font-mono text-[13px] font-medium text-on-surface">
        {formatCurrency(l.remainingAmount, false, currency)}
      </p>
    </div>
  );
};

export default DashboardLoanSnapshotCard;
