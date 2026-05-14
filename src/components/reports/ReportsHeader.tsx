import { memo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Download } from 'lucide-react';

interface ReportsHeaderProps {
  timeRange: number;
  setTimeRange: (range: number) => void;
}

export const ReportsHeader = memo(({ timeRange, setTimeRange }: ReportsHeaderProps) => {
  return (
    <header className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 backdrop-blur-3xl">
            <Cpu className="animate-spin-slow h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs leading-none font-black tracking-[0.6em] text-primary uppercase">
              Intelligence.Node
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-widest text-outline uppercase">
              Status: Deep Scan Active
            </p>
          </div>
        </div>
        <h1 className="text-7xl leading-[0.85] font-black tracking-tighter text-on-background uppercase">
          Reports <span className="block text-outline-variant italic opacity-30">Center</span>
        </h1>
        <p className="mt-4 text-sm font-medium text-outline/60 italic">
          Understand where every rupee goes.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          aria-label="Export reports data"
          className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/3 px-6 py-3 text-[11px] font-black tracking-widest text-outline backdrop-blur-3xl transition-all hover:text-primary"
        >
          {/* TODO: Add export functionality */}
          <Download size={16} /> EXPORT
        </button>
        <div className="flex rounded-2xl border border-white/5 bg-white/2 p-1.5 shadow-inner backdrop-blur-3xl">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setTimeRange(m)}
              aria-pressed={timeRange === m}
              aria-label={`${m} month time range`}
              className={`relative px-8 py-2.5 text-xs font-black tracking-[0.2em] uppercase transition-all ${timeRange === m ? 'text-on-primary' : 'text-outline hover:text-white'}`}
            >
              {timeRange === m && (
                <motion.div
                  layoutId="range"
                  className="absolute inset-0 rounded-xl bg-primary shadow-[0_0_25px_rgba(121,157,255,0.4)]"
                />
              )}
              <span className="relative z-10">{m}M Range</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
});

ReportsHeader.displayName = 'ReportsHeader';
