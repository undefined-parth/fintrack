import { useState, useMemo, useCallback } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useAccountStore } from '../stores/useAccountStore';
import AddTransactionModal from '../components/AddTransactionModal';
import StatsCard from '@/components/StatsCard';
import Select from '@/components/ui/Select';
import IconPlus from '../assets/icons/IconPlus';
import TransactionListItem from '@/components/TransactionListItem';
import type { Transaction } from '../types';
import {
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';

const Transactions = () => {
  const { currentUser } = useUserStore();
  const { getTransactionsForUser, getSummary, deleteTransaction, transactions } =
    useTransactionStore();
  const { userCategories, getAllCategories } = useCategoryStore();
  const { accounts } = useAccountStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  const userTransactions = useMemo(() => {
    return getTransactionsForUser(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, getTransactionsForUser, transactions]);

  const categories = useMemo(() => {
    return getAllCategories(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, getAllCategories, userCategories]);

  const { totalIncome, totalExpense, net } = useMemo(() => {
    return getSummary(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, getSummary, transactions]);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    userTransactions.forEach((tx) => tx.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [userTransactions]);

  const filteredTransactions = useMemo(() => {
    const filtered = userTransactions.filter((tx) => {
      // 1. Basic Filters
      const matchesSearch =
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

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

    // 5. Sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
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
    searchQuery,
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
      if (confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(id);
      }
    },
    [deleteTransaction]
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
    <div className="min-h-screen bg-surface px-8 pt-7 pb-10 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
              Manage your income and expenses
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-on-background">
              Transactions
            </h1>
          </div>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold outline transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary hover:shadow-[0_1px_20px_-6px_rgba(121,157,255,0.6)] active:scale-95 sm:w-auto"
          >
            <IconPlus /> Add Transaction
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="group relative flex-1">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 opacity-40">🔍</span>

              <input
                type="text"
                placeholder="Search by tags, description, title, etc...."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-transparent bg-surface-container-low/80 py-3.5 pr-4 pl-12 text-sm font-medium text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:bg-surface-container focus:ring-4 focus:ring-primary/10 focus:outline-none"
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Account Select */}
              <Select
                value={accountFilter}
                onChange={setAccountFilter}
                options={[
                  { label: 'All Accounts', value: 'all' },
                  ...accounts.map((acc) => ({
                    label: acc.name,
                    value: acc.id,
                  })),
                ]}
              />

              {/* Category Select */}
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
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
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  isAdvancedOpen
                    ? 'border-primary/30 bg-primary text-on-primary shadow-md'
                    : 'border-transparent bg-surface-container-low text-outline shadow-sm hover:bg-surface-variant/60 hover:text-on-surface'
                }`}
              >
                {isAdvancedOpen ? 'Close Filters' : 'Advanced Filters'}
              </button>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'income', 'expense', 'transfer', 'loan'].map((t) => {
                const active = typeFilter === t;

                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
                      active
                        ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                        : 'bg-surface-container-low text-outline hover:bg-surface-variant/60 hover:text-on-surface'
                    } `}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {isAdvancedOpen && (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-6 duration-300">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Sort By */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-widest text-outline uppercase">
                    Sort By
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
                  <label className="mb-2 block text-[10px] font-bold tracking-widest text-outline uppercase">
                    Date Range
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

                {/* Custom Dates (if custom range selected) */}
                {dateRange === 'custom' && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-transparent bg-surface-container px-3 py-2 text-xs font-medium text-on-surface focus:border-primary/40 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-transparent bg-surface-container px-3 py-2 text-xs font-medium text-on-surface focus:border-primary/40 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Amount Range */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-widest text-outline uppercase">
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
                      className="w-full rounded-xl border border-transparent bg-surface-container px-3 py-2 text-xs font-medium text-on-surface placeholder:text-outline/40 focus:border-primary/40 focus:outline-none"
                    />
                    <span className="text-outline/40">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) =>
                        setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-transparent bg-surface-container px-3 py-2 text-xs font-medium text-on-surface placeholder:text-outline/40 focus:border-primary/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tags cloud */}
              {availableTags.length > 0 && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-widest text-outline uppercase">
                    Filter by Tags
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
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                            isSelected
                              ? 'border-primary/20 bg-primary text-on-primary'
                              : 'border-transparent bg-surface-container text-outline hover:bg-surface-variant/60'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className="ml-2 text-[10px] font-bold text-error/60 underline underline-offset-4 hover:text-error"
                      >
                        Clear Tags
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="flex flex-col gap-1.5 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-32 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container text-4xl opacity-20">
                📑
              </div>
              <p className="text-xl font-bold text-on-surface">No transactions found</p>
              <p className="mt-1 text-sm text-outline">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                const account = accounts.find((a) => a.id === tx.accountId);

                return (
                  <TransactionListItem
                    key={tx.id}
                    transaction={tx}
                    category={category}
                    account={account}
                    variant="default"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;
