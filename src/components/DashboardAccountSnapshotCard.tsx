import type { Account } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const DashboardAccountSnapshotCard = ({ a }: { a: Account }) => {
  return (
    <div className="rounded-xl bg-surface-container-low p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-on-surface">
          <p className="tracking-wides text-[10px] font-bold text-on-surface uppercase">{a.name}</p>
          <h4 className="text-lg font-bold">{formatCurrency(a.balance!, false)}</h4>
        </div>
      </div>
    </div>
  );
};
export default DashboardAccountSnapshotCard;
