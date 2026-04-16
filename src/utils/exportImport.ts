import { format } from 'date-fns';
import type {
  User,
  Account,
  Transaction,
  Loan,
  Category,
  Budget,
  RecurringTransaction,
} from '../types';
import { useUserStore } from '../stores/useUserStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useRecurringStore } from '../stores/useRecurringStore';

export interface AllStoreData {
  users?: User[];
  accounts?: Account[];
  transactions?: Transaction[];
  loans?: Loan[];
  userCategories?: Category[];
  budgets?: Budget[];
  recurringTransactions?: RecurringTransaction[];
}

export const exportToJSON = (_userId: string, data: AllStoreData): void => {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fintrack-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(a.href); // cleanup
};

export const exportTransactionsToCSV = (_userId: string, transactions: Transaction[]): void => {
  const headers = ['date', 'title', 'description', 'amount', 'type', 'category', 'account', 'tags'];

  const rows = transactions.map((t) => [
    t.date,
    t.title,
    t.description || '',
    t.amount.toString(),
    t.type,
    t.categoryId,
    t.accountId,
    (t.tags || []).join(';'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fintrack-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href); // cleanup
};

export const importFromJSON = async (
  file: File
): Promise<{ imported: number; skipped: number; errors: string[] }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as { version?: string; data?: AllStoreData };

        if (parsed.version !== '1.0' || !parsed.data) {
          result.errors.push('Invalid backup file format');
          return resolve(result);
        }

        const data = parsed.data;

        // Merge Users
        if (data.users) {
          const state = useUserStore.getState();
          data.users.forEach((item: User) => {
            if (!state.users.find((x: User) => x.id === item.id)) {
              // Note: direct mutation to keep it simple, but better to use set/actions if available.
              state.users.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }

        // Merge Accounts
        if (data.accounts) {
          const state = useAccountStore.getState();
          data.accounts.forEach((item: Account) => {
            if (!state.accounts.find((x: Account) => x.id === item.id)) {
              state.accounts.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }

        // Merge Transactions
        if (data.transactions) {
          const state = useTransactionStore.getState();
          data.transactions.forEach((item: Transaction) => {
            if (!state.transactions.find((x: Transaction) => x.id === item.id)) {
              state.transactions.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }

        // Merge Loans
        if (data.loans) {
          const state = useLoanStore.getState();
          data.loans.forEach((item: Loan) => {
            if (!state.loans.find((x: Loan) => x.id === item.id)) {
              state.loans.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }

        // Merge Categories
        if (data.userCategories) {
          const state = useCategoryStore.getState();
          data.userCategories.forEach((item: Category) => {
            if (!state.userCategories.find((x: Category) => x.id === item.id)) {
              state.userCategories.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }

        // Merge Budgets
        if (data.budgets) {
          const state = useBudgetStore.getState();
          data.budgets.forEach((item: Budget) => {
            if (!state.budgets.find((x: Budget) => x.id === item.id)) {
              state.budgets.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }

        // Merge Recurring
        if (data.recurringTransactions) {
          const state = useRecurringStore.getState();
          data.recurringTransactions.forEach((item: RecurringTransaction) => {
            if (!state.recurringTransactions.find((x: RecurringTransaction) => x.id === item.id)) {
              state.recurringTransactions.push(item);
              result.imported++;
            } else result.skipped++;
          });
        }
      } catch {
        result.errors.push('Failed to parse JSON file');
      }
      resolve(result);
    };

    reader.onerror = () => {
      resolve({ imported: 0, skipped: 0, errors: ['Failed to read file'] });
    };

    reader.readAsText(file);
  });
};
