import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isEqual } from 'date-fns'
import type { RecurringTransaction, Result, RecurringFrequency, Transaction } from '../types'
import { useTransactionStore } from './useTransactionStore'
import { useAuditStore } from './useAuditStore'

interface RecurringState {
  recurringTransactions: RecurringTransaction[]
  addRecurring: (payload: Partial<RecurringTransaction>) => Result<RecurringTransaction>
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void
  deleteRecurring: (id: string) => void
  getRecurringForUser: (userId: string) => RecurringTransaction[]
  processDueRecurring: (userId: string) => { created: number, errors: string[] }
}

export const getNextDueDate = (currentDueDate: string, frequency: RecurringFrequency): string => {
  const date = new Date(currentDueDate)
  let nextDate: Date
  switch (frequency) {
    case 'daily': nextDate = addDays(date, 1); break;
    case 'weekly': nextDate = addWeeks(date, 1); break;
    case 'monthly': nextDate = addMonths(date, 1); break;
    case 'yearly': nextDate = addYears(date, 1); break;
    default: nextDate = addMonths(date, 1); break;
  }
  return nextDate.toISOString()
}

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      recurringTransactions: [],
      addRecurring: (payload) => {
        const newRec: RecurringTransaction = {
          id: uuid(),
          userId: payload.userId!,
          title: payload.title!,
          description: payload.description,
          amount: payload.amount!,
          type: payload.type!,
          categoryId: payload.categoryId!,
          accountId: payload.accountId!,
          toAccountId: payload.toAccountId,
          loanId: payload.loanId,
          tags: payload.tags || [],
          frequency: payload.frequency || 'monthly',
          nextDueDate: payload.nextDueDate!,
          endDate: payload.endDate,
          isActive: payload.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        set(state => ({ recurringTransactions: [...state.recurringTransactions, newRec] }))
        useAuditStore.getState().addEntry({ action: 'create', entity: 'transaction', entityId: newRec.id, newValue: newRec })
        return { ok: true, data: newRec }
      },
      updateRecurring: (id, updates) => {
        set(state => ({
          recurringTransactions: state.recurringTransactions.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
        }))
      },
      deleteRecurring: (id) => {
        set(state => ({ recurringTransactions: state.recurringTransactions.filter(r => r.id !== id) }))
      },
      getRecurringForUser: (userId) => get().recurringTransactions.filter(r => r.userId === userId),
      processDueRecurring: (userId) => {
        const state = get()
        const recurring = state.recurringTransactions.filter(r => r.userId === userId && r.isActive)
        const today = new Date()
        
        let created = 0
        const errors: string[] = []
        
        recurring.forEach(rec => {
          let currentDue = new Date(rec.nextDueDate)
          let processedStr = rec.nextDueDate
          
          while (isBefore(currentDue, today) || isEqual(currentDue, today)) {
             const txPayload: Partial<Transaction> = {
               userId: rec.userId,
               date: currentDue.toISOString(),
               title: rec.title,
               description: rec.description,
               amount: rec.amount,
               type: rec.type,
               categoryId: rec.categoryId,
               accountId: rec.accountId,
               toAccountId: rec.toAccountId,
               loanId: rec.loanId,
               tags: rec.tags,
             }
             
             const txResult = useTransactionStore.getState().addTransaction(txPayload)
             
             if (txResult.ok) {
               created++
               processedStr = getNextDueDate(processedStr, rec.frequency)
               currentDue = new Date(processedStr)
             } else {
               errors.push(`Failed to process ${rec.title}: ${txResult.error}`)
               break
             }
          }
          
          if (processedStr !== rec.nextDueDate) {
            let isActive = rec.isActive
            if (rec.endDate && isAfter(new Date(processedStr), new Date(rec.endDate))) {
              isActive = false
            }
            state.updateRecurring(rec.id, { nextDueDate: processedStr, isActive })
          }
        })
        
        return { created, errors }
      }
    }),
    { 
      name: 'fintrack-storage-recurring',
      partialize: (state) => ({ recurringTransactions: state.recurringTransactions })
    }
  )
)
