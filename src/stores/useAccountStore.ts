import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Account, Result } from '../types';
import { useAuditStore } from './useAuditStore';
import { useTransactionStore } from './useTransactionStore';

interface AccountState {
  accounts: Account[];
  addAccount: (payload: Partial<Account>) => Result<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => Result;
  getAccountsForUser: (userId: string) => Account[];
  // These are account-modifying methods for transactions
  _updateBalance: (accountId: string, amountChange: number) => void;
  _updateUsed: (accountId: string, amountChange: number) => void;
}

export const getAvailableCredit = (account: Account): number => {
  return (account.limit ?? 0) - (account.used ?? 0);
};

export const getDisplayBalance = (account: Account): number => {
  if (account.type === 'credit') return getAvailableCredit(account);
  return account.balance ?? 0;
};

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      addAccount: (payload) => {
        if (!payload.name?.trim()) return { ok: false, error: 'Name is required' };
        if (payload.type === 'credit' && (payload.limit === undefined || payload.limit <= 0)) {
          return { ok: false, error: 'Credit limit must be > 0' };
        }

        const newAccount: Account = {
          id: uuid(),
          userId: payload.userId!,
          name: payload.name.trim(),
          type: payload.type || 'cash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (newAccount.type === 'credit') {
          newAccount.limit = payload.limit !== undefined ? Number(payload.limit) : undefined;
          newAccount.used = 0;
        } else {
          newAccount.balance = payload.balance !== undefined ? Number(payload.balance) : 0;
        }

        set((state) => ({ accounts: [...state.accounts, newAccount] }));

        useAuditStore.getState().addEntry({
          action: 'create',
          entity: 'account',
          entityId: newAccount.id,
          newValue: newAccount,
        });

        return { ok: true, data: newAccount };
      },
      updateAccount: (id, updates) => {
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.balance !== undefined) sanitizedUpdates.balance = Number(sanitizedUpdates.balance);
        if (sanitizedUpdates.limit !== undefined) sanitizedUpdates.limit = Number(sanitizedUpdates.limit);
        if (sanitizedUpdates.used !== undefined) sanitizedUpdates.used = Number(sanitizedUpdates.used);

        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...sanitizedUpdates, updatedAt: new Date().toISOString() } : a
          ),
        }));
        useAuditStore.getState().addEntry({
          action: 'update',
          entity: 'account',
          entityId: id,
          newValue: sanitizedUpdates,
        });
      },
      deleteAccount: (id) => {
        const transactions = useTransactionStore.getState().transactions;
        const hasTransactions = transactions.some(
          (t) => t.accountId === id || t.toAccountId === id
        );

        if (hasTransactions) {
          return { ok: false, error: 'This account has transactions and cannot be deleted.' };
        }

        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));

        useAuditStore.getState().addEntry({
          action: 'delete',
          entity: 'account',
          entityId: id,
          newValue: null,
        });

        return { ok: true };
      },
      getAccountsForUser: (userId) => {
        return get().accounts.filter((a) => a.userId === userId);
      },
      _updateBalance: (accountId, amountChange) => {
        set((state) => ({
          accounts: state.accounts.map((a) => {
            if (a.id === accountId) {
              // Handle potential corrupted state like "700-100" during migration
              let currentBalance = a.balance ?? 0;
              if (typeof currentBalance === 'string' && (currentBalance as string).includes('-')) {
                const parts = (currentBalance as string).split('-');
                if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
                  currentBalance = Number(parts[0]) - Number(parts[1]);
                }
              }
              currentBalance = Number(currentBalance);
              if (isNaN(currentBalance)) currentBalance = 0;

              return {
                ...a,
                balance: currentBalance + Number(amountChange),
                updatedAt: new Date().toISOString(),
              };
            }
            return a;
          }),
        }));
      },
      _updateUsed: (accountId, amountChange) => {
        set((state) => ({
          accounts: state.accounts.map((a) => {
            if (a.id === accountId) {
              return {
                ...a,
                used: Math.max(0, Number(a.used ?? 0) + Number(amountChange)),
                updatedAt: new Date().toISOString(),
              };
            }
            return a;
          }),
        }));
      },
    }),
    {
      name: 'fintrack-storage-accounts',
      partialize: (state) => ({ accounts: state.accounts }),
    }
  )
);
