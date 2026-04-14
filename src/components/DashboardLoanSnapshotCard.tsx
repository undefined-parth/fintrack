import type { Loan } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const DashboardLoanSnapshotCard = ({ l }: { l: Loan }) => {
  return (
    <div className="rounded-xl bg-surface-container-low p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-on-surface">
          <p className="tracking-wides text-[10px] font-bold text-ellipsis text-on-surface uppercase">
            Loan {l.type === 'given' ? 'Given to' : 'Taken from'} {l.personName}
          </p>
          <h4 className="text-lg font-bold">{formatCurrency(l.remainingAmount, false)}</h4>
        </div>
      </div>
    </div>
  );
};

export default DashboardLoanSnapshotCard;
