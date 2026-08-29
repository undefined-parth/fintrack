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
  const [interestRate, setInterestRate] = useState('');
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
        setInterestRate(editingLoan.interestRate?.toString() || '');
      } else {
        setPersonName('');
        setTotalAmount('');
        setInterestRate('');
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
      // Editing only allows changing personName, dueDate, and interestRate
      updateLoan(editingLoan.id, {
        personName,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
      });
      onClose();
    } else {
      const payload = {
        userId,
        personName,
        totalAmount: parseFloat(totalAmount),
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in fade-in zoom-in relative w-full max-w-lg rounded-2xl border border-outline-variant/15 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/15 px-6 py-4">
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
            <div className="rounded-xl bg-tertiary/10 p-3 text-sm text-tertiary">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-outline">Person Name</label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Who are you dealing with?"
              className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none"
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
                className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none"
              />{' '}
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
                className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Loan Type</label>
              <select
                disabled={!!editingLoan}
                value={type}
                onChange={(e) => setType(e.target.value as LoanType)}
                className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none disabled:opacity-50"
              >
                <option value="given">I gave this money</option>
                <option value="taken">I took this money</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-outline">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none"
            />
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
                className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:outline-none"
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
              className="flex-1 rounded-2xl border border-outline-variant/15 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary transition-all duration-200 hover:bg-primary-dim active:scale-[0.98]"
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
