import { useAccountStore } from '@/stores/useAccountStore';
import { useUserStore } from '@/stores/useUserStore';
import type { AccountType, Account } from '@/types';
import { useState, useEffect } from 'react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: Account | null;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, editingAccount }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const addAccount = useAccountStore((state) => state.addAccount);
  const updateAccount = useAccountStore((state) => state.updateAccount);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [balance, setBalance] = useState('');
  const [limit, setLimit] = useState('');
  const [used, setUsed] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        setName(editingAccount.name);
        setType(editingAccount.type);
        setBalance(editingAccount.balance?.toString() || '0');
        setLimit(editingAccount.limit?.toString() || '');
        setUsed(editingAccount.used?.toString() || '0');
      } else {
        setName('');
        setType('cash');
        setBalance('0');
        setLimit('');
        setUsed('0');
      }
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingAccount?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: Partial<Account> = {
      userId: currentUser?.id,
      name,
      type,
      balance: type !== 'credit' ? parseFloat(balance || '0') : undefined,
      limit: type === 'credit' ? parseFloat(limit || '0') : undefined,
      used: type === 'credit' ? parseFloat(used || '0') : undefined,
    };

    let res;
    if (editingAccount) {
      res = updateAccount(editingAccount.id, payload);
    } else {
      res = addAccount(payload);
    }

    if (res.ok) {
      onClose();
    } else {
      setError((res.error as string) || 'Failed to save account');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in fade-in zoom-in relative w-full max-w-lg rounded-3xl border border-outline-variant/30 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="text-xl font-bold text-on-surface">
            {editingAccount ? 'Edit Account' : 'Add New Account'}
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
            <label className="mb-1.5 block text-xs font-semibold text-outline">Account Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Bank, My Wallet"
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-outline">Account Type</label>
            <div className="flex rounded-2xl border border-outline-variant/10 bg-surface-container-low p-1">
              {(['cash', 'bank', 'credit'] as AccountType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
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
          </div>

          {type === 'credit' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-outline">
                  Credit Limit
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    {currentUser?.currencyIcon}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 pr-4 pl-8 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-outline">
                  Used Balance
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                    {currentUser?.currencyIcon}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={used}
                    onChange={(e) => setUsed(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 pr-4 pl-8 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline">Balance</label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline">
                  {currentUser?.currencyIcon}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 pr-4 pl-8 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                />
              </div>
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
              {editingAccount ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;
