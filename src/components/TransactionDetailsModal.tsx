import { useState, useMemo } from 'react';
import type { Account, Category, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useTransactionStore } from '@/stores/useTransactionStore';
import {
  X,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category?: Category;
  account?: Account;
  categories: Category[];
  onSelectTransaction?: (tx: Transaction) => void;
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  category,
  account,
  categories,
  onSelectTransaction,
}: TransactionDetailsModalProps) {
  const transactions = useTransactionStore((state) => state.transactions);
  const [copied, setCopied] = useState(false);

  // Copy unique transaction ID helper
  const handleCopyId = () => {
    if (!transaction) return;
    void navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 1. Calculate Monthly Spending History for this category
  const historicalMonthlyData = useMemo(() => {
    if (!transaction) return [];

    // Filter siblings in the same category & user
    const siblings = transactions.filter(
      (t) => t.userId === transaction.userId && t.categoryId === transaction.categoryId
    );

    const monthsData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'MMM yyyy');
      monthsData[key] = 0;
    }

    siblings.forEach((t) => {
      try {
        const date = parseISO(t.date);
        const key = format(date, 'MMM yyyy');
        if (key in monthsData) {
          monthsData[key] += t.amount;
        }
      } catch {
        // Safe check for date parser failures
      }
    });

    return Object.entries(monthsData).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [transaction, transactions]);

  // 2. Fetch related transactions by shared tags
  const relatedTransactions = useMemo(() => {
    if (!transaction || !transaction.tags || transaction.tags.length === 0) return [];
    return transactions
      .filter(
        (t) =>
          t.userId === transaction.userId &&
          t.id !== transaction.id &&
          t.tags.some((tag) => transaction.tags.includes(tag))
      )
      .slice(0, 3);
  }, [transaction, transactions]);

  // Get active styling based on transaction type
  const typeStyles = useMemo(() => {
    if (!transaction) return { color: 'text-on-surface', label: 'Transaction' };
    switch (transaction.type) {
      case 'income':
        return { color: 'text-secondary', label: 'Income' };
      case 'expense':
        return { color: 'text-tertiary', label: 'Expense' };
      default:
        return { color: 'text-primary', label: 'Transfer' };
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="custom-scrollbar relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-2xl border border-outline-variant/15 bg-surface p-6 shadow-2xl"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[10px] font-bold tracking-widest uppercase ${typeStyles.color}`}
              >
                {typeStyles.label} Details
              </span>
              <h2 className="mt-1 text-lg font-bold text-on-surface">{transaction.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <X size={16} />
            </button>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-outline-variant/10 bg-surface-container/20 p-5 text-center">
            <span className="text-[10px] font-bold tracking-wider text-on-surface-variant/60 uppercase">
              Transaction Volume
            </span>
            <div className={`font-mono text-3xl font-bold tracking-tight ${typeStyles.color}`}>
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : ''}
              {formatCurrency(transaction.amount, false)}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-on-surface-variant">
              <Calendar size={12} className="text-outline" />
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>

          {/* Transaction Flow Diagram */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
              Flow Vector
            </h3>
            <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container/40 px-4 py-3.5 text-xs font-semibold">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase">
                  From
                </span>
                <span className="text-on-surface">
                  {transaction.type === 'income'
                    ? transaction.description || 'External Direct'
                    : account?.name || 'Asset Account'}
                </span>
              </div>
              <ArrowRight size={14} className="mx-2 shrink-0 text-primary/75" />
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase">
                  To
                </span>
                <span className="text-on-surface">
                  {transaction.type === 'income'
                    ? account?.name || 'Asset Account'
                    : category?.name || 'Uncategorized'}
                </span>
              </div>
            </div>
          </div>

          {/* Category Infographics (Bar Chart) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                <TrendingUp size={12} /> Category Spending Velocity
              </h3>
              <span className="text-[10px] font-semibold text-outline">
                {category?.name || 'Uncategorized'} (6m)
              </span>
            </div>
            <div className="h-32 w-full rounded-xl border border-outline-variant/10 bg-surface-container/20 p-2 font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={historicalMonthlyData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <XAxis dataKey="month" stroke="#71717a" tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(63, 63, 70, 0.15)',
                      borderRadius: '6px',
                      color: '#fafafa',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {historicalMonthlyData.map((entry, index) => {
                      const isCurrentMonth =
                        entry.month === format(parseISO(transaction.date), 'MMM yyyy');
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isCurrentMonth ? '#a78bfa' : 'rgba(167, 139, 250, 0.25)'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metadata & Tag List */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                <Layers size={11} /> Taxonomy
              </h3>
              <div className="space-y-1 rounded-xl border border-outline-variant/10 bg-surface-container/30 px-3.5 py-3">
                <p className="text-[10px] font-semibold text-on-surface-variant">
                  Category: <span className="text-on-surface">{category?.name || 'None'}</span>
                </p>
                <p className="text-[10px] font-semibold text-on-surface-variant">
                  Account: <span className="text-on-surface">{account?.name || 'None'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                <Tag size={11} /> Assigned Tags
              </h3>
              <div className="flex min-h-14.5 flex-wrap content-start items-start gap-1 rounded-xl border border-outline-variant/10 bg-surface-container/30 p-2">
                {transaction.tags && transaction.tags.length > 0 ? (
                  transaction.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[9px] font-bold text-primary"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="p-1 text-[10px] text-on-surface-variant/40 italic">
                    No tags assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Related Transactions (Click-to-Traverse) */}
          {relatedTransactions.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                Related Transactions (Shared Tags)
              </h3>
              <div className="flex flex-col gap-1.5">
                {relatedTransactions.map((tx) => {
                  const txCategory = categories.find((c) => c.id === tx.categoryId);
                  return (
                    <button
                      key={tx.id}
                      onClick={() => onSelectTransaction?.(tx)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container/20 px-3.5 py-2.5 text-left transition hover:bg-surface-container-high/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-on-surface transition-colors group-hover:text-primary">
                          {tx.title}{' '}
                          <ExternalLink
                            size={10}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">
                          {txCategory?.name || 'Uncategorized'} · {formatDate(tx.date)}
                        </p>
                      </div>
                      <span className="ml-3 shrink-0 font-mono text-xs font-semibold text-on-surface">
                        {formatCurrency(tx.amount, false)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audit trail / copy ID */}
          <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4 font-mono text-[10px] text-outline/70">
            <span className="flex items-center gap-1">
              <Clock size={11} /> ID: {transaction.id.slice(0, 18)}...
            </span>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 rounded px-2 py-1 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-secondary" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy Hash
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
