import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

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

  // Close on outside click
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
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
          setOpen(false);
        }
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
    <div ref={ref} className={`relative ${className || 'w-full'}`}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-xs font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container-high focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          size={14}
          className={`text-outline/70 transition-transform duration-250 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="custom-scrollbar absolute right-0 left-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-outline-variant/15 bg-surface-container-high p-1 shadow-2xl"
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isFocused = focusedIndex === index;

              return (
                <div
                  key={opt.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all select-none ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : isFocused
                        ? 'bg-surface-container-highest/60 text-on-surface'
                        : 'text-on-surface-variant hover:bg-surface-container-highest/40 hover:text-on-surface'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={12} className="ml-2 shrink-0 text-primary" />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
