import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import type { TransactionType, LoanTransactionType, Category, Transaction } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const { currentUser } = useUserStore();
  const { getAccountsForUser } = useAccountStore();
  const { getAllCategories } = useCategoryStore();
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { getActiveLoans } = useLoanStore();

  const userId = currentUser?.id || '';
  const accounts = getAccountsForUser(userId);
  const categories = getAllCategories(userId);
  const activeLoans = getActiveLoans(userId);

  // Initial defaults
  const getDefaultCategory = (txType: TransactionType, cats: Category[]) => {
    if (txType === 'transfer') return 'sys_transfer';
    if (txType === 'loan') return 'sys_loan_settlement';
    const firstUserCat = cats.find((c) => !c.isSystem && c.type === txType);
    return firstUserCat?.id || '';
  };

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [loanType, setLoanType] = useState<LoanTransactionType>('settlement');
  const [loanId, setLoanId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  // Sync state when modal opens or editingTransaction changes
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setTitle(editingTransaction.title);
        setAmount(editingTransaction.amount.toString());
        setDate(editingTransaction.date.split('T')[0]);
        setAccountId(editingTransaction.accountId);
        setToAccountId(editingTransaction.toAccountId || '');
        setCategoryId(editingTransaction.categoryId);
        setDescription(editingTransaction.description || '');
        setLoanType(editingTransaction.loanType || 'settlement');
        setLoanId(editingTransaction.loanId || '');
        setTags(editingTransaction.tags || []);
      } else {
        // Reset to defaults for adding
        setType('expense');
        setTitle('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setAccountId(accounts[0]?.id || '');
        setToAccountId(accounts.find((a) => a.id !== accounts[0]?.id)?.id || '');
        setCategoryId(getDefaultCategory('expense', categories));
        setDescription('');
        setLoanType('settlement');
        setLoanId('');
        setTags([]);
      }
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingTransaction?.id]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategoryId(getDefaultCategory(newType, categories));
    if (newType === 'transfer' && !toAccountId) {
      setToAccountId(accounts.find((a) => a.id !== accountId)?.id || '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId && type !== 'transfer' && type !== 'loan') {
      setError('Please select a category');
      return;
    }

    const payload = {
      userId,
      title,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      type,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      categoryId,
      description,
      loanType: type === 'loan' ? loanType : undefined,
      loanId: type === 'loan' ? loanId : undefined,
      tags,
    };

    let res;
    if (editingTransaction) {
      res = updateTransaction(editingTransaction.id, payload);
    } else {
      res = addTransaction(payload);
    }

    if (res.ok) {
      onClose();
    } else {
      setError(res.error || 'Failed to save transaction');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="animate-in fade-in zoom-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="text-xl font-bold text-on-surface">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-outline hover:bg-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-error-container/20 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Type Tabs */}
          {!editingTransaction && (
            <div className="mb-6 flex rounded-2xl border border-outline-variant/10 bg-surface-container-low p-1">
              {(['expense', 'income', 'transfer', 'loan'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold capitalize transition-all ${
                    type === t
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'text-outline hover:bg-surface-variant/30 hover:text-on-surface'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-outline">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Groceries"
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-outline">Amount</label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    {currentUser?.currencyIcon}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 pr-4 pl-8 text-sm text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-outline">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-outline">
                  {type === 'transfer' ? 'From Account' : 'Account'}
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
            </div>

            {type === 'transfer' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-outline">
                  To Account
                </label>
                <select
                  required
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type !== 'transfer' && type !== 'loan' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-outline">Category</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories
                    .filter((c) => !c.isSystem && c.type === type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {type === 'loan' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-outline">Action</label>
                  <select
                    disabled={!!editingTransaction}
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value as LoanTransactionType)}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none disabled:opacity-50"
                  >
                    <option value="settlement">Settlement</option>
                    <option value="given">Disburse (Given)</option>
                    <option value="taken">Disburse (Taken)</option>
                  </select>
                </div>
                {loanType === 'settlement' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-outline">
                      Select Loan
                    </label>
                    <select
                      disabled={!!editingTransaction}
                      required
                      value={loanId}
                      onChange={(e) => setLoanId(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Choose loan...</option>
                      {activeLoans.map((loan) => (
                        <option key={loan.id} value={loan.id}>
                          {loan.personName} ({loan.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes..."
                rows={2}
                className="w-full resize-none rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Tags</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/10 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {tag}{' '}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                  className="flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-xl bg-surface-variant px-4 text-xs font-bold text-on-surface-variant hover:bg-outline-variant/20"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-outline-variant/30 py-4 text-sm font-bold text-outline transition-all hover:bg-surface-variant/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-primary py-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
