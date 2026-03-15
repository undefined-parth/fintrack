import { format } from 'date-fns'
import type { Account, Transaction, Loan } from '../types'

export const getNetWorth = (accounts: Account[]): number => {
  return accounts
    .filter(a => a.type !== 'credit')
    .reduce((sum, a) => sum + (a.balance ?? 0), 0)
}

export const getDashboardSummary = (
  userId: string,
  accounts: Account[],
  transactions: Transaction[],
  loans: Loan[]
) => {
  const netWorth = getNetWorth(accounts)
  
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)
  
  let currentMonthIncome = 0
  let currentMonthExpenses = 0
  
  transactions.forEach(t => {
    if (t.userId === userId) {
      const tDate = new Date(t.date)
      if (tDate >= currentMonthStart && t.type !== 'transfer' && t.type !== 'loan') {
        if (t.type === 'income') currentMonthIncome += t.amount
        else if (t.type === 'expense') currentMonthExpenses += t.amount
      }
    }
  })
  
  let activeLoanCount = 0
  let totalLoanGiven = 0
  let totalLoanTaken = 0
  
  loans.forEach(l => {
    if (l.userId === userId && l.status === 'active') {
      activeLoanCount++
      if (l.type === 'given') totalLoanGiven += l.remainingAmount
      else if (l.type === 'taken') totalLoanTaken += l.remainingAmount
    }
  })
  
  let totalLimit = 0
  let totalUsed = 0
  accounts.forEach(a => {
    if (a.userId === userId && a.type === 'credit') {
      totalLimit += (a.limit ?? 0)
      totalUsed += (a.used ?? 0)
    }
  })
  
  const creditUtilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
  
  return {
    netWorth,
    currentMonthIncome,
    currentMonthExpenses,
    activeLoanCount,
    totalLoanGiven,
    totalLoanTaken,
    creditUtilization
  }
}

export const getSpendingByCategory = (
  userId: string,
  transactions: Transaction[],
  from: string,
  to: string
): { categoryId: string, total: number }[] => {
  const fromDate = new Date(from).getTime()
  const toDate = new Date(to).getTime()
  
  const categoryTotals: Record<string, number> = {}
  
  transactions.forEach(t => {
    if (t.userId === userId && t.type === 'expense') {
      const tTime = new Date(t.date).getTime()
      if (tTime >= fromDate && tTime <= toDate) {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount
      }
    }
  })
  
  return Object.entries(categoryTotals).map(([categoryId, total]) => ({
    categoryId,
    total
  }))
}

export const getMonthlyTrend = (
  userId: string,
  transactions: Transaction[],
  months: number = 6
): { month: string, income: number, expense: number }[] => {
  const trend: Record<string, { income: number, expense: number }> = {}
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = format(d, 'MMM yyyy')
    trend[monthStr] = { income: 0, expense: 0 }
  }
  
  transactions.forEach(t => {
    if (t.userId === userId && (t.type === 'income' || t.type === 'expense')) {
      const monthStr = format(new Date(t.date), 'MMM yyyy')
      if (trend[monthStr]) {
        if (t.type === 'income') trend[monthStr].income += t.amount
        if (t.type === 'expense') trend[monthStr].expense += t.amount
      }
    }
  })
  
  return Object.entries(trend).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense
  }))
}

export const getAllTags = (userId: string, transactions: Transaction[]): string[] => {
  const allTags = transactions
    .filter(t => t.userId === userId)
    .flatMap(t => t.tags || [])
  
  return Array.from(new Set(allTags))
}
