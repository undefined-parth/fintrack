import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useUserStore } from '../stores/useUserStore';

export const formatCurrency = (amount: number, privacyMode: boolean, currency?: string) => {
  if (privacyMode) return '••••';
  const displayCurrency = currency || useUserStore.getState().currentUser?.defaultCurrency || 'INR';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: displayCurrency }).format(
    amount
  );
};

export const formatDate = (isoString: string) => {
  return format(parseISO(isoString), 'dd MMM yyyy');
};

export const formatRelativeDate = (isoString: string) => {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
};
