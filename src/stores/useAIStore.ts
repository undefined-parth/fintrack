/* eslint-disable @typescript-eslint/require-await */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AISettings, Result, Transaction, Account, Loan } from '../types'

interface AIState {
  settings: AISettings | null
  insightCache: { data: string; cachedAt: string } | null
  summaryCache: Record<string, string>
  setApiKey: (provider: AISettings['provider'], apiKey: string) => Promise<Result>
  clearApiKey: () => void
  testConnection: (provider: AISettings['provider'], apiKey: string) => Promise<Result>
  isReady: () => boolean
  buildSafeContext: (
    userId: string,
    txs: Transaction[],
    accounts: Account[],
    loans: Loan[]
  ) => object
  getSpendingInsights: (
    userId: string,
    txs: Transaction[],
    accounts: Account[],
    loans: Loan[]
  ) => Promise<Result<string>>
  getBudgetSuggestions: (
    userId: string,
    txs: Transaction[]
  ) => Promise<Result<{ categoryId: string; suggestedAmount: number; reason: string }[]>>
  suggestCategory: (
    title: string,
    availableCategories: { id: string; name: string }[]
  ) => Promise<Result<string>>
  askFinTrack: (
    userId: string,
    question: string,
    txs: Transaction[],
    accounts: Account[],
    loans: Loan[]
  ) => Promise<Result<string>>
  generateMonthlySummary: (
    userId: string,
    month: number,
    year: number,
    txs: Transaction[],
    loans: Loan[]
  ) => Promise<Result<string>>
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      settings: null,
      insightCache: null,
      summaryCache: {},

      clearApiKey: () => set({ settings: null }),

      isReady: () => {
        const s = get().settings
        return s !== null && s.isEnabled && s.apiKey.length > 0
      },

      testConnection: async (provider, apiKey) => {
        try {
          if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1,
              }),
            })
            if (!res.ok) throw new Error('Invalid key')
          } else if (provider === 'gemini') {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            )
            if (!res.ok) throw new Error('Invalid key')
          } else if (provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-haiku-4-5',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1,
              }),
            })
            if (!res.ok) throw new Error('Invalid key')
          }
          return { ok: true }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return { ok: false, error: 'Invalid API key or connection failed' }
        }
      },

      setApiKey: async (provider, apiKey) => {
        const test = await get().testConnection(provider, apiKey)
        if (!test.ok) return test

        set({ settings: { provider, apiKey, isEnabled: true } })
        return { ok: true }
      },

      buildSafeContext: (userId, txs, accounts, loans) => {
        const safeAccounts = accounts
          .filter((a) => a.userId === userId)
          .map((a) => ({
            type: a.type,
            balance: a.balance,
            limit: a.limit,
            used: a.used,
          }))
        const safeLoans = loans
          .filter((l) => l.userId === userId)
          .map((l) => ({
            type: l.type,
            status: l.status,
            totalAmount: l.totalAmount,
            remainingAmount: l.remainingAmount,
            person: 'Person X',
          }))
        const safeTxs = txs
          .filter((t) => t.userId === userId)
          .map((t) => ({
            date: t.date,
            amount: t.amount,
            type: t.type,
            categoryId: t.categoryId,
            title: t.title,
          }))
        return { accounts: safeAccounts, loans: safeLoans, transactions: safeTxs }
      },

      getSpendingInsights: async (_userId, _txs, _accounts, _loans) => {
        const cache = get().insightCache
        if (cache) {
          const cachedAt = new Date(cache.cachedAt).getTime()
          if (Date.now() - cachedAt < 24 * 60 * 60 * 1000) return { ok: true, data: cache.data }
        }
        if (!get().isReady()) return { ok: false, error: 'AI not configured' }

        const data =
          'Placeholder insights based on local execution context. Real implementation requires AI calling.'
        set({ insightCache: { data, cachedAt: new Date().toISOString() } })
        return { ok: true, data }
      },

      getBudgetSuggestions: async () => {
        return { ok: true, data: [] }
      },
      suggestCategory: async (_title, categories) => {
        return { ok: true, data: categories[0]?.id || '' }
      },
      askFinTrack: async () => {
        return { ok: true, data: 'I am FinTrack AI.' }
      },
      generateMonthlySummary: async (_userId, month, year) => {
        const key = `${year}-${month.toString().padStart(2, '0')}`
        const cache = get().summaryCache[key]
        if (cache) return { ok: true, data: cache }

        const data = "This month's summary placeholder."
        set((state) => ({ summaryCache: { ...state.summaryCache, [key]: data } }))
        return { ok: true, data }
      },
    }),
    {
      name: 'fintrack-storage-ai',
      partialize: (state) => ({
        settings: state.settings,
        insightCache: state.insightCache,
        summaryCache: state.summaryCache,
      }),
    }
  )
)
