import TransactionListItem from '@/components/TransactionListItem';
import type { ModalProps } from '@/pages/Loans';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Loan } from '@/types';
import { useMemo } from 'react';

const LoanHistoryModal: React.FC<ModalProps & { loan: Loan | null }> = ({
  isOpen,
  onClose,
  loan,
}) => {
  const { getTransactionsForUser } = useTransactionStore();
  const { getAllCategories } = useCategoryStore();
  const { accounts } = useAccountStore();
  const { currentUser } = useUserStore();

  const history = useMemo(() => {
    if (!loan) return [];
    return getTransactionsForUser(loan.userId).filter((t) => t.loanId === loan.id);
  }, [loan, getTransactionsForUser]);

  const categories = getAllCategories(currentUser?.id || '');

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in fade-in zoom-in relative w-full max-w-2xl rounded-3xl border border-outline-variant/30 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="text-xl font-bold text-on-surface">Loan History: {loan.personName}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-outline hover:bg-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="py-20 text-center text-outline">
              No transaction history for this loan.
            </div>
          ) : (
            history.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              const account = accounts.find((a) => a.id === tx.accountId);
              return (
                <TransactionListItem
                  key={tx.id}
                  transaction={tx}
                  category={category}
                  account={account}
                  variant="compact"
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanHistoryModal;
