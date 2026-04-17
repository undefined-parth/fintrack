import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import Select from './ui/Select';
import type { Category, CategoryType } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
}) => {
  const { currentUser } = useUserStore();
  const { addCategory, editCategory } = useCategoryStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState('📁');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(editingCategory.name);
        setType(editingCategory.type);
        setIcon(editingCategory.icon || '📁');
      } else {
        setName('');
        setType('expense');
        setIcon('📁');
      }
      setError('');
    }
  }, [isOpen, editingCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const userId = currentUser?.id || '';
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    let res;
    if (editingCategory) {
      res = editCategory(editingCategory.id, { name: name.trim(), icon });
    } else {
      res = addCategory(userId, name.trim(), type, icon);
    }

    if (res.ok) {
      onClose();
    } else {
      setError(res.error || 'Failed to save category');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="animate-in fade-in zoom-in relative w-full max-w-md overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
          <h2 className="text-xl font-bold text-on-surface">
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-outline hover:bg-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-error-container/20 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-outline uppercase tracking-wider">
                Category Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Health"
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={editingCategory ? 'opacity-50 pointer-events-none' : ''}>
                <label className="mb-1.5 block text-xs font-semibold text-outline uppercase tracking-wider">
                  Type
                </label>
                <div className="w-full">
                  <Select
                    value={type}
                    onChange={(val) => setType(val as CategoryType)}
                    options={[
                      { label: 'Expense', value: 'expense' },
                      { label: 'Income', value: 'income' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-outline uppercase tracking-wider">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📁"
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
                />
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
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
