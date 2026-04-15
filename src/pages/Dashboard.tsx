import DashboardAccountSnapshotCard from '@/components/DashboardAccountSnapshotCard';
import DashboardLoanSnapshotCard from '@/components/DashboardLoanSnapshotCard';
import StatsCard from '@/components/StatsCard';
import TransactionListItem from '@/components/TransactionListItem';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useLoanStore } from '@/stores/useLoanStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatCurrency } from '@/utils/formatters';
import type { Loan, Transaction } from '@/types';
import { Link } from 'react-router';
import { format } from 'date-fns';

const Dashboard = () => {
  const { currentUser } = useUserStore();
  const { getTransactionsForUser } = useTransactionStore();
  const { getAccountsForUser } = useAccountStore();
  const { getActiveLoans } = useLoanStore();
  const { getAllCategories } = useCategoryStore();

  const userId = currentUser?.id ?? '';
  const transactions = getTransactionsForUser(userId);
  const accounts = getAccountsForUser(userId);
  const activeLoans = getActiveLoans(userId);
  const categories = getAllCategories(userId);

  const getTotalIncome = (txs: Transaction[]) =>
    txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const getTotalExpense = (txs: Transaction[]) =>
    txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const getLoanTaken = (loans: Loan[]) =>
    loans.filter((l) => l.type === 'taken').reduce((s, l) => s + l.remainingAmount, 0);

  const getLoanGiven = (loans: Loan[]) =>
    loans.filter((l) => l.type === 'given').reduce((s, l) => s + l.remainingAmount, 0);

  const netWorth = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);

  const statCards = [
    {
      title: 'Total Income',
      value: getTotalIncome(transactions),
      accent: 'secondary' as const,
      badge: '▲ All time',
      badgeVariant: 'up' as const,
    },
    {
      title: 'Total Expense',
      value: getTotalExpense(transactions),
      accent: 'tertiary' as const,
      badge: '▼ This month',
      badgeVariant: 'down' as const,
    },
    {
      title: 'Loan Taken',
      value: getLoanTaken(activeLoans),
      accent: 'primary' as const,
      badge: '● Active',
      badgeVariant: 'neutral' as const,
    },
    {
      title: 'Loan Given',
      value: getLoanGiven(activeLoans),
      accent: 'warning' as const,
      badge: '● Active',
      badgeVariant: 'neutral' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background px-8 pt-7 pb-10">
      {/* Page Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
            Overview
          </p>
          <h1 className="text-[22px] font-bold tracking-tight text-on-background">Dashboard</h1>
        </div>
        <p className="font-mono text-xs text-outline">
          {format(new Date(), 'MMM yyyy').toUpperCase()}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            accent={card.accent}
            badge={card.badge}
            badgeVariant={card.badgeVariant}
            currency={currentUser?.defaultCurrency}
          />
        ))}
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-12 gap-4">
        {/* Transactions — 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase">
              Recent Transactions
            </p>
            <Link
              to="/transactions"
              className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-80 hover:opacity-100"
            >
              View All →
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {transactions.length === 0 && (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                No transactions yet.
              </p>
            )}
            {transactions.slice(0, 6).map((tx) => (
              <TransactionListItem
                key={tx.id}
                transaction={tx}
                category={categories.find((c) => c.id === tx.categoryId)}
                variant="compact"
              />
            ))}
          </div>
        </div>

        {/* Right col — 4 cols */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          {/* Net Worth Banner */}
          <div className="relative overflow-hidden rounded-[14px] border border-outline-variant/30 bg-surface-container p-5">
            <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-outline uppercase">
              Net Worth
            </p>
            <p className="font-mono text-3xl font-medium tracking-tight text-on-surface">
              {formatCurrency(netWorth, false, currentUser?.defaultCurrency)}
            </p>
            <p className="mt-1 text-[11px] text-outline">Across all accounts</p>
            <span
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[52px] font-bold tracking-[-0.04em] text-primary/4"
              aria-hidden
            >
              NET
            </span>
          </div>

          {/* Account Snapshots */}
          <div className="overflow-hidden rounded-[14px] border border-outline-variant/30 bg-surface-container">
            <div className="border-b border-outline-variant/20 px-4 py-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase">
                Accounts
              </p>
            </div>
            {accounts.length === 0 && (
              <p className="px-4 py-3 text-xs text-on-surface-variant">No accounts.</p>
            )}
            {accounts.map((a) => (
              <DashboardAccountSnapshotCard
                key={a.id}
                a={a}
                currency={currentUser?.defaultCurrency}
              />
            ))}
          </div>

          {/* Loan Snapshots */}
          <div className="overflow-hidden rounded-[14px] border border-outline-variant/30 bg-surface-container">
            <div className="border-b border-outline-variant/20 px-4 py-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase">
                Active Loans
              </p>
            </div>
            {activeLoans.length === 0 && (
              <p className="px-4 py-3 text-xs text-on-surface-variant">No active loans.</p>
            )}
            {activeLoans.map((l) => (
              <DashboardLoanSnapshotCard key={l.id} l={l} currency={currentUser?.defaultCurrency} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
