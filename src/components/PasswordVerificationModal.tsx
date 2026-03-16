import React, { useState } from 'react';
import clsx from 'clsx';
import type { User } from '@/types';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextStep: () => void;
  errorMessage?: string;
  stepText?: string;
  user: Partial<User> | null;
}

export const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  isOpen,
  nextStep,
  onClose,
  errorMessage = 'Incorrect password. Try again.',
  stepText = 'Step 1 of 2',
  user,
}) => {
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);
  const realPassword = user?.password;

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword('');
    if (password === realPassword) {
      setHasError(false);
      nextStep();
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg-dark font-sans text-slate-100">
      <main
        className="relative z-10 flex h-full w-full flex-1 flex-col items-center justify-between px-6 py-8 transition-all duration-500 md:py-12"
        style={{
          background: hasError
            ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.05) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        }}
      >
        <div className="text-center">
          {hasError ? (
            <span className="text-sm font-medium tracking-[0.3em] text-error-red/60 uppercase">
              Attempt Failed
            </span>
          ) : (
            <span className="text-sm font-medium tracking-[0.3em] text-slate-500 uppercase opacity-60">
              {stepText}
            </span>
          )}
        </div>

        <div className="flex w-full max-w-4xl flex-col items-center">
          {/* Avatar Section */}
          <div className="relative mb-8 md:mb-10">
            <div className="group relative h-24 w-24 md:h-32 md:w-32">
              {hasError ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-error-red/10 blur-2xl transition-all duration-700"></div>
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-error-red/30 p-1">
                    <img
                      alt="User avatar"
                      className="h-full w-full rounded-full object-cover opacity-70 grayscale"
                      src={user?.avatar || 'src/assets/avatar.png'}
                    />
                  </div>
                  <div className="absolute -inset-4 rounded-full border border-error-red/10"></div>
                  <div className="absolute -inset-8 rounded-full border border-white/5"></div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl transition-all duration-700 group-hover:bg-primary/20"></div>
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/20 p-1">
                    <img
                      alt="User avatar"
                      className="h-full w-full rounded-full object-cover opacity-80 grayscale"
                      src={user?.avatar || 'src/assets/avatar.png'}
                    />
                  </div>
                  <div className="absolute -inset-4 animate-[spin_20s_linear_infinite] rounded-full border border-white/5"></div>
                  <div className="absolute -inset-8 animate-[spin_30s_linear_infinite_reverse] rounded-full border border-white/5"></div>
                </>
              )}
            </div>
          </div>

          <div className="mb-6 text-center md:mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tighter text-white md:mb-4 md:text-4xl">
              Verify Identity
            </h1>
            <p className="text-sm font-light tracking-wide text-slate-400">
              Enter your password to continue
            </p>
            {hasError && (
              <p className="mt-4 animate-pulse text-sm font-medium tracking-wide text-error-red">
                {errorMessage}
              </p>
            )}
          </div>

          <form onSubmit={handleVerify} className="z-20 space-y-4 md:space-y-6">
            <div
              className={clsx(
                'relative rounded-xl transition-shadow duration-500',
                hasError ? 'shadow-[0_10px_40px_-10px_rgba(239,68,68,0.15)]' : ''
              )}
            >
              <input
                className={clsx(
                  'border-0 border-b-2 bg-transparent text-center text-lg transition-all outline-none placeholder:text-slate-800 focus:ring-0 md:py-6 md:text-4xl',
                  hasError
                    ? 'border-error-red/50 text-error-red focus:border-error-red'
                    : 'border-white/10 focus:border-white'
                )}
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col items-center gap-6 md:gap-8">
              <button
                type="submit"
                className="w-full rounded-full bg-white px-16 py-4 text-sm font-bold tracking-[0.2em] text-black uppercase shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-slate-200 active:scale-95 md:w-auto md:px-24 md:py-5"
              >
                Verify
              </button>

              <div className="flex flex-col items-center gap-4">
                <div
                  className={clsx(
                    'flex max-w-xs items-center gap-3 text-center transition-all',
                    hasError ? 'mt-4' : 'mt-0'
                  )}
                >
                  <span className="material-symbols-outlined text-sm text-slate-600">shield</span>
                  <p className="text-[10px] leading-relaxed tracking-widest text-slate-600 uppercase">
                    Secure Verification Required
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="z-20 text-center">
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setPassword('');
              onClose();
            }}
            className="cursor-pointer text-sm font-medium tracking-widest text-slate-500 uppercase opacity-40 transition-colors hover:text-white hover:opacity-100"
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  );
};
