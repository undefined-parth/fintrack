import { useState, useRef, useEffect } from 'react';

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
};

export default function Select({ value, onChange, options, placeholder = 'Select...', className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // close on outside click (because users click everywhere like chaos goblins)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref]);

  return (
    <div ref={ref} className={`relative ${className || 'w-44'}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2.5 text-xs font-semibold text-on-surface transition hover:bg-surface-variant/50"
      >
        <span className="truncate">{selected?.label || placeholder}</span>

        <span className={`flex items-center justify-center transition ${open ? 'rotate-180' : ''}`}>
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 7l5 5 5-5H5z" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="animate-in fade-in zoom-in-95 absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container shadow-lg">
          {options.map((opt) => {
            const active = opt.value === value;

            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`cursor-pointer px-4 py-2 text-xs font-medium transition ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-variant/50'
                } `}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
