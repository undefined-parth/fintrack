import type { Account, Transaction, Loan, Budget, User } from '../types'

export const validateUser = (payload: Partial<User>): string[] => {
  const errors: string[] = []
  if (!payload.name?.trim()) errors.push('Name is required')
  if (!payload.password?.trim()) errors.push('Password is required')
  return errors
}

export const validateAccount = (payload: Partial<Account>): string[] => {
  const errors: string[] = []
  if (!payload.name?.trim()) errors.push('Name is required')
  if (payload.type === 'credit' && (payload.limit === undefined || payload.limit <= 0)) {
    errors.push('Credit limit must be greater than 0')
  }
  return errors
}

export const validateTransaction = (payload: Partial<Transaction>): string[] => {
  const errors: string[] = []
  if (payload.amount === undefined || payload.amount <= 0) errors.push('Amount must be greater than 0')
  if (!payload.title?.trim()) errors.push('Title is required')
  if (!payload.accountId) errors.push('Account is required')
  if (payload.type === 'transfer' && (!payload.toAccountId || payload.toAccountId === payload.accountId)) {
    errors.push('Valid destination account is required for transfers')
  }
  if (payload.type === 'loan' && payload.loanType === 'settlement' && !payload.loanId) {
    errors.push('Loan is required for settlement')
  }
  return errors
}

export const validateLoan = (payload: Partial<Loan>): string[] => {
  const errors: string[] = []
  if (!payload.personName?.trim()) errors.push('Person name is required')
  if (payload.totalAmount === undefined || payload.totalAmount <= 0) errors.push('Total amount must be greater than 0')
  if (!payload.accountId) errors.push('Account is required')
  return errors
}

export const validateBudget = (payload: Partial<Budget>): string[] => {
  const errors: string[] = []
  if (payload.amount === undefined || payload.amount <= 0) errors.push('Amount must be greater than 0')
  if (!payload.categoryId) errors.push('Category is required')
  if (payload.period === 'custom' && (!payload.startDate || !payload.endDate)) {
    errors.push('Start and end dates are required for custom period')
  }
  return errors
}
