import type { ModalProps } from '@/pages/Loans';
import { useAccountStore } from '@/stores/useAccountStore';
import { useLoanStore } from '@/stores/useLoanStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Loan, LoanType } from '@/types';
import React, { useState, useEffect } from 'react';

const AddLoanModal: React.FC<ModalProps & { editingLoan: Loan | null }> = ({
  isOpen,
  onClose,
  editingLoan,
}) => {
  const { currentUser } = useUserStore();
  const { addLoan, updateLoan } = useLoanStore();
  const { getAccountsForUser } = useAccountStore();
  const userId = currentUser?.id || '';
  const accounts = getAccountsForUser(userId);

  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<LoanType>('given');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingLoan) {
        setPersonName(editingLoan.personName);
        setTotalAmount(editingLoan.totalAmount.toString());
        setAccountId(editingLoan.accountId);
        setStartDate(editingLoan.startDate.split('T')[0]);
        setDueDate(editingLoan.dueDate ? editingLoan.dueDate.split('T')[0] : '');
        setType(editingLoan.type);
      } else {
        setPersonName('');
        setTotalAmount('');
        setAccountId(accounts[0]?.id || '');
        setStartDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setType('given');
      }
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingLoan?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (editingLoan) {
      // Editing only allows changing personName and dueDate
      updateLoan(editingLoan.id, {
        personName,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onClose();
    } else {
      const payload = {
        userId,
        personName,
        totalAmount: parseFloat(totalAmount),
        accountId,
        startDate: new Date(startDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        type,
      };
      const res = addLoan(payload);
      if (res.ok) onClose();
      else setError(res.error || 'Failed to add loan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in fade-in zoom-in relative w-full max-w-lg rounded-3xl border border-outline-variant/30 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="text-xl font-bold text-on-surface">
            {editingLoan ? 'Edit Loan Details' : 'Add New Loan'}
          </h2>
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

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-outline">Person Name</label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Who are you dealing with?"
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">
                Total Amount
              </label>
              <input
                type="number"
                required
                disabled={!!editingLoan}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Loan Type</label>
              <select
                disabled={!!editingLoan}
                value={type}
                onChange={(e) => setType(e.target.value as LoanType)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none disabled:opacity-50"
              >
                <option value="given">I gave this money</option>
                <option value="taken">I took this money</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Start Date</label>
              <input
                type="date"
                required
                disabled={!!editingLoan}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {!editingLoan && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">
                Funding/Receiving Account
              </label>
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
          )}

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
              className="flex-1 rounded-2xl bg-primary py-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              {editingLoan ? 'Update Loan' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;
