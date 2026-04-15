import type { Category, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

const dotClass: Record<string, string> = {
  income: 'bg-secondary shadow-[0_0_6px_rgba(105,246,184,0.5)]',
  expense: 'bg-tertiary shadow-[0_0_6px_rgba(255,136,135,0.5)]',
  loan: 'bg-primary shadow-[0_0_6px_rgba(121,157,255,0.5)]',
  transfer: 'bg-on-surface-variant',
};

const amountClass: Record<string, string> = {
  income: 'text-secondary',
  expense: 'text-tertiary',
  loan: 'text-on-surface-variant',
  transfer: 'text-on-surface-variant',
};

const amountPrefix: Record<string, string> = {
  income: '+',
  expense: '−',
  loan: '',
  transfer: '',
};

const DashboardTransactionListItem = ({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) => {
  const category = categories.find((c) => c.id === transaction.categoryId);
  const type = transaction.type === 'loan' ? 'loan' : transaction.type;

  return (
    <div className="group flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 transition-colors hover:border-outline-variant/50">
      {/* Dot */}
      <div className={`h-2 w-2 shrink-0 rounded-full ${dotClass[type] ?? dotClass.transfer}`} />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-on-surface">{transaction.title}</p>
        <p className="mt-0.5 text-[11px] text-outline">
          {category?.name ?? '—'} · {formatDate(transaction.date)}
        </p>
      </div>

      {/* Amount */}
      <p
        className={`shrink-0 font-mono text-[14px] font-medium ${amountClass[type] ?? amountClass.transfer}`}
      >
        {amountPrefix[type]}
        {formatCurrency(transaction.amount, false)}
      </p>
    </div>
  );
};

export default DashboardTransactionListItem;
