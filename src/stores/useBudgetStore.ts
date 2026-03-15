import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, parseISO } from 'date-fns'
import type { Budget, Result, Transaction } from '../types'
import { useAuditStore } from './useAuditStore'

interface BudgetState {
  budgets: Budget[]
  addBudget: (payload: Partial<Budget>) => Result<Budget>
  updateBudget: (id: string, updates: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  getBudgetsForUser: (userId: string) => Budget[]
}

export const getEffectiveLimit = (budget: Budget): number => {
  return budget.amount + (budget.lastPeriodRollover || 0)
}

export const getPeriodDateRange = (budget: Budget): { from: Date, to: Date } => {
  const now = new Date()
  switch (budget.period) {
    case 'monthly':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'weekly':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'yearly':
      return { from: startOfYear(now), to: endOfYear(now) }
    case 'custom':
      return { from: parseISO(budget.startDate!), to: parseISO(budget.endDate!) }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

export const getSpentForBudget = (budget: Budget, userId: string, transactions: Transaction[]): number => {
  const { from, to } = getPeriodDateRange(budget)
  const fromTime = from.getTime()
  const toTime = to.getTime()
  
  let spent = 0
  transactions.forEach(t => {
    if (t.userId === userId && t.type === 'expense' && t.categoryId === budget.categoryId) {
      const tTime = new Date(t.date).getTime()
      if (tTime >= fromTime && tTime <= toTime) {
        spent += t.amount
      }
    }
  })
  return spent
}

export const getRemainingForBudget = (budget: Budget, userId: string, transactions: Transaction[]): number => {
  return getEffectiveLimit(budget) - getSpentForBudget(budget, userId, transactions)
}

export const getPercentSpent = (budget: Budget, userId: string, transactions: Transaction[]): number => {
  const eff = getEffectiveLimit(budget)
  if (eff <= 0) return 0
  const spent = getSpentForBudget(budget, userId, transactions)
  return Math.round((spent / eff) * 100)
}

export const isOverBudget = (budget: Budget, userId: string, transactions: Transaction[]): boolean => {
  return getSpentForBudget(budget, userId, transactions) > getEffectiveLimit(budget)
}

export const processBudgetRollover = (budget: Budget, userId: string, transactions: Transaction[]): number => {
  if (!budget.rollover) return 0
  const eff = getEffectiveLimit(budget)
  const spent = getSpentForBudget(budget, userId, transactions)
  return Math.max(0, eff - spent)
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      addBudget: (payload) => {
        if (!payload.amount || payload.amount <= 0) return { ok: false, error: 'Amount must be > 0' }
        if (!payload.categoryId) return { ok: false, error: 'Category is required' }
        if (payload.period === 'custom' && (!payload.startDate || !payload.endDate)) {
          return { ok: false, error: 'Custom period requires start and end dates' }
        }
        
        const newBudget: Budget = {
          id: uuid(),
          userId: payload.userId!,
          categoryId: payload.categoryId,
          amount: payload.amount,
          period: payload.period || 'monthly',
          startDate: payload.startDate,
          endDate: payload.endDate,
          rollover: payload.rollover || false,
          lastPeriodRollover: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        set(state => ({ budgets: [...state.budgets, newBudget] }))
        
        useAuditStore.getState().addEntry({
          action: 'create',
          entity: 'budget',
          entityId: newBudget.id,
          newValue: newBudget
        })
        
        return { ok: true, data: newBudget }
      },
      updateBudget: (id, updates) => {
        set(state => ({
          budgets: state.budgets.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b)
        }))
        useAuditStore.getState().addEntry({
          action: 'update',
          entity: 'budget',
          entityId: id,
          newValue: updates
        })
      },
      deleteBudget: (id) => {
        set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }))
        useAuditStore.getState().addEntry({
          action: 'delete',
          entity: 'budget',
          entityId: id,
          newValue: null
        })
      },
      getBudgetsForUser: (userId) => get().budgets.filter(b => b.userId === userId)
    }),
    { 
      name: 'fintrack-storage-budgets',
      partialize: (state) => ({ budgets: state.budgets })
    }
  )
)
