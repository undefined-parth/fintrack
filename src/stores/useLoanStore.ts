import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Loan, LoanType, Result } from '../types';
import { useAuditStore } from './useAuditStore';
import { useTransactionStore } from './useTransactionStore';

interface LoanState {
  loans: Loan[];
  addLoan: (payload: Partial<Loan>) => Result<Loan>;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => Result;
  getLoansForUser: (userId: string) => Loan[];
  getActiveLoans: (userId: string) => Loan[];
  getLoanSummary: (userId: string) => {
    totalGiven: number;
    totalTaken: number;
    totalGivenRemaining: number;
    totalTakenRemaining: number;
  };
}

export const useLoanStore = create<LoanState>()(
  persist(
    (set, get) => ({
      loans: [],
      addLoan: (payload) => {
        if (!payload.personName?.trim()) return { ok: false, error: 'Person name is required' };
        if (!payload.totalAmount || payload.totalAmount <= 0)
          return { ok: false, error: 'Total amount must be > 0' };
        if (!payload.accountId) return { ok: false, error: 'Account is required' };

        const newLoan: Loan = {
          id: uuid(),
          userId: payload.userId!,
          personName: payload.personName.trim(),
          type: payload.type as LoanType,
          startDate: payload.startDate || new Date().toISOString(),
          dueDate: payload.dueDate,
          totalAmount: payload.totalAmount,
          remainingAmount: payload.totalAmount,
          status: 'active',
          accountId: payload.accountId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const txStore = useTransactionStore.getState();
        const txResult = txStore.addTransaction({
          userId: newLoan.userId,
          date: newLoan.startDate,
          title: `Loan ${newLoan.type === 'given' ? 'to' : 'from'} ${newLoan.personName}`,
          description: `Initial loan disbursement`,
          amount: newLoan.totalAmount,
          type: 'loan',
          loanType: newLoan.type,
          accountId: newLoan.accountId,
          loanId: newLoan.id,
          categoryId: newLoan.type === 'given' ? 'sys_loan_given' : 'sys_loan_taken',
        });

        if (!txResult.ok) {
          return { ok: false, error: txResult.error };
        }

        set((state) => ({ loans: [...state.loans, newLoan] }));
        useAuditStore
          .getState()
          .addEntry({ action: 'create', entity: 'loan', entityId: newLoan.id, newValue: newLoan });
        return { ok: true, data: newLoan };
      },
      updateLoan: (id, updates) => {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
          ),
        }));
        useAuditStore
          .getState()
          .addEntry({ action: 'update', entity: 'loan', entityId: id, newValue: updates });
      },
      deleteLoan: (id) => {
        const txStore = useTransactionStore.getState();
        const relatedTxs = txStore.transactions.filter((t) => t.loanId === id);

        relatedTxs.forEach((t) => {
          txStore.deleteTransaction(t.id);
        });

        set((state) => ({ loans: state.loans.filter((l) => l.id !== id) }));
        useAuditStore
          .getState()
          .addEntry({ action: 'delete', entity: 'loan', entityId: id, newValue: null });

        return { ok: true };
      },
      getLoansForUser: (userId) => get().loans.filter((l) => l.userId === userId),
      getActiveLoans: (userId) =>
        get().loans.filter((l) => l.userId === userId && l.status === 'active'),
      getLoanSummary: (userId) => {
        const userLoans = get().loans.filter((l) => l.userId === userId);
        let totalGiven = 0,
          totalTaken = 0,
          totalGivenRemaining = 0,
          totalTakenRemaining = 0;

        userLoans.forEach((l) => {
          if (l.type === 'given') {
            totalGiven += l.totalAmount;
            totalGivenRemaining += l.remainingAmount;
          } else if (l.type === 'taken') {
            totalTaken += l.totalAmount;
            totalTakenRemaining += l.remainingAmount;
          }
        });

        return { totalGiven, totalTaken, totalGivenRemaining, totalTakenRemaining };
      },
    }),
    {
      name: 'fintrack-storage-loans',
      partialize: (state) => ({ loans: state.loans }),
    }
  )
);
