import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '../stores/useUserStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useAccountStore } from '../stores/useAccountStore';
import { SYSTEM_CATEGORIES } from '../constants/categories';
import AddTransactionModal from '../components/AddTransactionModal';
import StatsCard from '@/components/StatsCard';
import Select from '@/components/ui/Select';
import TransactionListItem from '@/components/TransactionListItem';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import type { Transaction } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Search, Plus, SlidersHorizontal, Info, ArrowUpDown, Calendar, Tag } from 'lucide-react';

// Rows rendered per page — keeps the DOM light and animations cheap for large histories.
const PAGE_SIZE = 50;

const Transactions = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const { transactions, deleteTransaction } = useTransactionStore(
    useShallow((state) => ({
      transactions: state.transactions,
      deleteTransaction: state.deleteTransaction,
    }))
  );
  const { userCategories } = useCategoryStore(
    useShallow((state) => ({
      userCategories: state.userCategories,
    }))
  );
  const accounts = useAccountStore((state) => state.accounts);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Defers the list-relevant query so typing stays snappy on large histories:
  // the input updates immediately, the heavy re-filter/re-render is scheduled after.
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<Transaction | null>(
    null
  );

  // Advanced Filter State
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [dateRange, setDateRange] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const userId = currentUser?.id || '';

  // NOTE: derive directly from `transactions` (subscribed above) instead of calling
  // store getters inside useMemo — the getter references are stable, so memoizing on
  // them previously returned STALE data after every add/edit/delete.
  const userTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, userId]);

  const categories = useMemo(() => {
    return [...SYSTEM_CATEGORIES, ...userCategories.filter((c) => c.userId === userId)];
  }, [userId, userCategories]);

  const { totalIncome, totalExpense, net } = useMemo(() => {
    let income = 0;
    let expense = 0;
    userTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, net: income - expense };
  }, [userTransactions]);

  // Map-based lookups: O(1) per row instead of categories.find/accounts.find per
  // transaction (previously O(n×m) across every render of the list).
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    userTransactions.forEach((tx) => tx.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [userTransactions]);

  const filteredTransactions = useMemo(() => {
    const searchLower = deferredSearchQuery.toLowerCase();
    const filtered = userTransactions.filter((tx) => {
      // 1. Basic Filters
      const matchesSearch =
        tx.title.toLowerCase().includes(searchLower) ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesAccount = accountFilter === 'all' || tx.accountId === accountFilter;
      const matchesCategory = categoryFilter === 'all' || tx.categoryId === categoryFilter;

      if (!(matchesSearch && matchesType && matchesAccount && matchesCategory)) return false;

      // 2. Amount Range
      if (minAmount !== '' && tx.amount < minAmount) return false;
      if (maxAmount !== '' && tx.amount > maxAmount) return false;

      // 3. Tags
      if (selectedTags.length > 0) {
        if (!selectedTags.every((tag) => tx.tags.includes(tag))) return false;
      }

      // 4. Date Range
      if (dateRange !== 'all') {
        const txDate = parseISO(tx.date);
        let start: Date, end: Date;

        if (dateRange === 'this_month') {
          start = startOfMonth(new Date());
          end = endOfMonth(new Date());
        } else if (dateRange === 'last_month') {
          const lastMonth = subMonths(new Date(), 1);
          start = startOfMonth(lastMonth);
          end = endOfMonth(lastMonth);
        } else if (dateRange === 'custom' && startDate && endDate) {
          start = startOfDay(parseISO(startDate));
          end = endOfDay(parseISO(endDate));
        } else {
          return true;
        }

        return isWithinInterval(txDate, { start, end });
      }

      return true;
    });

    // 5. Sorting — ISO-8601 dates sort lexicographically, no Date parsing needed
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
        case 'date_asc':
          return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'title_asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [
    userTransactions,
    deferredSearchQuery,
    typeFilter,
    accountFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    selectedTags,
    dateRange,
    startDate,
    endDate,
    sortBy,
  ]);

  // Progressive pagination — only render a window of the filtered list.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount]
  );
  // Reset pagination whenever the result set changes (filters/search/sort).
  // "Adjusting state during render" pattern — avoids an extra effect pass.
  const resultCountKey = `${deferredSearchQuery}|${typeFilter}|${accountFilter}|${categoryFilter}|${dateRange}|${startDate}|${endDate}|${minAmount}|${maxAmount}|${selectedTags.join(',')}|${sortBy}`;
  const [prevResultKey, setPrevResultKey] = useState(resultCountKey);
  if (prevResultKey !== resultCountKey) {
    setPrevResultKey(resultCountKey);
    setVisibleCount(PAGE_SIZE);
  }

  const handleEdit = useCallback(
    (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        setEditingTransaction(tx);
        setIsModalOpen(true);
      }
    },
    [transactions]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTransaction(id);
    },
    [deleteTransaction]
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        setSelectedDetailTransaction(tx);
      }
    },
    [transactions]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const statCards = [
    {
      title: 'Total Income',
      value: totalIncome,
      accent: 'secondary' as const,
    },
    {
      title: 'Total Expense',
      value: totalExpense,
      accent: 'tertiary' as const,
    },
    {
      title: 'Net Balance',
      value: net,
      accent: 'primary' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-12 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-on-surface">
              Transactions
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              Manage your income, expenses, and asset accounts
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-dim active:scale-[0.98] sm:w-auto"
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 font-mono md:grid-cols-3">
          {statCards.map((card) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              accent={card.accent}
              variant="compact"
            />
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="group relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-outline/50 transition-colors group-focus-within:text-primary/70" />
              <input
                type="text"
                placeholder="Search by tags, description, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container py-3.5 pr-4 pl-12 text-sm font-medium text-on-surface transition-all duration-200 placeholder:text-outline/50 focus:border-primary/40 focus:bg-surface-container focus:ring-4 focus:ring-primary/10 focus:outline-none"
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={accountFilter}
                onChange={setAccountFilter}
                className="w-40"
                options={[
                  { label: 'All Accounts', value: 'all' },
                  ...accounts.map((acc) => ({
                    label: acc.name,
                    value: acc.id,
                  })),
                ]}
              />

              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="w-40"
                options={[
                  { label: 'All Categories', value: 'all' },
                  ...categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  })),
                ]}
              />

              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-250 ${
                  isAdvancedOpen
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-outline-variant/15 bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>{isAdvancedOpen ? 'Hide Filters' : 'Advanced'}</span>
              </button>
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'income', 'expense', 'transfer', 'loan'].map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold capitalize transition-all duration-200 ${
                    active
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container/50 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters Panel (Animated Collapse/Expand) */}
          <AnimatePresence>
            {isAdvancedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-6 rounded-2xl border border-outline-variant/15 bg-surface-container/30 p-5">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Sort By */}
                    <div>
                      <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                        <ArrowUpDown size={11} /> Sort By
                      </label>
                      <Select
                        value={sortBy}
                        onChange={setSortBy}
                        className="w-full"
                        options={[
                          { label: 'Date (Newest)', value: 'date_desc' },
                          { label: 'Date (Oldest)', value: 'date_asc' },
                          { label: 'Amount (Highest)', value: 'amount_desc' },
                          { label: 'Amount (Lowest)', value: 'amount_asc' },
                          { label: 'Title (A-Z)', value: 'title_asc' },
                        ]}
                      />
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                        <Calendar size={11} /> Date Range
                      </label>
                      <Select
                        value={dateRange}
                        onChange={setDateRange}
                        className="w-full"
                        options={[
                          { label: 'All Time', value: 'all' },
                          { label: 'This Month', value: 'this_month' },
                          { label: 'Last Month', value: 'last_month' },
                          { label: 'Custom Range', value: 'custom' },
                        ]}
                      />
                    </div>

                    {/* Custom Dates */}
                    {dateRange === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-end gap-2"
                      >
                        <div className="flex-1">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-xl border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface focus:border-primary/40 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-xl border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface focus:border-primary/40 focus:outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Amount Range */}
                    <div>
                      <label className="mb-2 block text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                        Amount Range
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minAmount}
                          onChange={(e) =>
                            setMinAmount(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface placeholder:text-outline/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                        />
                        <span className="text-outline/35">—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxAmount}
                          onChange={(e) =>
                            setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface placeholder:text-outline/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags cloud */}
                  {availableTags.length > 0 && (
                    <div className="pt-2">
                      <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                        <Tag size={11} /> Filter by Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTags(selectedTags.filter((t) => t !== tag));
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                              className={`cursor-pointer rounded-full border px-3.5 py-1 text-[10px] font-bold transition-all duration-200 ${
                                isSelected
                                  ? 'border-primary/20 bg-primary/10 text-primary'
                                  : 'border-transparent bg-surface-container text-outline hover:bg-surface-container-high hover:text-on-surface'
                              }`}
                            >
                              #{tag}
                            </button>
                          );
                        })}
                        {selectedTags.length > 0 && (
                          <button
                            onClick={() => setSelectedTags([])}
                            className="ml-2 cursor-pointer text-[10px] font-bold text-tertiary hover:underline"
                          >
                            Clear Tags
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transactions List with Framer Motion transitions */}
        <div className="min-h-75 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface-container text-on-surface-variant">
                <Info size={20} className="animate-pulse text-outline" />
              </div>
              <p className="text-base font-bold text-on-surface">No transactions found</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Try adjusting your search query or filters
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {visibleTransactions.map((tx) => (
                <div key={tx.id} className="animate-fade-in">
                  <TransactionListItem
                    transaction={tx}
                    category={categoryMap.get(tx.categoryId)}
                    account={accountMap.get(tx.accountId)}
                    variant="default"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetail={handleViewDetail}
                  />
                </div>
              ))}
              {filteredTransactions.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="mx-auto mt-4 cursor-pointer rounded-xl border border-outline-variant/15 bg-surface-container px-6 py-2.5 text-xs font-semibold text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
                >
                  Load More ({filteredTransactions.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingTransaction={editingTransaction}
      />

      <TransactionDetailsModal
        isOpen={!!selectedDetailTransaction}
        onClose={() => setSelectedDetailTransaction(null)}
        transaction={selectedDetailTransaction}
        category={categoryMap.get(selectedDetailTransaction?.categoryId ?? '')}
        account={accountMap.get(selectedDetailTransaction?.accountId ?? '')}
        categories={categories}
        onSelectTransaction={setSelectedDetailTransaction}
      />
    </div>
  );
};

export default Transactions;
