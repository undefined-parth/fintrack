import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { User, Result } from '../types'
import { useAuditStore } from './useAuditStore'

interface UserState {
  users: User[]
  currentUser: User | null
  createUser: (name: string, password: string, defaultCurrency: string, currencyIcon: string, avatar?: string) => Result<User>
  editUser: (userId: string, updates: Partial<User>) => Result
  loginUser: (name: string, password: string) => Result
  logoutUser: () => void
  deleteUser: (userId: string) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      createUser: (name, password, defaultCurrency, currencyIcon, avatar) => {
        if (!name.trim()) return { ok: false, error: 'Name is required' }
        if (!password.trim()) return { ok: false, error: 'Password is required' }
        if (!defaultCurrency.trim()) return { ok: false, error: 'Default currency is required' }
        if (!currencyIcon.trim()) return { ok: false, error: 'Currency icon is required' }
        
        const existing = get().users.find(u => u.name.toLowerCase() === name.toLowerCase())
        if (existing) return { ok: false, error: 'User already exists' }
        
        const newUser: User = {
          id: uuid(),
          name,
          password,
          defaultCurrency,
          currencyIcon,
          avatar,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser
        }))
        
        useAuditStore.getState().addEntry({
          action: 'create',
          entity: 'user',
          entityId: newUser.id,
          newValue: newUser
        })
        
        return { ok: true, data: newUser }
      },
      editUser: (userId, updates) => {
        let updatedUser: User | null = null
        
        set(state => {
          const newUsers = state.users.map(u => {
            if (u.id === userId) {
              updatedUser = { ...u, ...updates, updatedAt: new Date().toISOString() }
              return updatedUser
            }
            return u
          })
          
          return {
            users: newUsers,
            currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser
          }
        })
        
        if (!updatedUser) return { ok: false, error: 'User not found' }
        
        useAuditStore.getState().addEntry({
          action: 'update',
          entity: 'user',
          entityId: userId,
          newValue: updates
        })
        
        return { ok: true }
      },
      loginUser: (name, password) => {
        const user = get().users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === password)
        if (user) {
          set({ currentUser: user })
          return { ok: true }
        }
        return { ok: false, error: 'Invalid name or password' }
      },
      logoutUser: () => set({ currentUser: null }),
      deleteUser: (userId) => {
        set((state) => ({
          users: state.users.filter(u => u.id !== userId),
          currentUser: state.currentUser?.id === userId ? null : state.currentUser
        }))
        
        useAuditStore.getState().addEntry({
          action: 'delete',
          entity: 'user',
          entityId: userId,
          newValue: null
        })
      }
    }),
    { 
      name: 'fintrack-storage-users',
      partialize: (state) => ({ users: state.users, currentUser: state.currentUser })
    }
  )
)
