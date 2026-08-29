/* eslint-disable @typescript-eslint/no-misused-promises */
import { SUPPORTED_CURRENCIES } from '@/constants/currencies';
import { useUserStore } from '@/stores/useUserStore';
import type { Account, AccountType } from '@/types';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAccountStore } from '@/stores/useAccountStore';
import defaultAvatar from '@/assets/avatar.png';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Coins,
  Edit2,
  Eye,
  IndianRupee,
  Lightbulb,
  Lock,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User2,
  X,
  CheckCircle,
  Circle,
} from 'lucide-react';

type FormData = {
  name: string;
  password: string;
  defaultCurrency: string;
  currencyIcon: string;
  avatar: string;
};

const steps: Record<number, string> = {
  1: 'Profile Setup',
  2: 'Security Settings',
  3: 'Accounts',
};

const AccountTypes: Array<AccountType> = ['bank', 'credit', 'cash'];

const getPasswordStrength = (password: string) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  specialChar: /[^A-Za-z0-9]/.test(password),
});

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

const ProgressBar = ({ step }: { step: number }) => {
  return (
    <div className="px-8 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-on-surface">Add New User</h3>
          <p className="text-sm text-outline">
            Step {step} of 3: {steps[step]}
          </p>
        </div>
      </div>
      {/* Stepper Visual */}
      <div className="relative mb-8 flex items-center justify-between">
        <div className="absolute top-1/2 left-2.5 z-0 h-0.5 w-[95%] -translate-y-1/2 bg-slate-100 dark:bg-surface-container-highest"></div>
        <div
          className="absolute top-1/2 left-2.5 z-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
          style={{ width: step <= 2 ? `${(step - 1) * 50}%` : '95%' }}
        ></div>
        {/* Step 1 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-on-surface ring-4 ring-surface">
            <User2 />
          </div>
          <span className="mt-2 text-xs font-bold tracking-wider text-on-surface uppercase">
            Profile
          </span>
        </div>
        {/* Step 2 */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="flex size-10 items-center justify-center rounded-full bg-surface-container-highest text-outline ring-4 ring-surface"
            style={{
              backgroundColor: step >= 2 ? 'var(--color-primary)' : '',
              color: step >= 2 ? 'white' : '',
            }}
          >
            <ShieldAlert />
          </div>
          <span
            className="mt-2 text-xs font-medium tracking-wider uppercase dark:text-slate-600"
            style={{ color: step >= 2 ? 'white' : '' }}
          >
            Security
          </span>
        </div>
        {/* Step 3 */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="flex size-10 items-center justify-center rounded-full bg-surface-container-highest text-outline ring-4 ring-surface"
            style={{
              backgroundColor: step >= 3 ? 'var(--color-primary)' : '',
              color: step >= 3 ? 'white' : '',
            }}
          >
            <IndianRupee />
          </div>
          <span
            className="mt-2 text-xs font-medium tracking-wider uppercase dark:text-slate-600"
            style={{ color: step >= 3 ? 'white' : '' }}
          >
            Accounts
          </span>
        </div>
      </div>
    </div>
  );
};

const Step1 = ({
  formdata,
  setFormData,
  handleChange,
}: {
  formdata: FormData;
  setFormData: (formdata: FormData) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) => {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setFormData({ ...formdata, avatar: compressed });
  };

  return (
    <div className="flex flex-col items-center px-8 pb-6">
      <div className="group relative mb-10 cursor-pointer">
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          onChange={handleImageUpload}
        />
        <div className="flex size-32 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-outline-variant/15 bg-surface-container transition-all hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-surface-container-highest/30">
          {formdata.avatar ? (
            <img src={formdata.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <>
              <User2 size={40} />
              <span className="text-[10px] font-bold tracking-tight text-outline uppercase group-hover:text-primary dark:text-outline">
                Upload Photo
              </span>
            </>
          )}
        </div>
        <div className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-4 border-surface bg-primary">
          <Edit2 size={12} />
        </div>
      </div>
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col gap-2">
          <label className="px-1 text-sm font-semibold text-on-surface-variant">Full Name</label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-outline">
              <User2 />
            </span>
            <input
              onChange={handleChange}
              name="name"
              value={formdata.name}
              className="h-12 w-full rounded-lg border-outline-variant/15 bg-surface-container pr-4 pl-11 text-on-surface transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
              placeholder="e.g. Jane Doe"
              type="text"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="px-1 text-sm font-semibold text-on-surface-variant">
            Default Currency
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-outline">
              <Coins />
            </span>
            <select
              onChange={handleChange}
              name="defaultCurrency"
              value={formdata.defaultCurrency}
              className="h-12 w-full cursor-pointer appearance-none rounded-lg border-outline-variant/15 bg-surface-container pr-10 pl-11 text-on-surface transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline">
              <ChevronDown />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step2 = ({
  formdata,
  handleChange,
}: {
  formdata: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) => {
  const strengthLabel: Record<number, string> = {
    0: 'Weak',
    1: 'Medium',
    2: 'Strong',
    3: 'Very Strong',
    4: 'Perfect',
  };

  const getPasswordScore = (password: string): number => {
    const checks = getPasswordStrength(password);
    return Object.values(checks).filter(Boolean).length;
  };

  const [passwordScore, setPasswordScore] = useState(getPasswordScore(formdata.password));
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <div className="flex flex-1 flex-col border-t border-b border-outline-variant/15 md:flex-row dark:border-outline-variant/15">
        {/* <!-- Left Column: Form --> */}
        <div className="flex min-w-md items-center justify-evenly border-r border-outline-variant/15">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 px-1 text-sm font-semibold text-on-surface-variant">
                Password
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-outline">
                  <Lock />
                </span>
                <input
                  name="password"
                  value={formdata.password}
                  onChange={(e) => {
                    handleChange(e);
                    setPasswordScore(getPasswordScore(e.target.value));
                  }}
                  className="h-12 w-full rounded-lg border-outline-variant/15 bg-surface-container pr-11 pl-11 text-on-surface transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
                  placeholder="Create a strong password"
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                >
                  <Eye />
                </button>
              </div>
              {/* <!-- Strength Meter --> */}
              <div className="mt-1 flex gap-1.5 px-1">
                <div
                  className={`h-1.5 flex-1 rounded-full ${passwordScore >= 1 ? 'bg-primary' : 'bg-slate-200 dark:bg-surface-container-highest'}`}
                ></div>
                <div
                  className={`h-1.5 flex-1 rounded-full ${passwordScore >= 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-surface-container-highest'}`}
                ></div>
                <div
                  className={`h-1.5 flex-1 rounded-full ${passwordScore >= 3 ? 'bg-primary' : 'bg-slate-200 dark:bg-surface-container-highest'}`}
                ></div>
                <div
                  className={`h-1.5 flex-1 rounded-full ${passwordScore >= 4 ? 'bg-primary' : 'bg-slate-200 dark:bg-surface-container-highest'}`}
                ></div>
              </div>
              <p className="px-1 text-[11px] text-outline">
                Strength:
                <span className="font-bold text-yellow-500 uppercase">
                  {strengthLabel[passwordScore]}
                </span>
              </p>
            </div>
          </div>
        </div>
        {/* <!-- Right Column: Security Tips --> */}
        <div className="flex-1 bg-surface-container/50 p-8 dark:bg-surface-container/30">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="text-primary" />
              </div>
              <h3 className="font-bold text-on-surface">Security Tips</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                A strong password protects financial data and account integrity.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                  {formdata.password.length >= 8 ? (
                    <CheckCircle className="text-primary" size={20} />
                  ) : (
                    <Circle className="text-outline/40" size={20} />
                  )}
                  <span
                    className={
                      formdata.password.length >= 8
                        ? 'text-on-surface-variant'
                        : 'text-outline/50 italic'
                    }
                  >
                    8+ characters long
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  {/[A-Z]/.test(formdata.password) ? (
                    <CheckCircle className="text-primary" size={20} />
                  ) : (
                    <Circle className="text-outline/40" size={20} />
                  )}
                  <span
                    className={
                      /[A-Z]/.test(formdata.password)
                        ? 'text-on-surface-variant'
                        : 'text-outline/50 italic'
                    }
                  >
                    1 uppercase letter
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  {/[0-9]/.test(formdata.password) ? (
                    <CheckCircle className="text-primary" size={20} />
                  ) : (
                    <Circle className="text-outline/40" size={20} />
                  )}
                  <span
                    className={
                      /[0-9]/.test(formdata.password)
                        ? 'text-on-surface-variant'
                        : 'text-outline/50 italic'
                    }
                  >
                    At least 1 number
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  {/[^A-Za-z0-9]/.test(formdata.password) ? (
                    <CheckCircle className="text-primary" size={20} />
                  ) : (
                    <Circle className="text-outline/40" size={20} />
                  )}
                  <span
                    className={
                      /[^A-Za-z0-9]/.test(formdata.password)
                        ? 'text-on-surface-variant'
                        : 'text-outline/50 italic'
                    }
                  >
                    Special character
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-4 my-2 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-primary/20 dark:bg-primary/5">
        <div className="flex gap-3">
          <Lightbulb className="shrink-0 text-primary" size={20} />
          <p className="text-[11px] leading-normal text-on-surface-variant">
            Avoid using common words or birth dates. Consider a passphrase for better security.
          </p>
        </div>
      </div>
    </>
  );
};

const Step3 = ({
  accountList,
  setAccountList,
}: {
  accountList: Partial<Account>[];
  setAccountList: React.Dispatch<React.SetStateAction<Partial<Account>[]>>;
}) => {
  const handleChange = ({ name, value, index }: { name: string; value: string; index: number }) => {
    setAccountList(
      (prev) =>
        prev.map((account, i) => (i === index ? { ...account, [name]: value } : account)) as [
          Partial<Account>,
        ]
    );
  };

  const handleDelete = (index: number) => {
    setAccountList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="px-8 pb-10">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-on-surface">Initial Accounts</h1>
        <p className="text-sm text-outline">
          Add your bank accounts, credit cards, or cash to begin tracking.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-outline-variant/15 bg-white dark:border-outline-variant/15 dark:bg-[#111318]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="border-b border-outline-variant/15 px-4 py-3 text-xs font-bold tracking-wider text-on-surface-variant uppercase dark:border-outline-variant/15 dark:text-slate-300">
                Account Name
              </th>
              <th className="border-b border-outline-variant/15 px-4 py-3 text-xs font-bold tracking-wider text-on-surface-variant uppercase dark:border-outline-variant/15 dark:text-slate-300">
                Account Type
              </th>
              <th className="border-b border-outline-variant/15 px-4 py-3 text-xs font-bold tracking-wider text-on-surface-variant uppercase dark:border-outline-variant/15 dark:text-slate-300">
                Starting Balance / Credit Limit
              </th>
              <th className="border-b border-outline-variant/15 px-4 py-3 text-center text-xs font-bold tracking-wider text-on-surface-variant uppercase dark:border-outline-variant/15 dark:text-slate-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {accountList.map((account, index) => {
              return (
                <tr className="group transition-colors" key={index}>
                  <td className="px-4 py-4">
                    <div>
                      <input
                        className="w-full rounded-lg border-outline-variant/15 bg-surface-container py-1.5 pr-3 pl-8 text-xs font-semibold text-on-surface transition-all outline-none focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
                        placeholder="Account Name"
                        name="name"
                        value={account.name}
                        onChange={(e) =>
                          handleChange({ name: 'name', value: e.target.value, index })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <select
                        value={account.type}
                        onChange={(e) =>
                          handleChange({ name: 'type', value: e.target.value, index })
                        }
                        name="type"
                        className="w-full cursor-pointer appearance-none rounded-lg border-outline-variant/15 bg-surface-container py-1.5 pr-8 pl-3 text-xs font-semibold text-on-surface transition-all outline-none focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
                      >
                        {AccountTypes.map((accountType) => (
                          <option key={accountType}>{accountType}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-outline">
                        <ChevronDown size={16} />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      {account.type !== 'credit' ? (
                        <input
                          className="w-full rounded-lg border-outline-variant/15 bg-surface-container py-1.5 pr-3 pl-8 text-xs font-semibold text-on-surface transition-all outline-none focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
                          type="number"
                          placeholder="Account Balance"
                          name="balance"
                          onChange={(e) =>
                            handleChange({ name: 'limit', value: e.target.value, index })
                          }
                        />
                      ) : (
                        <input
                          className="w-full rounded-lg border-outline-variant/15 bg-surface-container py-1.5 pr-3 pl-8 text-xs font-semibold text-on-surface transition-all outline-none focus:ring-2 focus:ring-primary/20 dark:border-outline-variant/15 dark:bg-surface-container"
                          type="number"
                          placeholder="Credit Limit"
                          name="limit"
                          onChange={(e) =>
                            handleChange({ name: 'balance', value: e.target.value, index })
                          }
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-outline transition-colors hover:text-tertiary"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <button
          onClick={(e) => {
            e.preventDefault();
            setAccountList([...accountList, { name: '', type: 'cash', balance: 0 }]);
          }}
          className="flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80"
        >
          <PlusCircle size={20} />
          Add Another Account
        </button>
      </div>
    </div>
  );
};

const Footer = ({
  step,
  setStep,
  navigate,
  handleSubmit,
}: {
  step: number;
  setStep: (step: number) => void;
  navigate: (path: string) => void;
  handleSubmit: (
    e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => void;
}) => {
  return (
    <div className="flex items-center justify-between border-t border-outline-variant/15 bg-surface-container px-8 py-6 dark:border-outline-variant/15 dark:bg-surface-container/50">
      <button
        onClick={() => (step === 1 ? navigate('/') : setStep(step - 1))}
        className="flex items-center gap-2 text-sm font-semibold text-outline transition-colors hover:text-on-surface-variant dark:text-outline dark:hover:text-on-surface"
      >
        {step === 1 ? (
          <X size={18} />
        ) : (
          <ArrowLeft size={18} />
        )}
        {step === 1 ? 'Cancel' : `Back to ${steps[step - 1]}`}
      </button>
      <button
        type="button"
        onClick={(e) => {
          if (step === 3) handleSubmit(e);
          else setStep(step + 1);
        }}
        className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-bold text-on-surface transition-all hover:bg-primary-dim active:scale-95"
      >
        {step === 3 ? 'Create User' : `Next: ${steps[step + 1]}`}
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

const AddNewUser = () => {
  const { createUser } = useUserStore();
  const { addAccount } = useAccountStore();

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    password: '',
    defaultCurrency: 'INR',
    currencyIcon: '₹',
    avatar: '',
  });
  const [accountList, setAccountList] = useState<Partial<Account>[]>([
    {
      name: 'Cash',
      type: 'cash',
      balance: 0,
      limit: 0,
    },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (
    e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    // validate name and password
    if (!formData.name.trim() || !formData.password.trim()) return;

    const passwordChecks = getPasswordStrength(formData.password);
    if (!Object.values(passwordChecks).every(Boolean)) return;

    // validate accounts
    if (
      accountList.some(
        (account) =>
          !account.name?.trim() ||
          (account.type === 'credit'
            ? !account.limit || account.limit <= 0
            : account.balance === undefined)
      )
    ) {
      return;
    }

    // create user
    const user = createUser(
      formData.name,
      formData.password,
      formData.defaultCurrency,
      formData.currencyIcon,
      formData.avatar ? formData.avatar : defaultAvatar
    );

    if (!user.ok) {
      alert(user.error);
      return;
    }
    if (user.ok) {
      accountList.forEach((account) => {
        addAccount({
          balance: account.balance,
          limit: account.limit,
          used: account.used,
          type: account.type,
          name: account.name,
          userId: user.data!.id,
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      navigate(`/user-created?id=${user.data!.id}`);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-7">
      <div className="w-full max-w-200 overflow-hidden rounded-xl border border-outline-variant/15 bg-white shadow-xl dark:border-outline-variant/15 dark:bg-[#111318]">
        <ProgressBar step={step} />
        {step === 1 && (
          <Step1 formdata={formData} setFormData={setFormData} handleChange={handleChange} />
        )}
        {step === 2 && <Step2 formdata={formData} handleChange={handleChange} />}
        {step === 3 && <Step3 accountList={accountList} setAccountList={setAccountList} />}
        <Footer step={step} setStep={setStep} navigate={navigate} handleSubmit={handleSubmit} />
      </div>
    </main>
  );
};

export default AddNewUser;
