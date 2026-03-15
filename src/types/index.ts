// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  password: string          // mandatory, never optional
  defaultCurrency: string   // e.g., 'INR', 'USD' (Currency Code)
  currencyIcon: string      // e.g., '₹', '$' (Currency Symbol)
  avatar?: string           // base64 or URL
  createdAt: string         // ISO string
  updatedAt: string
}

// ─── Account ─────────────────────────────────────────────────────────────────
export type AccountType = 'cash' | 'bank' | 'credit'

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  balance?: number          // cash & bank only
  limit?: number            // credit only
  used?: number             // credit only — tracks debt, NOT balance
  createdAt: string
  updatedAt: string
}

// ─── Category ────────────────────────────────────────────────────────────────
export type CategoryType = 'income' | 'expense' | 'system'

export interface Category {
  id: string
  userId: string | null     // null = system category
  name: string
  type: CategoryType
  icon?: string
  isSystem: boolean
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer' | 'loan'
export type LoanTransactionType = 'given' | 'taken' | 'settlement'

export interface Transaction {
  id: string
  userId: string
  date: string              // ISO string
  title: string
  description?: string
  amount: number
  type: TransactionType
  categoryId: string
  loanType?: LoanTransactionType
  accountId: string
  toAccountId?: string      // transfer only
  loanId?: string           // loan/settlement only
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Loan ────────────────────────────────────────────────────────────────────
export type LoanType = 'given' | 'taken'
export type LoanStatus = 'active' | 'closed'

export interface Loan {
  id: string
  userId: string
  personName: string
  type: LoanType
  startDate: string
  dueDate?: string
  totalAmount: number
  remainingAmount: number
  status: LoanStatus
  accountId: string
  createdAt: string
  updatedAt: string
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom'

export interface Budget {
  id: string
  userId: string
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate?: string        // required for custom period
  endDate?: string          // required for custom period
  rollover: boolean
  lastPeriodRollover: number
  createdAt: string
  updatedAt: string
}

// ─── Recurring Transaction ───────────────────────────────────────────────────
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  userId: string
  title: string
  description?: string
  amount: number
  type: TransactionType
  categoryId: string
  accountId: string
  toAccountId?: string
  loanId?: string
  tags: string[]
  frequency: RecurringFrequency
  nextDueDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── AI Settings ─────────────────────────────────────────────────────────────
export type AIProvider = 'openai' | 'gemini' | 'anthropic'

export interface AISettings {
  provider: AIProvider
  apiKey: string
  isEnabled: boolean
  lastInsightDate?: string
  model?: string
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  userId: string
  theme: 'dark' | 'light'
  baseCurrency: string
  autoLockTimeout: number   // minutes, 0 = disabled
  privacyMode: boolean
  notificationsEnabled: boolean
  pinEnabled: boolean
  pin?: string              // SHA-256 hashed
}

// ─── Audit Entry (session only) ──────────────────────────────────────────────
export interface AuditEntry {
  id: string
  action: 'create' | 'update' | 'delete'
  entity: 'user' | 'account' | 'transaction' | 'loan' | 'budget' | 'category'
  entityId: string
  oldValue?: unknown
  newValue: unknown
  timestamp: string
}

// ─── Generic Result ───────────────────────────────────────────────────────────
export interface Result<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}
