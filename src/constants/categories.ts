import type { Category } from '../types';

export const SYSTEM_CATEGORIES: Category[] = [
  {
    id: 'sys_loan_given',
    userId: null,
    name: 'Loan Given',
    type: 'system',
    icon: '↑',
    isSystem: true,
  },
  {
    id: 'sys_loan_taken',
    userId: null,
    name: 'Loan Taken',
    type: 'system',
    icon: '↓',
    isSystem: true,
  },
  {
    id: 'sys_loan_settlement',
    userId: null,
    name: 'Loan Settlement',
    type: 'system',
    icon: '✓',
    isSystem: true,
  },
  {
    id: 'sys_loan_default',
    userId: null,
    name: 'Loan Default',
    type: 'system',
    icon: '❌',
    isSystem: true,
  },
  { id: 'sys_transfer', userId: null, name: 'Transfer', type: 'system', icon: '⇄', isSystem: true },
  {
    id: 'sys_credit_payment',
    userId: null,
    name: 'Credit Card Payment',
    type: 'system',
    icon: '💳',
    isSystem: true,
  },
];

export const DEFAULT_CATEGORY_SEEDS: Array<Pick<Category, 'name' | 'type' | 'icon'>> = [
  { name: 'Food & Dining', type: 'expense', icon: '🍔' },
  { name: 'Groceries', type: 'expense', icon: '🛒' },
  { name: 'Transport', type: 'expense', icon: '🚗' },
  { name: 'Bills', type: 'expense', icon: '🧾' },
  { name: 'Shopping', type: 'expense', icon: '🛍️' },
  { name: 'Entertainment', type: 'expense', icon: '🎬' },
  { name: 'Health', type: 'expense', icon: '💊' },
  { name: 'Education', type: 'expense', icon: '📚' },
  { name: 'Salary', type: 'income', icon: '💼' },
  { name: 'Freelance', type: 'income', icon: '💻' },
  { name: 'Interest', type: 'income', icon: '🏦' },
  { name: 'Other Income', type: 'income', icon: '➕' },
];
