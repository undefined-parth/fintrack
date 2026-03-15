import type { Loan, RecurringTransaction } from '../types'

export const requestPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export const showNotification = (title: string, body: string): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

export const checkBudgetAlerts = (
  _budgetId: string,
  _userId: string,
  percentSpent: number
) => {
  if (percentSpent >= 100) {
    showNotification('Budget Exceeded', 'You have exceeded your budget limit.')
  } else if (percentSpent >= 80) {
    showNotification('Budget Warning', 'You have spent 80% or more of your budget.')
  }
}

export const checkLoanReminders = (loans: Loan[]) => {
  const today = new Date()
  loans.forEach((loan) => {
    if (loan.dueDate && loan.status === 'active') {
      const dueDate = new Date(loan.dueDate)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 3) {
        showNotification('Loan Due Soon', `${loan.personName} - due in ${diffDays} days`)
      }
    }
  })
}

export const checkRecurringDue = (recurring: RecurringTransaction[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  recurring.forEach((item) => {
    const dueDate = new Date(item.nextDueDate)
    dueDate.setHours(0, 0, 0, 0)
    if (dueDate.getTime() === today.getTime() && item.isActive) {
      showNotification('Recurring Due', `${item.title} is due today`)
    }
  })
}
