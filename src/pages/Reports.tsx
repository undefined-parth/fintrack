import { useState, useMemo } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useLoanStore } from '@/stores/useLoanStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { SYSTEM_CATEGORIES } from '@/constants/categories';
import {
  useBudgetStore,
  getBudgetStats,
  getEffectiveLimit,
} from '@/stores/useBudgetStore';
import { formatCurrency } from '@/utils/formatters';
import { format, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  HandCoins,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  Info,
} from 'lucide-react';

// ─── Constants & Color Helpers ──────────────────────────────────────────────

const getCategoryColor = (categoryId: string) => {
  const mapping: Record<string, string> = {
    sys_food: '#fb7185', // Coral/Rose
    sys_shopping: '#f43f5e', // Pink-Red
    sys_transport: '#60a5fa', // Soft Blue
    sys_entertainment: '#c084fc', // Purple
    sys_bills: '#f59e0b', // Amber
    sys_health: '#34d399', // Emerald
    sys_education: '#a78bfa', // Violet
    sys_loan_default: '#71717a', // Outline Zinc
  };
  if (mapping[categoryId]) return mapping[categoryId];

  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#fb7185',
    '#60a5fa',
    '#c084fc',
    '#f59e0b',
    '#34d399',
    '#a78bfa',
    '#ec4899',
    '#14b8a6',
    '#06b6d4',
  ];
  return colors[Math.abs(hash) % colors.length];
};

