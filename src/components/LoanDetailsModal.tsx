import { useMemo, useEffect } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { X, HandCoins } from 'lucide-react';

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

const LoanDetailsModal = ({ isOpen, onClose, loan }: LoanDetailsModalProps) => {
  const { transactions } = useTransactionStore();
  const { currentUser } = useUserStore();

  // Scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key down listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isClosed = loan?.status === 'closed';
  const isDefaulted = loan?.status === 'defaulted';
  const isInactive = isClosed || isDefaulted;
  const isGiven = loan?.type === 'given';

  // 1. Filter associated transactions (creation and settlements)
  const linkedTransactions = useMemo(() => {
    if (!loan) return [];
    return transactions
      .filter((t) => t.loanId === loan.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, loan]);

  // Settlements list (excluding the initial given/taken transaction)
  const settlements = useMemo(() => {
    return linkedTransactions.filter((t) => t.loanType === 'settlement');
  }, [linkedTransactions]);

  // 2. Timeline data showing balance paydown step-by-step
  const timelineChartData = useMemo(() => {
    if (!loan) return [];
    // Sort ascending for chronological graph plotting
    const ascTxs = [...linkedTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const initialItem = {
      name: 'Start',
      balance: loan.totalAmount,
      date: loan.startDate,
    };

    let runningBalance = loan.totalAmount;
    const steps = ascTxs
      .filter((t) => t.loanType === 'settlement')
      .map((tx) => {
        runningBalance = Math.max(0, runningBalance - tx.amount);
        return {
          name: format(new Date(tx.date), 'dd MMM'),
          balance: runningBalance,
          date: tx.date,
        };
      });

    return [initialItem, ...steps];
  }, [linkedTransactions, loan]);

  // 3. Principal breakdown (Paid vs. Remaining)
  const paidAmount = loan ? loan.totalAmount - loan.remainingAmount : 0;
  const paydownPct =
    loan && loan.totalAmount > 0 ? Math.round((paidAmount / loan.totalAmount) * 100) : 0;

  const breakdownData = loan
    ? [
        { name: 'Paid', value: paidAmount, color: '#34d399' },
        {
          name: 'Remaining',
          value: loan.remainingAmount,
          color: isDefaulted ? '#fb7185' : '#a78bfa',
        },
      ]
    : [];

  // 4. Repayment Velocity (Monthly settlement sums)
  const velocityData = useMemo(() => {
    const monthlyGroups: Record<string, number> = {};
    settlements.forEach((t) => {
      const monthKey = format(new Date(t.date), 'MMM yyyy');
      monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + t.amount;
    });

    return Object.entries(monthlyGroups)
      .map(([month, amount]) => ({ name: month, Amount: amount }))
      .reverse(); // Order chronological
  }, [settlements]);

  // If no loan selected, render nothing
  if (!loan) return null;

  // Custom tooltips styling
  const renderCustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{ payload?: unknown; value?: unknown }>;
  }) => {
    const point = payload?.[0]?.payload;
    const value = payload?.[0]?.value;
    if (
      active &&
      point &&
      typeof point === 'object' &&
      'name' in point &&
      typeof point.name === 'string' &&
      typeof value === 'number'
    ) {
      return (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-2.5 shadow-xl backdrop-blur-md">
          <p className="mb-0.5 text-[10px] font-semibold text-on-surface-variant">{point.name}</p>
          <p className="font-mono text-xs font-bold text-primary">
            {formatCurrency(value, false, currentUser?.defaultCurrency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative z-10 flex h-[85vh] w-[95%] max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2.5 ${isGiven ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}
                >
                  <HandCoins size={18} />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-on-surface">
                    {loan.personName}
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] tracking-wider uppercase ${
                        isInactive
                          ? 'bg-outline/15 text-outline'
                          : isGiven
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {loan.type}
                    </span>
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Loan overview & settlement timeline
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                aria-label="Close details modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Side: Graphs and Logs (8 cols) */}
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
                  {/* Paydown Timeline Area Chart */}
                  <div className="rounded-xl border border-outline-variant/10 bg-surface-container/30 p-5">
                    <h3 className="mb-4 text-xs font-semibold text-on-surface">
                      Payoff Timeline Curve
                    </h3>
                    <div className="h-56 w-full">
                      {timelineChartData.length <= 1 ? (
                        <div className="flex h-full items-center justify-center text-xs text-on-surface-variant/50">
                          No repayments logged yet
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timelineChartData}>
                            <defs>
                              <linearGradient id="paydownGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="5%"
                                  stopColor={isGiven ? '#34d399' : '#a78bfa'}
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={isGiven ? '#34d399' : '#a78bfa'}
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(63, 63, 70, 0.1)" />
                            <XAxis
                              dataKey="name"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) =>
                                formatCurrency(Number(v), false, currentUser?.defaultCurrency)
                              }
                            />
                            <RechartsTooltip content={renderCustomTooltip} />
                            <Area
                              type="monotone"
                              dataKey="balance"
                              name="Remaining Balance"
                              stroke={isGiven ? '#34d399' : '#a78bfa'}
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#paydownGrad)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Composed Secondary Chart (Repayment Velocity) */}
                  {velocityData.length > 0 && (
                    <div className="rounded-xl border border-outline-variant/10 bg-surface-container/30 p-5">
                      <h3 className="mb-4 text-xs font-semibold text-on-surface">
                        Monthly Repayment Velocity
                      </h3>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={velocityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(63, 63, 70, 0.1)" />
                            <XAxis
                              dataKey="name"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) =>
                                formatCurrency(Number(v), false, currentUser?.defaultCurrency)
                              }
                            />
                            <RechartsTooltip content={renderCustomTooltip} />
                            <Bar
                              dataKey="Amount"
                              fill="#34d399"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={28}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Transaction Settlement Log */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold text-on-surface">
                      Linked Settlement Log
                    </h3>
                    {settlements.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-outline-variant/15 bg-surface-container/10 py-8 text-center text-xs text-on-surface-variant">
                        No settlements recorded for this loan.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container/20">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-outline-variant/10 bg-surface-container/50 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-4 py-2.5">Title</th>
                              <th className="px-4 py-2.5 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/5 text-xs font-medium">
                            {settlements.map((tx) => (
                              <tr
                                key={tx.id}
                                className="transition-colors hover:bg-surface-container/30"
                              >
                                <td className="px-4 py-3 font-mono text-on-surface-variant">
                                  {formatDate(tx.date)}
                                </td>
                                <td className="max-w-45 truncate px-4 py-3 text-on-surface">
                                  {tx.title}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-secondary">
                                  +{formatCurrency(tx.amount, false, currentUser?.defaultCurrency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Sidebar Meta Details (4 cols) */}
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
                  {/* Paydown Progress Donut */}
                  <div className="flex flex-col items-center rounded-xl border border-outline-variant/10 bg-surface-container/30 p-5">
                    <h3 className="mb-3 self-start text-xs font-semibold text-on-surface">
                      Payoff Ratio
                    </h3>
                    <div className="relative flex h-32 w-32 items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={breakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={46}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {breakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center">
                        <span className="font-mono text-base font-bold text-on-surface">
                          {paydownPct}%
                        </span>
                        <p className="text-[8px] tracking-wider text-outline uppercase">Paid</p>
                      </div>
                    </div>

                    <div className="mt-4 w-full space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 opacity-70">
                          <span className="h-2 w-2 rounded-full bg-secondary" />
                          Principal Paid
                        </span>
                        <span className="font-mono font-semibold text-on-surface">
                          {formatCurrency(paidAmount, false, currentUser?.defaultCurrency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 opacity-70">
                          <span
                            className={`h-2 w-2 rounded-full ${isDefaulted ? 'bg-tertiary' : 'bg-primary'}`}
                          />
                          Remaining Principal
                        </span>
                        <span className="font-mono font-semibold text-on-surface">
                          {formatCurrency(
                            loan.remainingAmount,
                            false,
                            currentUser?.defaultCurrency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Parameters Details */}
                  <div className="rounded-xl border border-outline-variant/10 bg-surface-container/30 p-5">
                    <h3 className="mb-4 text-xs font-semibold text-on-surface">Loan Metrics</h3>
                    <div className="space-y-3.5 text-xs font-semibold text-on-surface-variant">
                      <div className="flex justify-between">
                        <span className="opacity-60">Initial Capital</span>
                        <span className="font-mono text-on-surface">
                          {formatCurrency(loan.totalAmount, false, currentUser?.defaultCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">Interest Scheme</span>
                        <span className="font-mono text-on-surface">
                          {loan.interestRate !== undefined
                            ? `${loan.interestRate}% p.a.`
                            : '0% (Interest-free)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">Start Date</span>
                        <span className="font-mono text-on-surface">
                          {formatDate(loan.startDate)}
                        </span>
                      </div>
                      {loan.dueDate && (
                        <div className="flex justify-between">
                          <span className="opacity-60">Maturity Date</span>
                          <span className="font-mono text-on-surface">
                            {formatDate(loan.dueDate)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="opacity-60">Current Status</span>
                        <span
                          className={`capitalize ${isClosed ? 'text-outline' : isDefaulted ? 'text-tertiary' : 'text-secondary'}`}
                        >
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoanDetailsModal;
