import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useUserStore } from '../stores/useUserStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export const formatCurrency = (amount: number, privacyMode: boolean, currency?: string) => {
  const userId = useUserStore.getState().currentUser?.id;
  const settings = userId ? useSettingsStore.getState().getSettings(userId) : null;
  const isPrivacyActive = privacyMode || (settings?.privacyMode ?? false);

  if (isPrivacyActive) return '••••';
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
