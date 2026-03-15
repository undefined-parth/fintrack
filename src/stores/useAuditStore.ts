import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { AuditEntry } from '../types'

export const useAuditStore = create<{
  log: AuditEntry[]
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
  clearLog: () => void
}>((set) => ({
  log: [],
  addEntry: (entry) => set((state) => ({
    log: [...state.log, { ...entry, id: uuid(), timestamp: new Date().toISOString() }]
  })),
  clearLog: () => set({ log: [] }),
}))
