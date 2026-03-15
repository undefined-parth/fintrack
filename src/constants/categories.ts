import type { Category } from '../types'

export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'sys_loan_given',      userId: null, name: 'Loan Given',          type: 'system', icon: '↑', isSystem: true },
  { id: 'sys_loan_taken',      userId: null, name: 'Loan Taken',          type: 'system', icon: '↓', isSystem: true },
  { id: 'sys_loan_settlement', userId: null, name: 'Loan Settlement',     type: 'system', icon: '✓', isSystem: true },
  { id: 'sys_transfer',        userId: null, name: 'Transfer',            type: 'system', icon: '⇄', isSystem: true },
  { id: 'sys_credit_payment',  userId: null, name: 'Credit Card Payment', type: 'system', icon: '💳', isSystem: true },
]
