import StatsCard from '@/components/StatsCard';
import { useMemo, useState } from 'react';
import IconPlus from '../assets/icons/IconPlus';
import { getDisplayBalance, useAccountStore } from '../stores/useAccountStore';
import { useUserStore } from '../stores/useUserStore';
import type { Account } from '../types';
import { formatCurrency } from '../utils/formatters';
import AddAccountModal from '@/components/AddAccountModal';

const Accounts = () => {
  const { currentUser } = useUserStore();
  const { getAccountsForUser, deleteAccount } = useAccountStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const userId = currentUser?.id || '';
  const accounts = getAccountsForUser(userId);

  const { totalBalance, totalDebt, netWorth } = useMemo(() => {
    let balance = 0;
    let debt = 0;
    accounts.forEach((a) => {
      if (a.type === 'credit') {
        debt += a.used || 0;
      } else {
        balance += a.balance || 0;
      }
    });
    return {
      totalBalance: balance,
      totalDebt: debt,
      netWorth: balance - debt,
    };
  }, [accounts]);

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this account? It must not have any associated transactions.'
      )
    ) {
      const res = deleteAccount(id);
      if (!res.ok) alert(res.error);
    }
  };

  const stats = [
    { title: 'Liquid Assets', value: totalBalance, accent: 'secondary' as const },
    { title: 'Total Debt', value: totalDebt, accent: 'tertiary' as const },
    { title: 'Net Worth', value: netWorth, accent: 'primary' as const },
  ];

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-10 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
              Manage your wallets and cards
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-on-background">Accounts</h1>
          </div>
          <button
            onClick={() => {
              setEditingAccount(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold outline transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary hover:shadow-[0_1px_20px_-6px_rgba(121,157,255,0.6)] active:scale-95 sm:w-auto"
          >
            <IconPlus /> Add Account
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 font-mono md:grid-cols-3">
          {stats.map((s) => (
            <StatsCard
              key={s.title}
              title={s.title}
              value={s.value}
              accent={s.accent}
              variant="compact"
            />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const isCredit = acc.type === 'credit';
            const displayBalance = getDisplayBalance(acc);

            return (
              <div
                key={acc.id}
                className="group relative flex flex-col gap-5 rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                        acc.type === 'credit'
                          ? 'bg-tertiary/10 text-tertiary'
                          : acc.type === 'bank'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {acc.type}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-on-surface">{acc.name}</h3>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono text-xl font-bold ${isCredit ? 'text-on-surface' : 'text-secondary'}`}
                    >
                      {formatCurrency(displayBalance, false)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-outline uppercase">
                      {isCredit ? 'Available Credit' : 'Current Balance'}
                    </p>
                  </div>
                </div>

                {isCredit && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-outline">Utilization</span>
                      <span className="text-on-surface">
                        {(((acc.used || 0) / (acc.limit || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className="h-full bg-tertiary transition-all"
                        style={{
                          width: `${Math.min(100, ((acc.used || 0) / (acc.limit || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-outline uppercase">
                      <span>Used: {formatCurrency(acc.used || 0, false)}</span>
                      <span>Limit: {formatCurrency(acc.limit || 0, false)}</span>
                    </div>
                  </div>
                )}

                {!isCredit && (
                  <div className="text-xs font-semibold text-outline">
                    Balance updated on {new Date(acc.updatedAt).toLocaleDateString()}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-outline-variant/10 pt-2">
                  <button
                    onClick={() => {
                      setEditingAccount(acc);
                      setIsModalOpen(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-variant/30 text-outline transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                    title="Edit Account"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-variant/30 text-outline transition-all hover:bg-error-container/30 hover:text-error active:scale-90"
                    title="Delete Account"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container text-4xl opacity-20">
              💳
            </div>
            <p className="text-xl font-bold text-on-surface">No accounts found</p>
            <p className="mt-1 text-sm text-outline">
              Add your first bank account or wallet to get started
            </p>
          </div>
        )}
      </div>

      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAccount={editingAccount}
      />
    </div>
  );
};

export default Accounts;
