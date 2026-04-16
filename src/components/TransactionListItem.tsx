import type { Account, Category, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import IconIncome from '@/assets/icons/IconIncome';
import IconExpense from '@/assets/icons/IconExpense';
import IconTransfer from '@/assets/icons/IconTransfer';
import IconLoan from '@/assets/icons/IconLoan';
import IconLoanSettlement from '@/assets/icons/IconLoanSettlement';

// ── Compact variant style maps ───────────────────────────────────────────────

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

// ── Default variant helpers ──────────────────────────────────────────────────

const getTransactionStyles = (tx: Transaction) => {
  switch (tx.type) {
    case 'income':
      return {
        icon: <IconIncome />,
        bg: 'bg-secondary/10 text-secondary',
        amount: 'text-secondary',
      };
    case 'expense':
      return {
        icon: <IconExpense />,
        bg: 'bg-tertiary/10 text-tertiary',
        amount: 'text-tertiary',
      };
    case 'transfer':
      return { icon: <IconTransfer />, bg: 'bg-primary/10 text-primary', amount: 'text-primary' };
    case 'loan': {
      const isSettlement = tx.loanType === 'settlement';
      return {
        icon: isSettlement ? <IconLoanSettlement /> : <IconLoan />,
        bg: isSettlement ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary',
        amount: 'text-on-surface',
      };
    }
    default:
      return {
        icon: <IconTransfer />,
        bg: 'bg-surface-variant text-outline',
        amount: 'text-on-surface',
      };
  }
};

// ── Props ────────────────────────────────────────────────────────────────────

interface TransactionListItemProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  variant?: 'default' | 'compact';
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const TransactionListItem = ({
  transaction,
  category,
  account,
  variant = 'default',
  onEdit,
  onDelete,
}: TransactionListItemProps) => {
  const type = transaction.type === 'loan' ? 'loan' : transaction.type;
  const isLoan = transaction.type === 'loan';

  // ─── Compact variant (Dashboard) ────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div 
        onClick={() => onEdit?.(transaction.id)}
        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 transition-colors hover:border-outline-variant/50"
      >
        {/* Dot */}
        <div className={`h-2 w-2 shrink-0 rounded-full ${dotClass[type] ?? dotClass.transfer}`} />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-on-surface">
            {transaction.title}
          </p>
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
  }

  // ─── Default variant (Transactions page) ────────────────────────────────────
  const styles = getTransactionStyles(transaction);

  return (
    <div 
      onClick={() => onEdit?.(transaction.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 transition-colors hover:border-outline-variant/50"
    >
      {/* Visual Icon Section */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] ${styles.bg} shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md`}
      >
        {styles.icon}
      </div>

      {/* Details Section */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <p className="truncate text-lg font-bold text-on-surface">{transaction.title}</p>
          <div className="flex gap-1.5">
            {transaction.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold tracking-tight text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-outline">
          <span className="flex items-center gap-1 text-outline">
            <span className="capitalize">{transaction.type}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-on-surface-variant/50"></span>
            <span>{category?.name || 'Uncategorized'}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-on-surface-variant/50"></span>
            <span className="text-outline/80">{formatDate(transaction.date)}</span>
          </span>
        </div>
      </div>

      {/* Amount & Account Section */}
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className={`font-mono text-xl font-medium ${styles.amount}`}>
            {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : ''}
            {formatCurrency(transaction.amount, false)}
          </p>
          <p className="mt-0.5 text-[11px] tracking-wide text-outline uppercase opacity-60">
            via {account?.name || 'Unknown'}
          </p>
        </div>

        {/* Hover Controls */}
        <div className="flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
          {!isLoan ? (
            <>
              <button
                type="button"
                title="Edit Transaction"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(transaction.id);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-lg text-outline transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
              >
                ✏️
              </button>
              <button
                type="button"
                title="Delete Transaction"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(transaction.id);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-lg text-outline transition-all hover:bg-error-container/30 hover:text-error active:scale-90"
              >
                🗑️
              </button>
            </>
          ) : (
            <div
              className="flex h-10 w-10 cursor-help items-center justify-center rounded-xl bg-surface-variant/30 text-outline/30"
              title="Loan transactions are protected"
            >
              🔒
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionListItem;
