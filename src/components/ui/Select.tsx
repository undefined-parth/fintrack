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

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selected = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  // close on outside click (because users click everywhere like chaos goblins)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus management
  useEffect(() => {
    if (open && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    } else if (!open) {
      buttonRef.current?.focus();
    }
  }, [open, focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev === 0 ? options.length - 1 : prev - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onChange(options[focusedIndex].value);
        setOpen(false);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleButtonClick = () => {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen) {
      setFocusedIndex(selectedIndex !== -1 ? selectedIndex : 0);
    }
  };

  return (
    <div ref={ref} className={`relative ${className || 'w-44'}`}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        aria-expanded={open}
        aria-haspopup="listbox"
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
        <div
          role="listbox"
          onKeyDown={handleKeyDown}
          className="animate-in fade-in zoom-in-95 absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container shadow-lg"
        >
          {options.map((opt, index) => {
            const active = focusedIndex === index;

            return (
              <div
                key={opt.value}
                ref={(el) => { optionRefs.current[index] = el; }}
                role="option"
                tabIndex={focusedIndex === index ? 0 : -1}
                aria-selected={active}
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
