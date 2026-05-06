import { useState, useMemo, useCallback } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import AddCategoryModal from '../components/AddCategoryModal';
import IconPlus from '../assets/icons/IconPlus';
import type { Category, CategoryType } from '../types';

import { useShallow } from 'zustand/react/shallow';

const Categories = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const { userCategories, getAllCategories, deleteCategory } = useCategoryStore(
    useShallow((state) => ({
      userCategories: state.userCategories,
      getAllCategories: state.getAllCategories,
      deleteCategory: state.deleteCategory,
    }))
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CategoryType | 'all'>('all');

  const userId = currentUser?.id || '';
  
  const allCategories = useMemo(() => {
    return getAllCategories(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, getAllCategories, userCategories]);

  const filteredCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || cat.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [allCategories, searchQuery, typeFilter]);

  const { incomeCategories, expenseCategories, systemCategories } = useMemo(() => ({
    incomeCategories: filteredCategories.filter((c) => c.type === 'income'),
    expenseCategories: filteredCategories.filter((c) => c.type === 'expense'),
    systemCategories: filteredCategories.filter((c) => c.type === 'system'),
  }), [filteredCategories]);

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const res = deleteCategory(id);
      if (!res.ok) {
        alert(res.error);
      }
    }
  }, [deleteCategory]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-10 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
              Customize your transaction types
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-on-background">
              Categories
            </h1>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold outline transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary hover:shadow-[0_1px_20px_-6px_rgba(121,157,255,0.6)] active:scale-95 sm:w-auto"
          >
            <IconPlus /> Add Category
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="group relative flex-1">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 opacity-40">🔍</span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-transparent bg-surface-container-low/80 py-3.5 pr-4 pl-12 text-sm font-medium text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:bg-surface-container focus:ring-4 focus:ring-primary/10 focus:outline-none"
            />
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'income', 'expense', 'system'] as const).map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
                    active
                      ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                      : 'bg-surface-container-low text-outline hover:bg-surface-variant/60 hover:text-on-surface'
                  } `}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-12">
          <CategorySection 
            title="Expense Categories" 
            items={expenseCategories} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
          <CategorySection 
            title="Income Categories" 
            items={incomeCategories} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
          <CategorySection 
            title="System Categories" 
            items={systemCategories} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
          
          {filteredCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-32 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container text-4xl opacity-20">
                📁
              </div>
              <p className="text-xl font-bold text-on-surface">No categories found</p>
              <p className="mt-1 text-sm text-outline">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingCategory={editingCategory}
      />
    </div>
  );
};

export default Categories;

const CategorySection = ({ 
  title, 
  items,
  onEdit,
  onDelete
}: { 
  title: string; 
  items: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase">
        {title} ({items.length})
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((cat) => (
          <div
            key={cat.id}
            className="group relative flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 transition-all hover:border-primary/30 hover:bg-surface-container hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container text-2xl shadow-sm group-hover:bg-primary/5 group-hover:scale-110 transition-transform">
              {cat.icon || '📁'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-on-surface">{cat.name}</p>
              <p className="text-[10px] font-medium text-outline capitalize">
                {cat.isSystem ? 'System Category' : 'Custom Category'}
              </p>
            </div>

            {!cat.isSystem && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(cat)}
                  className="rounded-lg bg-surface-container-high p-1.5 text-primary hover:bg-primary hover:text-on-primary shadow-sm"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="rounded-lg bg-surface-container-high p-1.5 text-error hover:bg-error hover:text-on-error shadow-sm"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            )}
            
            {cat.isSystem && (
              <div className="absolute top-2 right-2 opacity-20">
                🔒
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
