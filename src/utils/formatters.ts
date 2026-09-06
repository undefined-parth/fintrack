import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useUserStore } from '../stores/useUserStore';
import { useSettingsStore } from '../stores/useSettingsStore';

// Intl.NumberFormat construction is expensive — cache one instance per currency.
// Called for every list row on every render, so this matters at scale.
const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

const getCurrencyFormatter = (currency: string): Intl.NumberFormat => {
  let formatter = currencyFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency });
    currencyFormatterCache.set(currency, formatter);
  }
  return formatter;
};

export const formatCurrency = (amount: number, privacyMode: boolean, currency?: string) => {
  const userId = useUserStore.getState().currentUser?.id;
  const settings = userId ? useSettingsStore.getState().getSettings(userId) : null;
  const isPrivacyActive = privacyMode || (settings?.privacyMode ?? false);

  if (isPrivacyActive) return '••••';
  const displayCurrency = currency || useUserStore.getState().currentUser?.defaultCurrency || 'INR';
  return getCurrencyFormatter(displayCurrency).format(amount);
};

export const formatDate = (isoString: string) => {
  return format(parseISO(isoString), 'dd MMM yyyy');
};

export const formatRelativeDate = (isoString: string) => {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
};
