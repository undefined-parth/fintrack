import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '../types'

interface SettingsState {
  settingsList: AppSettings[]
  initSettings: (userId: string) => void
  updateSettings: (userId: string, updates: Partial<AppSettings>) => void
  getSettings: (userId: string) => AppSettings | null
  setTheme: (userId: string, theme: 'dark' | 'light') => void
  setPrivacyMode: (userId: string, enabled: boolean) => void
  setAutoLockTimeout: (userId: string, minutes: number) => void
  setPIN: (userId: string, pin: string) => Promise<void>
  verifyPIN: (userId: string, pin: string) => Promise<boolean>
  clearPIN: (userId: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settingsList: [],
      initSettings: (userId) => set((state) => {
        if (!state.settingsList.find(s => s.userId === userId)) {
          const defaultSettings: AppSettings = {
            userId,
            theme: 'dark',
            baseCurrency: 'INR',
            autoLockTimeout: 0,
            privacyMode: false,
            notificationsEnabled: true,
            pinEnabled: false
          }
          return { settingsList: [...state.settingsList, defaultSettings] }
        }
        return state
      }),
      updateSettings: (userId, updates) => set((state) => ({
        settingsList: state.settingsList.map(s => 
          s.userId === userId ? { ...s, ...updates } : s
        )
      })),
      getSettings: (userId) => {
        return get().settingsList.find(s => s.userId === userId) || null
      },
      setTheme: (userId, theme) => get().updateSettings(userId, { theme }),
      setPrivacyMode: (userId, privacyMode) => get().updateSettings(userId, { privacyMode }),
      setAutoLockTimeout: (userId, autoLockTimeout) => get().updateSettings(userId, { autoLockTimeout }),
      setPIN: async (userId, pin) => {
        if (!pin) return;
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('')
        get().updateSettings(userId, { pin: hashHex, pinEnabled: true })
      },
      verifyPIN: async (userId, pin) => {
        const settings = get().getSettings(userId)
        if (!settings || !settings.pinEnabled || !settings.pin) return true
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('')
        
        return settings.pin === hashHex
      },
      clearPIN: (userId) => get().updateSettings(userId, { pin: undefined, pinEnabled: false })
    }),
    { 
      name: 'fintrack-storage-settings',
      partialize: (state) => ({ settingsList: state.settingsList })
    }
  )
)
