import { useState, useEffect, useMemo } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useLoanStore } from '@/stores/useLoanStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useRecurringStore } from '@/stores/useRecurringStore';
import Select from '@/components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const currencyOptions = [
  { code: 'INR', icon: '₹', label: 'INR (₹)' },
  { code: 'USD', icon: '$', label: 'USD ($)' },
  { code: 'EUR', icon: '€', label: 'EUR (€)' },
  { code: 'GBP', icon: '£', label: 'GBP (£)' },
  { code: 'JPY', icon: '¥', label: 'JPY (¥)' },
];
import {
  User,
  Shield,
  EyeOff,
  Database,
  ArrowRight,
  Check,
  Lock,
  Unlock,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const compressImage = (file: File, maxSizeKB = 200): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      const MAX_DIM = 256;

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      let result = canvas.toDataURL('image/jpeg', quality);

      while (result.length > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.src = url;
  });
};

interface KeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSuccess: (pin: string) => void;
  error?: string;
  setError?: (err: string) => void;
}

const KeypadModal = ({ isOpen, onClose, title, onSuccess, error, setError }: KeypadModalProps) => {
  const [code, setCode] = useState<string[]>([]);
  const dots = [0, 1, 2, 3];

  const handleKeyPress = (num: string) => {
    if (setError) setError('');
    if (code.length < 4) {
      const nextCode = [...code, num];
      setCode(nextCode);
      if (nextCode.length === 4) {
        // Complete
        setTimeout(() => {
          onSuccess(nextCode.join(''));
          setCode([]);
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    if (code.length > 0) {
      setCode(code.slice(0, -1));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      const resetTimer = window.setTimeout(() => setCode([]), 0);
      return () => window.clearTimeout(resetTimer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 flex w-[90%] max-w-sm flex-col items-center rounded-2xl border border-outline-variant/15 bg-surface p-6 shadow-2xl"
        >
          <h3 className="mb-6 text-center text-sm font-bold text-on-surface">{title}</h3>

          {/* Dots Indicator */}
          <div className="mb-8 flex gap-4">
            {dots.map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: code.length > index ? 1.25 : 1,
                  backgroundColor: code.length > index ? '#a78bfa' : 'transparent',
                }}
                className={`h-3.5 w-3.5 rounded-full border-2 ${
                  code.length > index ? 'border-primary' : 'border-outline/50'
                }`}
              />
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-xs font-bold text-tertiary"
            >
              {error}
            </motion.p>
          )}

          {/* Grid Keypad */}
          <div className="grid w-full max-w-60 grid-cols-3 gap-3.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high font-mono text-lg font-bold text-on-surface transition-all hover:bg-surface-container-highest active:scale-90"
              >
                {num}
              </button>
            ))}
            <button
              onClick={onClose}
              className="flex h-14 w-14 items-center justify-center text-xs font-semibold text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high font-mono text-lg font-bold text-on-surface transition-all hover:bg-surface-container-highest active:scale-90"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="flex h-14 w-14 items-center justify-center text-xs font-semibold text-on-surface-variant hover:text-on-surface active:scale-95"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Settings = () => {
  const { currentUser, editUser } = useUserStore();
  const { getSettings, initSettings, updateSettings, setPIN, clearPIN } = useSettingsStore();

  const userId = currentUser?.id || '';

  // Ensure settings are initialized
  useEffect(() => {
    if (userId) {
      initSettings(userId);
    }
  }, [userId, initSettings]);

  const appSettings = getSettings(userId);

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'preferences' | 'data'>(
    'general'
  );

  // General Tab Form State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [currency, setCurrency] = useState(currentUser?.defaultCurrency || 'INR');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security Tab state
  const [keypadConfig, setKeypadConfig] = useState<{
    isOpen: boolean;
    title: string;
    action: 'set' | 'confirm' | 'disable';
    tempPin?: string;
  }>({ isOpen: false, title: '', action: 'set' });
  const [pinError, setPinError] = useState('');

  // Data reset double confirmation
  const [confirmReset, setConfirmReset] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: EyeOff },
    { id: 'data', label: 'Data Management', icon: Database },
  ] as const;

  // Currency mappings
  const currentCurrencyDetails = useMemo(() => {
    return currencyOptions.find((c) => c.code === currency) || { code: 'INR', icon: '₹' };
  }, [currency]);

  // Handle Profile Update
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    setSaveLoading(true);
    setSaveSuccess(false);

    setTimeout(() => {
      editUser(userId, {
        name: profileName,
        avatar: profileAvatar,
        defaultCurrency: currency,
        currencyIcon: currentCurrencyDetails.icon,
      });
      updateSettings(userId, { baseCurrency: currency });
      setSaveLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 800);
  };

  // Image Upload helper
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    setProfileAvatar(base64);
  };

  // Passcode operations
  const handlePinToggle = () => {
    if (appSettings?.pinEnabled) {
      // Disable PIN lock - prompt to verify current PIN
      setKeypadConfig({
        isOpen: true,
        title: 'Enter current PIN to disable',
        action: 'disable',
      });
    } else {
      // Enable PIN lock - prompt to set new PIN
      setKeypadConfig({
        isOpen: true,
        title: 'Enter a new 4-digit PIN',
        action: 'set',
      });
    }
  };

  const handleKeypadSuccess = async (enteredPin: string) => {
    if (keypadConfig.action === 'set') {
      setKeypadConfig({
        isOpen: true,
        title: 'Confirm your new PIN',
        action: 'confirm',
        tempPin: enteredPin,
      });
    } else if (keypadConfig.action === 'confirm') {
      if (enteredPin === keypadConfig.tempPin) {
        await setPIN(userId, enteredPin);
        setKeypadConfig({ isOpen: false, title: '', action: 'set' });
      } else {
        setPinError('PIN codes did not match. Try again.');
        setKeypadConfig({
          isOpen: true,
          title: 'Enter a new 4-digit PIN',
          action: 'set',
        });
      }
    }
  };

  // Data backups
  const handleExportBackup = () => {
    const backupData = {
      currentUser,
      settings: appSettings,
      accounts: useAccountStore.getState().getAccountsForUser(userId),
      transactions: useTransactionStore.getState().transactions.filter((t) => t.userId === userId),
      loans: useLoanStore.getState().getLoansForUser(userId),
      categories: useCategoryStore.getState().getAllCategories(userId),
      budgets: useBudgetStore.getState().getBudgetsForUser(userId),
      recurringTransactions: useRecurringStore.getState().getRecurringForUser(userId),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetApp = () => {
    [
      'fintrack-storage-users',
      'fintrack-storage-settings',
      'fintrack-storage-accounts',
      'fintrack-storage-transactions',
      'fintrack-storage-loans',
      'fintrack-storage-categories',
      'fintrack-storage-budgets',
      'fintrack-storage-recurring',
      'fintrack-storage-ai',
      'sidebar-collapsed',
    ].forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-12 font-sans text-on-surface">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-on-surface">
            Settings
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            Manage your account profiles, visual preferences, and security PIN rules.
          </p>
        </div>

        {/* Custom Tab Selection Slider */}
        <div className="relative border-b border-outline-variant/10">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 pb-3.5 text-xs font-bold transition-colors ${
                    isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeSettingsTab"
                      className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="min-h-75">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* 1. GENERAL TAB */}
              {activeTab === 'general' && (
                <form onSubmit={handleProfileSave} className="space-y-6">
                  {/* Avatar upload */}
                  <div className="flex items-center gap-5 rounded-2xl border border-outline-variant/10 bg-surface-container/20 p-5">
                    <div className="group relative shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-outline-variant/20 bg-surface-container">
                        {profileAvatar ? (
                          <img
                            src={profileAvatar}
                            alt="User profile avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={28} className="text-outline" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleAvatarChange(event)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Profile Avatar</p>
                      <p className="mt-0.5 text-[10px] text-on-surface-variant/70">
                        JPEG or PNG, max 200KB. Click the avatar to upload.
                      </p>
                    </div>
                  </div>

                  {/* Profile inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold tracking-wider text-on-surface-variant uppercase">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-semibold text-on-surface focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold tracking-wider text-on-surface-variant uppercase">
                        Base Currency
                      </label>
                      <Select
                        value={currency}
                        onChange={setCurrency}
                        options={currencyOptions.map((c) => ({
                          label: c.label,
                          value: c.code,
                        }))}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary transition-all hover:opacity-95 active:scale-95 disabled:opacity-55"
                  >
                    {saveLoading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                    ) : saveSuccess ? (
                      <Check size={14} className="animate-pulse" />
                    ) : (
                      <ArrowRight size={14} />
                    )}
                    <span>{saveSuccess ? 'Changes Saved' : 'Save Changes'}</span>
                  </button>
                </form>
              )}

              {/* 2. SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* PIN Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container/20 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                        {appSettings?.pinEnabled ? <Lock size={16} /> : <Unlock size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">PIN Security Lock</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant/70">
                          Secure your financial ledger transactions with a 4-digit PIN prompt on
                          startup.
                        </p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={handlePinToggle}
                      className={`relative flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        appSettings?.pinEnabled ? 'bg-primary' : 'bg-outline-variant/50'
                      }`}
                    >
                      <motion.div
                        layout
                        className="h-5 w-5 rounded-full bg-white shadow-sm"
                        animate={{ x: appSettings?.pinEnabled ? 20 : 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      />
                    </button>
                  </div>

                  {/* Auto Lock Timeout (Only visible if PIN enabled) */}
                  {appSettings?.pinEnabled && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 rounded-2xl border border-outline-variant/10 bg-surface-container/20 p-5"
                    >
                      <p className="text-xs font-bold text-on-surface">Auto-Lock duration</p>
                      <div className="flex gap-2">
                        {[0, 1, 5, 15].map((mins) => {
                          const isSelected = appSettings.autoLockTimeout === mins;
                          return (
                            <button
                              key={mins}
                              onClick={() => updateSettings(userId, { autoLockTimeout: mins })}
                              className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                                isSelected
                                  ? 'border-primary/50 bg-primary/10 text-primary'
                                  : 'border-outline-variant/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              {mins === 0 ? 'Immediately' : `${mins} min`}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* 3. PREFERENCES TAB */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  {/* Privacy Mode */}
                  <div className="flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container/20 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                        <EyeOff size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Privacy Balance Masking</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant/70">
                          Hide asset balances with placeholder characters (••••) globally across
                          dashboards.
                        </p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() =>
                        updateSettings(userId, { privacyMode: !appSettings?.privacyMode })
                      }
                      className={`relative flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        appSettings?.privacyMode ? 'bg-primary' : 'bg-outline-variant/50'
                      }`}
                    >
                      <motion.div
                        layout
                        className="h-5 w-5 rounded-full bg-white shadow-sm"
                        animate={{ x: appSettings?.privacyMode ? 20 : 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 4. DATA MANAGEMENT TAB */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  {/* Data backup options */}
                  <div className="space-y-4 rounded-2xl border border-outline-variant/10 bg-surface-container/20 p-5">
                    <p className="text-xs font-bold text-on-surface">Local Backup Exporter</p>
                    <p className="text-[10px] leading-relaxed text-on-surface-variant/70">
                      Download a structured JSON export of all your transactions, accounts,
                      categories, and settings locally to your device.
                    </p>
                    <button
                      onClick={handleExportBackup}
                      className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 px-4 py-2.5 text-xs font-bold text-on-surface transition-all hover:border-outline-variant/40 hover:bg-surface-container-high active:scale-95"
                    >
                      <Download size={14} /> Export Backup File (.json)
                    </button>
                  </div>

                  {/* Red Reset Section */}
                  <div className="space-y-4 rounded-2xl border border-tertiary/20 bg-tertiary/5 p-5">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-tertiary">
                      <AlertTriangle size={15} /> Danger Area
                    </p>
                    <p className="text-[10px] leading-relaxed text-on-surface-variant/70">
                      Wipe all local accounts, transactions, and preferences from this device's
                      memory. This action is permanent.
                    </p>
                    {!confirmReset ? (
                      <button
                        onClick={() => setConfirmReset(true)}
                        className="hover:bg-opacity-90 flex items-center justify-center gap-2 rounded-xl bg-tertiary px-4 py-2.5 text-xs font-bold text-on-tertiary transition-all active:scale-95"
                      >
                        <Trash2 size={14} /> Reset Application Data
                      </button>
                    ) : (
                      <div className="flex max-w-sm flex-col gap-3 rounded-xl border border-tertiary/25 bg-surface p-4">
                        <p className="text-xs font-bold text-on-surface">
                          Are you absolutely sure?
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          This will permanently delete all records and sign you out.
                        </p>
                        <div className="mt-1 flex justify-end gap-2">
                          <button
                            onClick={() => setConfirmReset(false)}
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleResetApp}
                            className="rounded-lg bg-tertiary px-3 py-1.5 text-xs font-bold text-on-tertiary transition-opacity hover:opacity-90"
                          >
                            Yes, Wipe All Data
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Keypad Modal overlay */}
      <KeypadModal
        isOpen={keypadConfig.isOpen}
        title={keypadConfig.title}
        onClose={() => {
          setKeypadConfig({ isOpen: false, title: '', action: 'set' });
          setPinError('');
        }}
        onSuccess={(pin) => void handleKeypadSuccess(pin)}
        error={pinError}
        setError={setPinError}
      />
    </div>
  );
};

export default Settings;
