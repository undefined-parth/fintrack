import DashboardAccountSnapshotCard from '@/components/DashboardAccountSnapshotCard';
import DashboardLoanSnapshotCard from '@/components/DashboardLoanSnapshotCard';
import StatsCard from '@/components/StatsCard';
import TransactionListItem from '@/components/TransactionListItem';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { SYSTEM_CATEGORIES } from '@/constants/categories';
import { useLoanStore } from '@/stores/useLoanStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatCurrency } from '@/utils/formatters';
import { getNetWorth } from '@/utils/selectors';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { ReceiptText } from 'lucide-react';

const Dashboard = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const rawTransactions = useTransactionStore((state) => state.transactions);
  const rawAccounts = useAccountStore((state) => state.accounts);
  const rawLoans = useLoanStore((state) => state.loans);
  // Subscribe to userCategories directly so category edits/additions re-render
  // (the getAllCategories getter is a stable fn reference and never triggers updates).
  const userCategories = useCategoryStore((state) => state.userCategories);

  const userId = currentUser?.id ?? '';

  const transactions = useMemo(() => {
    return rawTransactions
      .filter((t) => t.userId === userId)
      // ISO-8601 dates sort lexicographically — no per-comparison Date parsing
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [rawTransactions, userId]);

  const accounts = useMemo(() => {
    return rawAccounts.filter((a) => a.userId === userId);
  }, [rawAccounts, userId]);

  const activeLoans = useMemo(() => {
    return rawLoans.filter((l) => l.userId === userId && l.status === 'active');
  }, [rawLoans, userId]);

  const categories = useMemo(() => {
    return [...SYSTEM_CATEGORIES, ...userCategories.filter((c) => c.userId === userId)];
  }, [userCategories, userId]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const totalIncome = useMemo(() => {
    return transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const loanTaken = useMemo(() => {
    return activeLoans.filter((l) => l.type === 'taken').reduce((s, l) => s + l.remainingAmount, 0);
  }, [activeLoans]);

  const loanGiven = useMemo(() => {
    return activeLoans.filter((l) => l.type === 'given').reduce((s, l) => s + l.remainingAmount, 0);
  }, [activeLoans]);

  const netWorth = useMemo(() => getNetWorth(accounts), [accounts]);

  const statCards = useMemo(
    () => [
      {
        title: 'Total Income',
        value: totalIncome,
        accent: 'secondary' as const,
        badge: 'All time',
        badgeVariant: 'up' as const,
      },
      {
        title: 'Total Expense',
        value: totalExpense,
        accent: 'tertiary' as const,
        badge: 'This month',
        badgeVariant: 'down' as const,
      },
      {
        title: 'Loan Taken',
        value: loanTaken,
        accent: 'primary' as const,
        badge: 'Active',
        badgeVariant: 'neutral' as const,
      },
      {
        title: 'Loan Given',
        value: loanGiven,
        accent: 'warning' as const,
        badge: 'Active',
        badgeVariant: 'neutral' as const,
      },
    ],
    [totalIncome, totalExpense, loanTaken, loanGiven]
  );

  return (
    <div className="min-h-screen bg-surface px-6 pt-6 pb-10 md:px-8">
      {/* Page Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-on-surface">
            Dashboard
          </h1>
        </div>
        <p className="font-mono text-xs text-on-surface-variant">
          {format(new Date(), 'MMM yyyy').toUpperCase()}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            <h2 className="font-display text-sm font-semibold tracking-tight text-on-surface">
              Recent Transactions
            </h2>
            <Link
              to="/transactions"
              className="-mx-3 -my-2 inline-flex items-center gap-1 px-3 py-2 text-xs font-bold tracking-wider text-primary uppercase opacity-80 transition-opacity hover:opacity-100"
              aria-label="View all transactions"
            >
              View All <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container/30 px-6 py-10 text-center">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-on-surface">
                  No transactions logged
                </h3>
                <p className="mt-1 max-w-xs text-xs text-on-surface-variant">
                  Start tracking your personal cash flow by logging your first transaction.
                </p>
                <Link
                  to="/transactions"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-sm transition-all hover:scale-[1.02] hover:bg-primary-dim active:scale-[0.98]"
                >
                  + Add Transaction
                </Link>
              </div>
            )}
            {transactions.slice(0, 6).map((tx) => (
              <TransactionListItem
                key={tx.id}
                transaction={tx}
                category={categoryMap.get(tx.categoryId)}
                variant="compact"
              />
            ))}
          </div>
        </div>

        {/* Right col — 4 cols */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          {/* Net Worth Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-primary opacity-50" />
            <h3 className="mb-1 font-display text-xs font-semibold tracking-tight text-on-surface-variant">
              Net Worth
            </h3>
            <p className="font-mono text-3xl font-medium tracking-tight text-on-surface">
              {formatCurrency(netWorth, false, currentUser?.defaultCurrency)}
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant/80">Across all accounts</p>
          </div>

          {/* Account Snapshots */}
          <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container">
            <div className="border-b border-outline-variant/20 px-4 py-3">
              <h3 className="font-display text-xs font-semibold tracking-tight text-on-surface-variant">
                Accounts
              </h3>
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
          <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container">
            <div className="border-b border-outline-variant/20 px-4 py-3">
              <h3 className="font-display text-xs font-semibold tracking-tight text-on-surface-variant">
                Active Loans
              </h3>
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
