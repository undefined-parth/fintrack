import React, { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '../stores/useUserStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { SYSTEM_CATEGORIES } from '../constants/categories';
import type { TransactionType, LoanTransactionType, Category, Transaction } from '../types';
import Select from './ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Tag, Plus } from 'lucide-react';

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
  const currentUser = useUserStore((state) => state.currentUser);
  const accounts = useAccountStore(
    useShallow((state) => state.accounts.filter((a) => a.userId === currentUser?.id))
  );
  const categories = useCategoryStore(
    useShallow((state) => [
      ...SYSTEM_CATEGORIES,
      ...state.userCategories.filter((c) => c.userId === currentUser?.id),
    ])
  );
  const { addTransaction, updateTransaction } = useTransactionStore();
  // Subscribe to the loans array directly — memoizing on the stable getActiveLoans
  // fn ref previously froze the list at whatever was active on first render.
  const loans = useLoanStore((state) => state.loans);

  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.userId === currentUser?.id && l.status === 'active');
  }, [loans, currentUser?.id]);

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
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [error, setError] = useState('');

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const allUserTags = currentUser?.tags || [];
    return allUserTags
      .filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
      .slice(0, 5);
  }, [currentUser?.tags, tagInput, tags]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId && type !== 'transfer' && type !== 'loan') {
      setError('Please select a category');
      return;
    }

    const userId = currentUser?.id || '';
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

    if (res && res.ok) {
      onClose();
    } else {
      setError(res?.error || 'Failed to save transaction');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-4">
              <h2 className="text-base font-bold text-on-surface">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-6"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-tertiary/20 bg-tertiary/10 p-3.5 text-xs font-bold text-tertiary"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Type Tabs */}
              {!editingTransaction && (
                <div className="flex rounded-xl border border-outline-variant/10 bg-surface p-1">
                  {(['expense', 'income', 'transfer', 'loan'] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-bold capitalize transition-all ${
                        type === t
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {/* Title & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Coffee"
                      className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-2.5 text-xs font-semibold text-on-surface transition-all duration-200 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xs font-bold text-on-surface-variant/50">
                        {currentUser?.currencyIcon}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-outline-variant/15 bg-surface py-2.5 pr-4 pl-8 text-xs font-semibold text-on-surface transition-all duration-200 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Account */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant/15 bg-surface px-4 py-2.5 text-xs font-semibold text-on-surface transition-all focus:border-primary/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                      {type === 'transfer' ? 'From Account' : 'Account'}
                    </label>
                    <Select
                      value={accountId}
                      onChange={setAccountId}
                      options={accounts.map((acc) => ({
                        label: acc.name,
                        value: acc.id,
                      }))}
                    />
                  </div>
                </div>

                {/* To Account (only transfers) */}
                {type === 'transfer' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                      To Account
                    </label>
                    <Select
                      value={toAccountId}
                      onChange={setToAccountId}
                      options={accounts
                        .filter((acc) => acc.id !== accountId)
                        .map((acc) => ({
                          label: acc.name,
                          value: acc.id,
                        }))}
                    />
                  </motion.div>
                )}

                {/* Category select (excluding transfers and loans) */}
                {type !== 'transfer' && type !== 'loan' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                      Category
                    </label>
                    <Select
                      value={categoryId}
                      onChange={setCategoryId}
                      placeholder="Choose Category..."
                      options={categories
                        .filter((c) => !c.isSystem && c.type === type)
                        .map((cat) => ({
                          label: `${cat.icon || '📁'} ${cat.name}`,
                          value: cat.id,
                        }))}
                    />
                  </div>
                )}

                {/* Loan-specific options */}
                {type === 'loan' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                        Action
                      </label>
                      <Select
                        value={loanType}
                        onChange={(val) => setLoanType(val as LoanTransactionType)}
                        options={[
                          { label: 'Settlement', value: 'settlement' },
                          { label: 'Disburse (Given)', value: 'given' },
                          { label: 'Disburse (Taken)', value: 'taken' },
                        ]}
                      />
                    </div>
                    {loanType === 'settlement' && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                          Select Loan
                        </label>
                        <Select
                          value={loanId}
                          onChange={setLoanId}
                          placeholder="Choose loan..."
                          options={activeLoans.map((loan) => ({
                            label: `${loan.personName} (${loan.type})`,
                            value: loan.id,
                          }))}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-outline-variant/15 bg-surface px-4 py-2.5 text-xs font-semibold text-on-surface transition-all duration-200 placeholder:text-outline/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>

                {/* Tags Section */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
                    <Tag size={12} /> Tags
                  </label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 transition-colors hover:text-tertiary"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onFocus={() => setShowTagSuggestions(true)}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowTagSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      placeholder="Add tag..."
                      className="flex-1 rounded-xl border border-outline-variant/15 bg-surface px-4 py-2 text-xs font-semibold text-on-surface focus:border-primary/40 focus:outline-none"
                    />

                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-high shadow-2xl">
                        <ul>
                          {tagSuggestions.map((suggestion) => (
                            <li
                              key={suggestion}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (!tags.includes(suggestion)) {
                                  setTags([...tags, suggestion]);
                                }
                                setTagInput('');
                                setShowTagSuggestions(false);
                              }}
                              className="w-full cursor-pointer px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
                            >
                              #{suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="flex cursor-pointer items-center gap-1 rounded-xl border border-outline-variant/15 bg-surface-container-high px-4 text-xs font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface active:scale-95"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3 border-t border-outline-variant/10 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 cursor-pointer rounded-xl border border-outline-variant/15 py-2.5 text-xs font-bold text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hover:bg-opacity-90 flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all active:scale-95"
                >
                  {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;
