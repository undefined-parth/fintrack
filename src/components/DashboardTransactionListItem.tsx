import type { Category, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

const DashboardTransactionListItem = ({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) => {
  const getCategoryName = (id: string) => {
    const category = categories.find((category) => category.id === id);
    return category?.name;
  };
  return (
    <div className="group relative flex cursor-pointer items-center overflow-hidden rounded-xl bg-surface-container-low p-4 transition-all hover:bg-surface-container-highest">
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${transaction.type === 'income' ? 'bg-secondary' : 'bg-error'}`}
      ></div>

      <div className="flex-1">
        <h4 className="font-bold text-on-surface">{transaction.title}</h4>
        <p className="text-xs text-on-surface-variant">
          {getCategoryName(transaction.categoryId)} • {formatDate(transaction.date)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-on-surface">{formatCurrency(transaction.amount, false)}</p>
      </div>
    </div>
  );
};

export default DashboardTransactionListItem;
