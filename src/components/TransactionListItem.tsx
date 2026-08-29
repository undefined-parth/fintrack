import { useState } from 'react';
import type { Account, Category, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import IconIncome from '@/assets/icons/IconIncome';
import IconExpense from '@/assets/icons/IconExpense';
import IconTransfer from '@/assets/icons/IconTransfer';
import IconLoan from '@/assets/icons/IconLoan';
import IconLoanSettlement from '@/assets/icons/IconLoanSettlement';
import { Edit2, Trash2, Lock } from 'lucide-react';

// ── Compact variant style maps ───────────────────────────────────────────────

const dotClass: Record<string, string> = {
  income: 'bg-secondary',
  expense: 'bg-tertiary',
  loan: 'bg-primary',
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
        bg: 'bg-surface-variant text-on-surface-variant',
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
  onViewDetail?: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const TransactionListItem = ({
  transaction,
  category,
  account,
  variant = 'default',
  onEdit,
  onDelete,
  onViewDetail,
}: TransactionListItemProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const type = transaction.type === 'loan' ? 'loan' : transaction.type;
  const isLoan = transaction.type === 'loan';
  const isDefault = transaction.categoryId === 'sys_loan_default';

  // ─── Compact variant (Dashboard) ────────────────────────────────────────────
  if (variant === 'compact') {
    const isInteractive = !!onViewDetail || !!onEdit;
    return (
      <div
        onClick={
          onViewDetail
            ? () => onViewDetail(transaction.id)
            : isInteractive
              ? () => onEdit?.(transaction.id)
              : undefined
        }
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onViewDetail) {
                    onViewDetail(transaction.id);
                  } else {
                    onEdit?.(transaction.id);
                  }
                }
              }
            : undefined
        }
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        className={`group flex items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-3.5 transition-all ${
          isInteractive
            ? 'cursor-pointer hover:border-outline-variant/30 focus-visible:outline-2 focus-visible:outline-primary/50'
            : ''
        }`}
      >
        {/* Dot */}
        <div className={`h-2 w-2 shrink-0 rounded-full ${dotClass[type] ?? dotClass.transfer}`} />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-on-surface">{transaction.title}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {category?.name ?? '—'} · {formatDate(transaction.date)}
          </p>
        </div>

        {/* Amount */}
        <p
          className={`shrink-0 font-mono text-[14px] font-medium ${
            amountClass[type] ?? amountClass.transfer
          }`}
        >
          {amountPrefix[type]}
          {formatCurrency(transaction.amount, false)}
        </p>
      </div>
    );
  }

  // ─── Default variant (Transactions page) ────────────────────────────────────
  const styles = getTransactionStyles(transaction);
  const isInteractive = !!onViewDetail || !!onEdit;

  return (
    <div
      onClick={
        onViewDetail && !confirmDelete
          ? () => onViewDetail(transaction.id)
          : isInteractive && !confirmDelete
            ? () => onEdit?.(transaction.id)
            : undefined
      }
      onKeyDown={
        isInteractive && !confirmDelete
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onViewDetail) {
                  onViewDetail(transaction.id);
                } else {
                  onEdit?.(transaction.id);
                }
              }
            }
          : undefined
      }
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !confirmDelete ? 0 : undefined}
      className={`group flex items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-3.5 transition-all ${
        isInteractive
          ? 'cursor-pointer hover:border-outline-variant/30 focus-visible:outline-2 focus-visible:outline-primary/50'
          : ''
      }`}
    >
      {/* Visual Icon Section */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] ${
          styles.bg
        } shadow-sm transition-all ${
          isInteractive ? 'group-hover:scale-110 group-hover:shadow-md' : ''
        }`}
      >
        {styles.icon}
      </div>

      {/* Details Section */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <p className="truncate text-sm font-semibold text-on-surface">{transaction.title}</p>
          <div className="flex gap-1.5">
            {transaction.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[9px] font-bold tracking-tight text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
            <span className="capitalize">{transaction.type}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-on-surface-variant/50"></span>
            <span>{category?.name || 'Uncategorized'}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-on-surface-variant/50"></span>
            <span className="text-on-surface-variant/80">{formatDate(transaction.date)}</span>
          </span>
        </div>
      </div>

      {/* Amount & Account Section */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className={`font-mono text-base font-semibold ${styles.amount}`}>
            {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : ''}
            {formatCurrency(transaction.amount, false)}
          </p>
          <p className="mt-0.5 text-[10px] tracking-wide text-on-surface-variant uppercase opacity-60">
            via {account?.name || 'Unknown'}
          </p>
        </div>

        {/* Hover Controls / Inline Confirmation */}
        {isInteractive && (
          <div className="flex min-w-18 items-center justify-end">
            {!isLoan && !isDefault ? (
              confirmDelete ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="animate-fade-in flex items-center gap-1.5 rounded-xl border border-outline-variant/15 bg-surface-container-high px-2 py-1 text-[10px] font-bold"
                >
                  <span className="text-on-surface">Delete?</span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded px-1.5 py-0.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(transaction.id);
                      setConfirmDelete(false);
                    }}
                    className="rounded bg-tertiary px-1.5 py-0.5 text-on-tertiary transition-opacity hover:opacity-90"
                  >
                    Yes
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    type="button"
                    title="Edit Transaction"
                    aria-label="Edit Transaction"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(transaction.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    title="Delete Transaction"
                    aria-label="Delete Transaction"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant transition-all hover:bg-tertiary/10 hover:text-tertiary active:scale-90"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            ) : (
              <div
                className="flex h-8 w-8 cursor-help items-center justify-center rounded-xl bg-surface-variant/30 text-on-surface-variant/40"
                title={
                  isLoan ? 'Loan transactions are protected' : 'Default transactions are protected'
                }
                role="img"
                aria-label="Protected transaction"
              >
                <Lock size={12} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionListItem;