const Reports = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const rawTransactions = useTransactionStore((state) => state.transactions);
  const rawAccounts = useAccountStore((state) => state.accounts);
  const rawLoans = useLoanStore((state) => state.loans);
  const userCategories = useCategoryStore((state) => state.userCategories); // re-render on category changes
  const rawBudgets = useBudgetStore((state) => state.budgets);

  const userId = currentUser?.id ?? '';

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');

  // ─── Selectors & Filtered Slices ────────────────────────────────────────────
  const accounts = useMemo(
    () => rawAccounts.filter((a) => a.userId === userId),
    [rawAccounts, userId]
  );
  const loans = useMemo(() => rawLoans.filter((l) => l.userId === userId), [rawLoans, userId]);
  const categories = useMemo(
    () => [...SYSTEM_CATEGORIES, ...userCategories.filter((c) => c.userId === userId)],
    [userCategories, userId]
  );

  // O(1) category lookups for chart data + CSV export instead of find() per entry
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const budgets = useMemo(
    () => rawBudgets.filter((b) => b.userId === userId),
    [rawBudgets, userId]
  );

  const transactions = useMemo(() => {
    return rawTransactions.filter((t) => t.userId === userId);
  }, [rawTransactions, userId]);

  // Filtered transactions for the currently selected timeframe
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      const yearMatch = date.getFullYear() === selectedYear;
      const monthMatch = timeframe === 'yearly' || date.getMonth() === selectedMonth;
      const accountMatch = selectedAccountId === 'all' || t.accountId === selectedAccountId;
      return yearMatch && monthMatch && accountMatch;
    });
  }, [transactions, selectedYear, selectedMonth, selectedAccountId, timeframe]);

  // ─── Metrics Computations ──────────────────────────────────────────────────

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const savingsRate = useMemo(() => {
    if (totalIncome === 0) return 0;
    return Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100));
  }, [totalIncome, totalExpense]);

  const topSpendingCategory = useMemo(() => {
    const spendingMap: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        spendingMap[t.categoryId] = (spendingMap[t.categoryId] || 0) + t.amount;
      });

    let topId = '';
    let maxSpent = 0;
    Object.entries(spendingMap).forEach(([id, amt]) => {
      if (amt > maxSpent) {
        maxSpent = amt;
        topId = id;
      }
    });

    const categoryObj = categoryMap.get(topId);
    return categoryObj ? { name: categoryObj.name, amount: maxSpent } : null;
  }, [filteredTransactions, categoryMap]);

  const weeklyAverageSpend = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return 0;

    const sum = expenses.reduce((s, t) => s + t.amount, 0);
    // Approximate division based on timeframe
    const weeksCount = timeframe === 'yearly' ? 52 : 4.34;
    return sum / weeksCount;
  }, [filteredTransactions, timeframe]);

  // ─── Chart Data Preparations ───────────────────────────────────────────────

  // 1. Cash Flow (Income vs Expense by Month) — single pass over transactions
  // (previously re-filtered the full array once per month: O(12 × n))
  const cashFlowChartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date(selectedYear, 0, 1)),
      end: endOfYear(new Date(selectedYear, 11, 31)),
    });

    const buckets = months.map((m) => ({
      name: format(m, 'MMM'),
      Income: 0,
      Expense: 0,
      Net: 0,
    }));

    transactions.forEach((t) => {
      if (t.type !== 'income' && t.type !== 'expense') return;
      const d = new Date(t.date);
      if (d.getFullYear() !== selectedYear) return;
      if (selectedAccountId !== 'all' && t.accountId !== selectedAccountId) return;
      const bucket = buckets[d.getMonth()];
      if (!bucket) return;
      if (t.type === 'income') bucket.Income += t.amount;
      else bucket.Expense += t.amount;
    });

    return buckets.map((b) => ({ ...b, Net: b.Income - b.Expense }));
  }, [transactions, selectedYear, selectedAccountId]);

  // 2. Category Spending Breakdown (Donut Data)
  const categoryChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        groups[t.categoryId] = (groups[t.categoryId] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([id, amount]) => {
        const cat = categoryMap.get(id);
        return {
          id,
          name: cat?.name || 'Uncategorized',
          value: amount,
          color: getCategoryColor(id),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categoryMap]);

  // 3. Active Loan Liability Trends
  const activeLoansList = useMemo(() => {
    return loans.filter((l) => l.status === 'active');
  }, [loans]);

  // 4. Budget Threshold Limit Indicators — one scan per budget via getBudgetStats
  // (previously getSpentForBudget ran 3 separate full-array scans per budget)
  const budgetAlerts = useMemo(() => {
    return budgets
      .map((b) => {
        const { spent, percent, isOver } = getBudgetStats(b, userId, transactions);
        const limit = getEffectiveLimit(b);
        const catName = categoryMap.get(b.categoryId)?.name || 'Uncategorized';

        return {
          id: b.id,
          categoryName: catName,
          limit,
          spent,
          percent,
          isOver,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [budgets, userId, transactions, categoryMap]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const csvContent = [
      ['Date', 'Title', 'Type', 'Category', 'Account', 'Amount'].join(','),
      ...filteredTransactions.map((tx) => {
        const cat = categoryMap.get(tx.categoryId)?.name || 'Uncategorized';
        const acc = accountMap.get(tx.accountId)?.name || 'Unknown';
        return [
          format(new Date(tx.date), 'yyyy-MM-dd'),
          `"${tx.title.replace(/"/g, '""')}"`,
          tx.type,
          `"${cat}"`,
          `"${acc}"`,
          tx.amount,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FinTrack_Analytics_${selectedYear}_${timeframe}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom tooltips styling matching Obsidian Theme
  const renderCustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{
      payload?: unknown;
      value?: unknown;
      name?: unknown;
      color?: string;
      fill?: string;
    }>;
  }) => {
    const point = payload?.[0]?.payload;
    if (
      active &&
      point &&
      typeof point === 'object' &&
      'name' in point &&
      typeof point.name === 'string'
    ) {
      return (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-3 shadow-xl backdrop-blur-md">
          <p className="mb-1 text-xs font-semibold text-on-surface-variant">{point.name}</p>
          {payload.map((item) => (
            <p
              key={String(item.name)}
              className="font-mono text-xs font-medium"
              style={{ color: item.color || item.fill }}
            >
              {String(item.name)}:{' '}
              {typeof item.value === 'number'
                ? formatCurrency(item.value, false, currentUser?.defaultCurrency)
                : '-'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface px-6 pt-6 pb-12 md:px-8">
      {/* ─── Page Header & Filters ────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">
            Analytics
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            Aggregate reports and cash flow visualization
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe selector toggle */}
          <div className="flex rounded-xl border border-outline-variant/15 bg-surface-container p-0.5">
            <button
              onClick={() => setTimeframe('monthly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                timeframe === 'monthly'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                timeframe === 'yearly'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Month selector (hidden if yearly) */}
          {timeframe === 'monthly' && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-32 appearance-none rounded-xl border border-outline-variant/15 bg-surface-container py-2 pr-10 pl-4 text-xs font-semibold text-on-surface focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(selectedYear, i, 1), 'MMMM')}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
            </div>
          )}

          {/* Year selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-24 appearance-none rounded-xl border border-outline-variant/15 bg-surface-container py-2 pr-10 pl-4 text-xs font-semibold text-on-surface focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const yr = new Date().getFullYear() - i;
                return (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
          </div>

          {/* Account filter */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-36 appearance-none rounded-xl border border-outline-variant/15 bg-surface-container py-2 pr-10 pl-4 text-xs font-semibold text-on-surface focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
          </div>

          {/* Export Action */}
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface transition-all hover:bg-surface-container-high focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            title="Export transactions list to CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ─── Key Insight Cards ───────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Net Flow */}
        <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-all duration-200 hover:border-outline-variant/30">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-primary opacity-50" />
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
            Net Cash Flow
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl font-semibold tracking-tight text-on-surface">
              {formatCurrency(totalIncome - totalExpense, false, currentUser?.defaultCurrency)}
            </p>
            <span
              className={`inline-flex items-center text-[10px] font-bold ${
                totalIncome >= totalExpense ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {totalIncome >= totalExpense ? (
                <TrendingUp className="mr-0.5 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-0.5 h-3 w-3" />
              )}
              {totalIncome >= totalExpense ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-all duration-200 hover:border-outline-variant/30">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-secondary opacity-50" />
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
            Savings Rate
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl font-semibold tracking-tight text-on-surface">
              {savingsRate}%
            </p>
            <Percent className="h-3.5 w-3.5 text-secondary" />
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-all duration-200 hover:border-outline-variant/30">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-tertiary opacity-50" />
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
            Top Category
          </p>
          {topSpendingCategory ? (
            <div className="flex items-baseline gap-2">
              <p className="truncate text-base font-semibold text-on-surface">
                {topSpendingCategory.name}
              </p>
              <span className="font-mono text-xs text-tertiary">
                ({formatCurrency(topSpendingCategory.amount, false, currentUser?.defaultCurrency)})
              </span>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant">No expenses logged</p>
          )}
        </div>

        {/* Weekly Avg */}
        <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-all duration-200 hover:border-outline-variant/30">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-warning opacity-50" />
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
            Weekly Avg Spend
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl font-semibold tracking-tight text-on-surface">
              {formatCurrency(weeklyAverageSpend, false, currentUser?.defaultCurrency)}
            </p>
            <span className="text-[10px] text-outline">Approximate</span>
          </div>
        </div>
      </div>

      {/* ─── Main Visual Analytics Split ────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (Charts) */}
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
          {/* Cash Flow Chart */}
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container p-5">
            <div className="mb-6">
              <h2 className="font-display text-sm font-semibold tracking-tight text-on-surface">
                Cash Flow Overview ({selectedYear})
              </h2>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlowChartData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(63, 63, 70, 0.15)" />
                  <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <RechartsTooltip
                    content={renderCustomTooltip}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingBottom: 15 }}
                  />
                  <Bar dataKey="Income" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Expense" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Line
                    type="monotone"
                    dataKey="Net"
                    name="Net Cash Flow"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: '#a78bfa', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Loans Trajectory */}
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container p-5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-semibold tracking-tight text-on-surface">
                  Loan Liability Trajectories
                </h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Track active liabilities payoff progress
                </p>
              </div>
              <HandCoins className="h-5 w-5 text-primary" />
            </div>

            {activeLoansList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface/30 py-8 text-center">
                <Info className="mb-2 h-5 w-5 text-outline" />
                <p className="text-xs text-on-surface-variant">
                  No active loan liabilities detected
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeLoansList.map((loan) => {
                  const paid = loan.totalAmount - loan.remainingAmount;
                  const progressPct = Math.round((paid / loan.totalAmount) * 100);
                  const isGiven = loan.type === 'given';

                  return (
                    <div
                      key={loan.id}
                      className="rounded-xl border border-outline-variant/10 bg-surface/40 p-4 transition-all duration-200 hover:border-outline-variant/25"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-on-surface">{loan.personName}</p>
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                              isGiven
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-tertiary/15 text-tertiary'
                            }`}
                          >
                            {isGiven ? 'Given (Receivable)' : 'Taken (Payable)'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs font-semibold text-on-surface">
                            {formatCurrency(
                              loan.remainingAmount,
                              false,
                              currentUser?.defaultCurrency
                            )}
                          </p>
                          <p className="text-[10px] text-outline">
                            of{' '}
                            {formatCurrency(loan.totalAmount, false, currentUser?.defaultCurrency)}
                          </p>
                        </div>
                      </div>

                      {/* Paydown progress bar */}
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span className="text-outline">Payoff Progress</span>
                          <span className="font-semibold text-on-surface">{progressPct}%</span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                              isGiven ? 'bg-secondary' : 'bg-tertiary'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Breakdown & Budgets) */}
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          {/* Category Breakdown (Donut Chart) */}
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container p-5">
            <div className="mb-4">
              <h2 className="font-display text-sm font-semibold tracking-tight text-on-surface">
                Category Spending
              </h2>
            </div>

            {categoryChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface/30 py-12 text-center">
                <Info className="mb-2 h-5 w-5 text-outline" />
                <p className="text-xs text-on-surface-variant">No expense records found</p>
              </div>
            ) : (
              <div>
                {/* Donut chart container */}
                <div className="relative flex h-44 w-full justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={renderCustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Absolute Net Total */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-[10px] tracking-wider text-outline uppercase">Total spent</p>
                    <p className="font-mono text-sm font-bold text-on-surface">
                      {formatCurrency(totalExpense, true, currentUser?.defaultCurrency)}
                    </p>
                  </div>
                </div>

                {/* Categories Legend List */}
                <div className="custom-scrollbar mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {categoryChartData.map((item) => {
                    const percent =
                      totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="max-w-30 truncate font-semibold text-on-surface">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-outline">{percent}%</span>
                          <span className="font-mono font-medium text-on-surface">
                            {formatCurrency(item.value, false, currentUser?.defaultCurrency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Budget Limits alerts */}
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold tracking-tight text-on-surface">
                Budget Alerts
              </h2>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>

            {budgetAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface/30 py-8 text-center">
                <Info className="mb-2 h-5 w-5 text-outline" />
                <p className="text-xs text-on-surface-variant">No budgets configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetAlerts.map((alert) => {
                  const isWarning = alert.percent >= 80 && alert.percent < 100;
                  const isDanger = alert.percent >= 100;

                  return (
                    <div key={alert.id} className="text-xs">
                      <div className="mb-1 flex justify-between font-semibold text-on-surface">
                        <span className="max-w-37.5 truncate">{alert.categoryName}</span>
                        <span
                          className={`font-mono ${
                            isDanger ? 'text-tertiary' : isWarning ? 'text-warning' : 'text-outline'
                          }`}
                        >
                          {formatCurrency(alert.spent, false, currentUser?.defaultCurrency)} /{' '}
                          {formatCurrency(alert.limit, false, currentUser?.defaultCurrency)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                            isDanger ? 'bg-tertiary' : isWarning ? 'bg-warning' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, alert.percent)}%` }}
                        />
                      </div>

                      {/* Alert details */}
                      {(isWarning || isDanger) && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
                          <AlertTriangle
                            className={`h-3 w-3 shrink-0 ${isDanger ? 'text-tertiary' : 'text-warning'}`}
                          />
                          <span className={isDanger ? 'text-tertiary' : 'text-warning'}>
                            {isDanger ? 'Exceeded limit' : 'Nearing limit (>=80%)'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
