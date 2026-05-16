import { getEffectiveLimit, getSpentForBudget } from '@/stores/useBudgetStore';
import type {
  Account,
  Budget,
  Category,
  CategoryDataItem,
  HealthStats,
  LifeEvent,
  Loan,
  RecurringTransaction,
  TagDataItem,
  Transaction,
  TrendDataItem,
} from '@/types';
import {
  differenceInDays,
  eachMonthOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  startOfDay,
  subMonths,
} from 'date-fns';
import { useMemo } from 'react';

interface UseReportsDataProps {
  userId: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  loans: Loan[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  timeRange: number;
  activeAccount: string;
}

const COLORS = ['#799dff', '#69f6b8', '#ff8887', '#ffc107', '#9c27b0', '#00bcd4'];

export const useReportsData = ({
  userId,
  transactions,
  accounts,
  categories,
  loans,
  budgets,
  timeRange,
  activeAccount,
}: UseReportsDataProps) => {
  // Indexed maps for O(1) lookups
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const dateRange = useMemo(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subMonths(end, timeRange));
    return { start, end };
  }, [timeRange]);

  // Pre-filter transactions and parse dates once
  const filteredTxs = useMemo(() => {
    const { start, end } = dateRange;
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      const isDateInRange = isWithinInterval(txDate, { start, end });
      const isAccountMatch = activeAccount === 'all' ? true : t.accountId === activeAccount;
      return isDateInRange && isAccountMatch;
    });
  }, [transactions, activeAccount, dateRange]);

  // Health Stats Calculations
  const healthStats = useMemo((): HealthStats => {
    const totalAssets = accounts
      .filter((a) => a.type !== 'credit')
      .reduce((s, a) => s + (a.balance || 0), 0);

    const totalLiabilities =
      accounts.filter((a) => a.type === 'credit').reduce((s, a) => s + (a.used || 0), 0) +
      loans.filter((l) => l.type === 'taken').reduce((s, l) => s + l.remainingAmount, 0);

    const netWorth = totalAssets - totalLiabilities;

    let income = 0;
    let expense = 0;
    filteredTxs.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });

    const netFlow = income - expense;
    const daysInPeriod = Math.max(1, differenceInDays(dateRange.end, dateRange.start));
    const burnRate = expense / daysInPeriod;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const activeBudgets = budgets.length;
    const exceededBudgets = budgets.filter((b) => {
      const spent = getSpentForBudget(b, userId, transactions);
      const limit = getEffectiveLimit(b);
      return spent > limit;
    }).length;

    const budgetEfficiency =
      activeBudgets > 0 ? ((activeBudgets - exceededBudgets) / activeBudgets) * 100 : 100;
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

    return {
      netWorth,
      income,
      expense,
      netFlow,
      burnRate,
      savingsRate,
      budgetEfficiency,
      debtRatio,
      totalAssets,
      totalLiabilities,
    };
  }, [accounts, loans, filteredTxs, dateRange, budgets, userId, transactions]);

  // Trend Data Calculation
  const trendData = useMemo((): TrendDataItem[] => {
    const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });

    // Group transactions by month for faster lookup
    const txByMonth = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      if (activeAccount !== 'all' && t.accountId !== activeAccount) return;
      const key = format(new Date(t.date), 'yyyy-MM');
      if (!txByMonth.has(key)) txByMonth.set(key, []);
      txByMonth.get(key)!.push(t);
    });

    return months.map((month) => {
      const key = format(month, 'yyyy-MM');
      const monthTxs = txByMonth.get(key) || [];

      let inc = 0;
      let exp = 0;
      monthTxs.forEach((t) => {
        if (t.type === 'income') inc += t.amount;
        else if (t.type === 'expense') exp += t.amount;
      });

      return {
        name: format(month, 'MMM').toUpperCase(),
        fullDate: key,
        income: inc,
        expense: exp,
        balance: inc - exp,
        netWorth: inc - exp,
      };
    });
  }, [transactions, activeAccount, dateRange]);

  // Category Breakdown
  const categoryData = useMemo((): CategoryDataItem[] => {
    const totals = new Map<string, { amount: number; id: string; color: string }>();

    filteredTxs.forEach((t) => {
      if (t.type !== 'expense') return;
      const cat = categoryMap.get(t.categoryId);
      const name = cat?.name || 'Uncategorized';

      const existing = totals.get(name);
      if (existing) {
        existing.amount += t.amount;
      } else {
        totals.set(name, {
          amount: t.amount,
          id: t.categoryId,
          color: COLORS[totals.size % COLORS.length],
        });
      }
    });

    return Array.from(totals.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, categoryMap]);

  // Tag Analytics
  const tagData = useMemo((): TagDataItem[] => {
    const totals = new Map<string, number>();
    filteredTxs.forEach((t) => {
      t.tags.forEach((tag) => {
        totals.set(tag, (totals.get(tag) || 0) + t.amount);
      });
    });
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs]);

  // Life Events Overlay
  const lifeEvents = useMemo((): LifeEvent[] => {
    const avgExpense = healthStats.expense / trendData.length || 0;
    const threshold = avgExpense * 0.5;

    return filteredTxs
      .filter((t) => t.amount > threshold)
      .map((t) => ({
        date: t.date,
        label: t.title,
        amount: t.amount,
        type: t.type,
      }))
      .slice(0, 10);
  }, [filteredTxs, healthStats.expense, trendData.length]);

  return {
    categoryMap,
    accountMap,
    dateRange,
    filteredTxs,
    healthStats,
    trendData,
    categoryData,
    tagData,
    lifeEvents,
  };
};
