import type { ModalProps } from '@/pages/Loans';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Loan } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useState, useEffect } from 'react';

const SettlementModal: React.FC<ModalProps & { loan: Loan | null }> = ({
  isOpen,
  onClose,
  loan,
}) => {
  const { currentUser } = useUserStore();
  const { addTransaction } = useTransactionStore();
  const { getAccountsForUser } = useAccountStore();
  const userId = currentUser?.id || '';
  const accounts = getAccountsForUser(userId);

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && loan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(loan.remainingAmount.toString());
      setAccountId(accounts[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setTitle(`Settlement ${loan.type === 'given' ? 'from' : 'to'} ${loan.personName}`);
      setError('');
    }
  }, [isOpen, loan, accounts]);

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addTransaction({
      userId,
      date: new Date(date).toISOString(),
      title,
      amount: parseFloat(amount),
      type: 'loan',
      loanType: 'settlement',
      accountId,
      loanId: loan.id,
      categoryId: 'sys_loan_settlement',
      tags: [],
    });

    if (res.ok) onClose();
    else setError(res.error || 'Failed to record settlement');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in fade-in zoom-in relative w-full max-w-lg rounded-3xl border border-outline-variant/30 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="text-xl font-bold text-on-surface">Record Settlement</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-outline hover:bg-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-error-container/20 p-3 text-sm text-error">{error}</div>
          )}

          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
            <p className="text-xs font-semibold tracking-wider text-outline uppercase">Loan for</p>
            <p className="text-lg font-bold text-on-surface">{loan.personName}</p>
            <p className="mt-1 text-xs text-outline capitalize">
              {loan.type} · {formatCurrency(loan.remainingAmount, false)} remaining
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">
                Settlement Amount
              </label>
              <input
                type="number"
                required
                max={loan.remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Account</label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-outline-variant/30 py-4 text-sm font-bold text-outline hover:bg-surface-variant/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-secondary py-4 text-sm font-bold text-on-secondary shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Record Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettlementModal;
