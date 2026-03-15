import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Category, CategoryType, Result } from '../types'
import { SYSTEM_CATEGORIES } from '../constants/categories'
import { useAuditStore } from './useAuditStore'

interface CategoryState {
  userCategories: Category[]
  getAllCategories: (userId: string) => Category[]
  addCategory: (userId: string, name: string, type: string, icon?: string) => Result<Category>
  editCategory: (id: string, updates: Partial<Category>) => Result
  deleteCategory: (id: string) => Result
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      userCategories: [],
      getAllCategories: (userId) => {
        return [
          ...SYSTEM_CATEGORIES,
          ...get().userCategories.filter(c => c.userId === userId)
        ]
      },
      addCategory: (userId, name, type, icon) => {
        if (!name.trim()) return { ok: false, error: 'Name is required' }
        if (type === 'system') return { ok: false, error: 'Cannot create system category' }
        
        const existing = get().userCategories.find(
          c => c.userId === userId && c.name.toLowerCase() === name.trim().toLowerCase()
        )
        if (existing) return { ok: false, error: 'Category with this name already exists' }
        
        const newCat: Category = {
          id: uuid(),
          userId,
          name: name.trim(),
          type: type as CategoryType,
          icon,
          isSystem: false
        }
        
        set(state => ({ userCategories: [...state.userCategories, newCat] }))
        
        useAuditStore.getState().addEntry({
          action: 'create',
          entity: 'category',
          entityId: newCat.id,
          newValue: newCat
        })
        
        return { ok: true, data: newCat }
      },
      editCategory: (id, updates) => {
        const isSystem = SYSTEM_CATEGORIES.some(c => c.id === id)
        if (isSystem) return { ok: false, error: 'System categories cannot be edited' }
        
        let updated: boolean = false
        set(state => {
          const newCats = state.userCategories.map(c => {
            if (c.id === id) {
              updated = true
              return { ...c, ...updates, id: c.id, isSystem: false, userId: c.userId } // protect critical fields
            }
            return c
          })
          return { userCategories: newCats }
        })
        
        if (!updated) return { ok: false, error: 'Category not found' }
        
        useAuditStore.getState().addEntry({
          action: 'update',
          entity: 'category',
          entityId: id,
          newValue: updates
        })
        
        return { ok: true }
      },
      deleteCategory: (id) => {
        const isSystem = SYSTEM_CATEGORIES.some(c => c.id === id)
        if (isSystem) return { ok: false, error: 'System categories cannot be deleted' }
        
        set(state => ({ userCategories: state.userCategories.filter(c => c.id !== id) }))
        
        useAuditStore.getState().addEntry({
          action: 'delete',
          entity: 'category',
          entityId: id,
          newValue: null
        })
        
        return { ok: true }
      }
    }),
    { 
      name: 'fintrack-storage-categories',
      partialize: (state) => ({ userCategories: state.userCategories })
    }
  )
)
