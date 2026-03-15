import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Result, Transaction } from '../types'
import { useAccountStore } from './useAccountStore'
import { useLoanStore } from './useLoanStore'
import { useAuditStore } from './useAuditStore'

interface TransactionState {
  transactions: Transaction[]
  addTransaction: (payload: Partial<Transaction>) => Result<Transaction>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Result
  deleteTransaction: (id: string) => Result
  getTransactionsForUser: (userId: string) => Transaction[]
  getSummary: (userId: string) => { totalIncome: number; totalExpense: number; net: number }
  getByCategory: (userId: string, categoryId: string) => Transaction[]
  getByTag: (userId: string, tag: string) => Transaction[]
  getByDateRange: (userId: string, from: string, to: string) => Transaction[]
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => {
      // Helper function to apply the financial impact of a transaction
      const applyTransactionImpact = (tx: Transaction): Result => {
        const accounts = useAccountStore.getState().accounts
        const account = accounts.find((a) => a.id === tx.accountId)
        if (!account) return { ok: false, error: 'Account not found for transaction impact' }

        const updateBalance = useAccountStore.getState()._updateBalance
        const updateUsed = useAccountStore.getState()._updateUsed
        const amount = tx.amount

        if (tx.type === 'income') {
          if (account.type === 'credit') {
            return { ok: false, error: 'Cannot accept income directly into a credit card' }
          } else {
            updateBalance(account.id, amount)
          }
        } else if (tx.type === 'expense') {
          if (account.type === 'credit') {
            if ((account.used ?? 0) + amount > (account.limit ?? 0))
              return { ok: false, error: 'Credit limit exceeded' }
            updateUsed(account.id, amount)
          } else {
            if ((account.balance ?? 0) < amount) return { ok: false, error: 'Insufficient balance' }
            updateBalance(account.id, -amount)
          }
        } else if (tx.type === 'transfer') {
          const toAccount = accounts.find((a) => a.id === tx.toAccountId)
          if (!toAccount)
            return { ok: false, error: 'Destination account not found for transfer impact' }
          // Source
          if (account.type === 'credit') {
            updateUsed(account.id, -amount)
          } else {
            if ((account.balance ?? 0) < amount) return { ok: false, error: 'Insufficient balance' }
            updateBalance(account.id, -amount)
          }
          // Dest
          if (toAccount.type === 'credit') {
            updateUsed(toAccount.id, amount)
          } else {
            updateBalance(toAccount.id, amount)
          }
        } else if (tx.type === 'loan') {
          if (tx.loanType === 'given') {
            if (account.type === 'credit') return { ok: false, error: 'Cannot give a loan from a credit card' }
            if ((account.balance ?? 0) < amount) return { ok: false, error: 'Insufficient balance' }
            updateBalance(account.id, -amount)
          } else if (tx.loanType === 'taken') {
            updateBalance(account.id, amount)
          } else if (tx.loanType === 'settlement') {
            if (account.type === 'credit') return { ok: false, error: 'Cannot accept loan settlements into a credit card' }
            if (!tx.loanId) return { ok: false, error: 'Loan ID required for settlement impact' }
            const loanStore = useLoanStore.getState()
            const loan = loanStore.loans.find((l) => l.id === tx.loanId)
            if (!loan) return { ok: false, error: 'Loan not found for settlement impact' }
            if (amount > loan.remainingAmount)
              return { ok: false, error: 'Amount exceeds remaining loan balance' }

            if (loan.type === 'given') {
              updateBalance(account.id, amount)
            } else if (loan.type === 'taken') {
              if ((account.balance ?? 0) < amount)
                return { ok: false, error: 'Insufficient balance' }
              updateBalance(account.id, -amount)
            }

            const newRemaining = loan.remainingAmount - amount
            loanStore.updateLoan(loan.id, {
              remainingAmount: newRemaining,
              status: newRemaining <= 0 ? 'closed' : 'active',
            })
          }
        }

        return { ok: true }
      }

      // Helper function to revert the financial impact of a transaction
      const revertTransactionImpact = (tx: Transaction): Result => {
        const accounts = useAccountStore.getState().accounts
        const account = accounts.find((a) => a.id === tx.accountId)
        if (!account) return { ok: false, error: 'Account not found' }

        const updateBalance = useAccountStore.getState()._updateBalance
        const updateUsed = useAccountStore.getState()._updateUsed
        const amount = tx.amount

        if (tx.type === 'income') {
          if (account.type === 'credit') updateUsed(account.id, amount)
          else updateBalance(account.id, -amount)
        } else if (tx.type === 'expense') {
          if (account.type === 'credit') updateUsed(account.id, -amount)
          else updateBalance(account.id, amount)
        } else if (tx.type === 'transfer') {
          const toAccount = accounts.find((a) => a.id === tx.toAccountId)
          if (toAccount) {
            if (account.type === 'credit') updateUsed(account.id, amount)
            else updateBalance(account.id, amount)

            if (toAccount.type === 'credit') updateUsed(toAccount.id, -amount)
            else updateBalance(toAccount.id, -amount)
          }
        } else if (tx.type === 'loan') {
          if (tx.loanType === 'given') updateBalance(account.id, amount)
          else if (tx.loanType === 'taken') updateBalance(account.id, -amount)
          else if (tx.loanType === 'settlement') {
            const loanStore = useLoanStore.getState()
            const loan = loanStore.loans.find((l) => l.id === tx.loanId)
            if (loan) {
              if (loan.type === 'given') updateBalance(account.id, -amount)
              else if (loan.type === 'taken') updateBalance(account.id, amount)

              loanStore.updateLoan(loan.id, {
                remainingAmount: loan.remainingAmount + amount,
                status: 'active', // reopen
              })
            }
          }
        }
        return { ok: true }
      }

      return {
        transactions: [],
        addTransaction: (payload): Result<Transaction> => {
          if (!payload.amount || payload.amount <= 0)
            return { ok: false, error: 'Amount must be > 0' }
          if (!payload.title?.trim()) return { ok: false, error: 'Title is required' }
          if (!payload.accountId) return { ok: false, error: 'Account is required' }
          if (
            payload.type === 'transfer' &&
            (!payload.toAccountId || payload.toAccountId === payload.accountId)
          ) {
            return { ok: false, error: 'Valid destination account required' }
          }

          const accounts = useAccountStore.getState().accounts
          const account = accounts.find((a) => a.id === payload.accountId)
          if (!account) return { ok: false, error: 'Account not found' }

          const tx: Transaction = {
            id: uuid(),
            userId: payload.userId!,
            date: payload.date || new Date().toISOString(),
            title: payload.title.trim(),
            description: payload.description,
            amount: payload.amount,
            type: payload.type!,
            categoryId: payload.categoryId!,
            loanType: payload.loanType,
            accountId: payload.accountId,
            toAccountId: payload.toAccountId,
            loanId: payload.loanId,
            tags: payload.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          const impactResult = applyTransactionImpact(tx)
          if (!impactResult.ok) return impactResult as unknown as Result<Transaction>

          set((state) => ({ transactions: [tx, ...state.transactions] }))
          useAuditStore
            .getState()
            .addEntry({ action: 'create', entity: 'transaction', entityId: tx.id, newValue: tx })

          return { ok: true, data: tx }
        },
        updateTransaction: (id, updates) => {
          const state = get()
          const oldTx = state.transactions.find((t) => t.id === id)
          if (!oldTx) return { ok: false, error: 'Transaction not found' }

          const revertResult = revertTransactionImpact(oldTx)
          if (!revertResult.ok) return revertResult

          const updatedTx: Transaction = {
            ...oldTx,
            ...updates,
            id: oldTx.id,
            updatedAt: new Date().toISOString(),
          }

          const applyResult = applyTransactionImpact(updatedTx)
          if (!applyResult.ok) {
            applyTransactionImpact(oldTx)
            return applyResult
          }

          set((s) => ({
            transactions: s.transactions.map((t) => (t.id === id ? updatedTx : t)),
          }))

          useAuditStore.getState().addEntry({
            action: 'update',
            entity: 'transaction',
            entityId: id,
            newValue: updates,
          })

          return { ok: true }
        },
        deleteTransaction: (id) => {
          const tx = get().transactions.find((t) => t.id === id)
          if (!tx) return { ok: false, error: 'Not found' }

          const revertResult = revertTransactionImpact(tx)
          if (!revertResult.ok) return revertResult

          set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }))
          useAuditStore
            .getState()
            .addEntry({ action: 'delete', entity: 'transaction', entityId: id, newValue: null })
          return { ok: true }
        },
        getTransactionsForUser: (userId) => {
          return get()
            .transactions.filter((t) => t.userId === userId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        },
        getSummary: (userId) => {
          const txs = get().transactions.filter((t) => t.userId === userId)
          let totalIncome = 0,
            totalExpense = 0
          txs.forEach((t) => {
            if (t.type === 'income') totalIncome += t.amount
            else if (t.type === 'expense') totalExpense += t.amount
          })
          return { totalIncome, totalExpense, net: totalIncome - totalExpense }
        },
        getByCategory: (userId, categoryId) => {
          return get().transactions.filter(
            (t) => t.userId === userId && t.categoryId === categoryId
          )
        },
        getByTag: (userId, tag) => {
          return get().transactions.filter((t) => t.userId === userId && t.tags.includes(tag))
        },
        getByDateRange: (userId, from, to) => {
          const f = new Date(from).getTime()
          const t = new Date(to).getTime()
          return get().transactions.filter((tx) => {
            if (tx.userId !== userId) return false
            const d = new Date(tx.date).getTime()
            return d >= f && d <= t
          })
        },
      }
    },
    {
      name: 'fintrack-storage-transactions',
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
)
