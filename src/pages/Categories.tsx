import { useState, useMemo, useCallback } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import AddCategoryModal from '../components/AddCategoryModal';
import type { Category, CategoryType } from '../types';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, Lock, Folder } from 'lucide-react';

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

  const { incomeCategories, expenseCategories, systemCategories } = useMemo(
    () => ({
      incomeCategories: filteredCategories.filter((c) => c.type === 'income'),
      expenseCategories: filteredCategories.filter((c) => c.type === 'expense'),
      systemCategories: filteredCategories.filter((c) => c.type === 'system'),
    }),
    [filteredCategories]
  );

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this category?')) {
        const res = deleteCategory(id);
        if (!res.ok) {
          alert(res.error);
        }
      }
    },
    [deleteCategory]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-10 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
              Customize your transaction types
            </p>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-on-background">
              Categories
            </h1>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all duration-200 hover:bg-primary-dim active:scale-[0.98] sm:w-auto"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="group relative flex-1">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline/40">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container py-3.5 pr-4 pl-12 text-sm font-medium text-on-surface transition-all duration-200 placeholder:text-outline/40 focus:border-primary/40 focus:bg-surface-container focus:ring-4 focus:ring-primary/10 focus:outline-none"
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
                  className={`cursor-pointer rounded-full px-4.5 py-2 text-xs font-semibold capitalize transition-all duration-200 ${
                    active
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-outline hover:bg-surface-container-highest hover:text-on-surface'
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
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container text-4xl opacity-15">
                <Folder size={40} />
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
  onDelete,
}: {
  title: string;
  items: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}) => {
  if (items.length === 0) return null;

  // Motion grid animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
    },
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-[10px] font-bold tracking-[0.2em] text-outline uppercase">
        {title} ({items.length})
      </h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {items.map((cat) => (
          <motion.div
            key={cat.id}
            variants={itemVariants}
            whileHover={{ y: -2, borderColor: 'rgba(167, 139, 250, 0.25)' }}
            className="group relative flex items-center gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container p-4 transition-colors duration-200"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-xl transition-transform duration-200 select-none group-hover:scale-105">
              {cat.icon || '📁'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold tracking-tight text-on-surface">
                {cat.name}
              </p>
              <p className="text-[9px] font-bold tracking-wider text-outline uppercase">
                {cat.isSystem ? 'System' : 'Custom'}
              </p>
            </div>

            {!cat.isSystem && (
              <div className="absolute top-1/2 right-3 flex -translate-y-1/2 gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  onClick={() => onEdit(cat)}
                  className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg bg-surface-container-highest/90 text-outline transition-colors hover:bg-primary/10 hover:text-primary"
                  title="Edit"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg bg-surface-container-highest/90 text-outline transition-colors hover:bg-tertiary/10 hover:text-tertiary"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {cat.isSystem && (
              <div className="absolute top-1/2 right-3.5 -translate-y-1/2 text-outline/35 opacity-40">
                <Lock size={12} />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
