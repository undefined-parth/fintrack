import StatsCard from '@/components/StatsCard';
import { useMemo, useState } from 'react';
import { getDisplayBalance, useAccountStore } from '../stores/useAccountStore';
import { useUserStore } from '../stores/useUserStore';
import type { Account } from '../types';
import { formatCurrency } from '../utils/formatters';
import AddAccountModal from '@/components/AddAccountModal';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, CreditCard, Wallet, Landmark, Calendar } from 'lucide-react';

const Accounts = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const accounts = useAccountStore(
    useShallow((state) => state.accounts.filter((a) => a.userId === currentUser?.id))
  );
  const deleteAccount = useAccountStore((state) => state.deleteAccount);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
    },
  };

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-10 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
              Manage your wallets and cards
            </p>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-on-background">
              Accounts
            </h1>
          </div>
          <button
            onClick={() => {
              setEditingAccount(null);
              setIsModalOpen(true);
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-dim active:scale-[0.98] sm:w-auto"
          >
            <Plus size={16} /> Add Account
          </button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-4 font-mono md:grid-cols-3"
        >
          {stats.map((s) => (
            <StatsCard
              key={s.title}
              title={s.title}
              value={s.value}
              accent={s.accent}
              variant="compact"
            />
          ))}
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {accounts.map((acc) => {
            const isCredit = acc.type === 'credit';
            const displayBalance = getDisplayBalance(acc);
            const utilization = isCredit && acc.limit ? ((acc.used || 0) / acc.limit) * 100 : 0;

            return (
              <motion.div
                key={acc.id}
                variants={cardVariants}
                whileHover={{
                  y: -4,
                  borderColor: 'rgba(167, 139, 250, 0.25)',
                  boxShadow: '0 4px 20px -2px rgba(9, 9, 11, 0.4)',
                }}
                className="group relative flex flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container p-6 transition-colors duration-200"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          acc.type === 'credit'
                            ? 'bg-tertiary/10 text-tertiary'
                            : acc.type === 'bank'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary/10 text-secondary'
                        }`}
                      >
                        {acc.type === 'credit' ? (
                          <CreditCard size={10} />
                        ) : acc.type === 'bank' ? (
                          <Landmark size={10} />
                        ) : (
                          <Wallet size={10} />
                        )}
                        {acc.type}
                      </span>
                      <h3 className="text-lg font-bold tracking-tight text-on-surface">
                        {acc.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-mono text-xl font-bold ${isCredit ? 'text-on-surface' : 'text-secondary'}`}
                      >
                        {formatCurrency(displayBalance, false)}
                      </p>
                      <p className="mt-1 text-[9px] font-bold tracking-wider text-outline uppercase">
                        {isCredit ? 'Available Credit' : 'Current Balance'}
                      </p>
                    </div>
                  </div>

                  {/* Card Details / Utilization */}
                  {isCredit && (
                    <div className="space-y-2 border-t border-outline-variant/5 pt-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-outline">Utilization</span>
                        <span className="font-mono text-on-surface">{utilization.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                        <motion.div
                          className="h-full rounded-full bg-tertiary"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, utilization)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[9px] font-bold tracking-wider text-outline uppercase">
                        <span>Used: {formatCurrency(acc.used || 0, false)}</span>
                        <span>Limit: {formatCurrency(acc.limit || 0, false)}</span>
                      </div>
                    </div>
                  )}

                  {!isCredit && (
                    <div className="flex items-center gap-1.5 border-t border-outline-variant/5 pt-2 text-[11px] font-medium text-outline">
                      <Calendar size={12} />
                      <span>Updated on {new Date(acc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t border-outline-variant/10 pt-3">
                  <button
                    onClick={() => {
                      setEditingAccount(acc);
                      setIsModalOpen(true);
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-surface-container-highest/30 text-outline transition-all hover:bg-primary/15 hover:text-primary active:scale-95"
                    title="Edit Account"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-surface-container-highest/30 text-outline transition-all hover:bg-tertiary/15 hover:text-tertiary active:scale-95"
                    title="Delete Account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container text-4xl opacity-15">
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
