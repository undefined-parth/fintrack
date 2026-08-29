import Select from '@/components/ui/Select';
import { useMemo, useState } from 'react';
import { useLoanStore } from '../stores/useLoanStore';
import { useUserStore } from '../stores/useUserStore';
import type { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import AddLoanModal from '@/components/AddLoanModal';
import LoanHistoryModal from '@/components/LoanHistoryModal';
import SettlementModal from '@/components/SettlementModal';
import LoanDetailsModal from '@/components/LoanDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  Coins,
  Search,
  Plus,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
} from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoanCardProps {
  loan: Loan;
  onEdit: (loan: Loan) => void;
  onDelete: (id: string) => void;
  onDefault: (id: string) => void;
  onHistory: (loan: Loan) => void;
  onSettlement: (loan: Loan) => void;
  onDetails: (loan: Loan) => void;
  defaultCurrency?: string;
}

const LoanCard = ({
  loan,
  onEdit,
  onDelete,
  onDefault,
  onHistory,
  onSettlement,
  onDetails,
  defaultCurrency,
}: LoanCardProps) => {
  const [confirmState, setConfirmState] = useState<'none' | 'delete' | 'default'>('none');
  const [copied, setCopied] = useState(false);

  const isClosed = loan.status === 'closed';
  const isDefaulted = loan.status === 'defaulted';
  const isInactive = isClosed || isDefaulted;
  const isGiven = loan.type === 'given';

  const isOverdue = !isInactive && loan.dueDate && new Date(loan.dueDate) < new Date();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(loan.personName).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={() => onDetails(loan)}
      className={`group relative flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border p-6 transition-all duration-250 hover:-translate-y-1 ${
        isInactive
          ? isDefaulted
            ? 'border-tertiary/20 bg-surface-container/40 opacity-70 grayscale-[0.3]'
            : 'border-outline-variant/10 bg-surface-container/40 opacity-70 grayscale-[0.3]'
          : isGiven
            ? 'border-outline-variant/15 bg-surface-container hover:border-secondary/35 hover:shadow-lg hover:shadow-secondary/5'
            : 'border-outline-variant/15 bg-surface-container hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5'
      }`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                isInactive
                  ? 'bg-outline/10 text-outline'
                  : isGiven
                    ? 'bg-secondary/15 text-secondary'
                    : 'bg-primary/15 text-primary'
              }`}
            >
              {isGiven ? 'Given' : 'Taken'}
            </span>
            {isInactive && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                  isDefaulted ? 'bg-tertiary/15 text-tertiary' : 'bg-outline/15 text-outline'
                }`}
              >
                {loan.status}
              </span>
            )}
            {isOverdue && (
              <span className="animate-pulse rounded-full bg-tertiary/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-tertiary uppercase">
                Overdue
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-on-surface">
              {formatCurrency(loan.remainingAmount, false, defaultCurrency)}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-on-surface-variant/60 uppercase">
              of {formatCurrency(loan.totalAmount, false, defaultCurrency)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <h3 className="max-w-[80%] truncate text-base font-bold text-on-surface">
            {loan.personName}
          </h3>
          <button
            onClick={handleCopy}
            className="rounded-md p-1 text-on-surface-variant/30 transition-colors hover:bg-surface-container-high hover:text-on-surface"
            title="Copy person's name"
            aria-label="Copy person's name"
          >
            {copied ? <Check size={12} className="text-secondary" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Card Details */}
      <div className="mt-1 flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
        <div className="flex justify-between">
          <span className="opacity-60">Started</span>
          <span className="font-mono">{formatDate(loan.startDate)}</span>
        </div>
        {loan.interestRate !== undefined && (
          <div className="flex justify-between">
            <span className="opacity-60">Interest Rate</span>
            <span className="font-mono">{loan.interestRate}% p.a.</span>
          </div>
        )}
        {loan.dueDate && (
          <div className="flex justify-between">
            <span className="opacity-60">Due Date</span>
            <span className={`font-mono ${isOverdue ? 'font-bold text-tertiary' : ''}`}>
              {formatDate(loan.dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* Card Actions / Inline confirmation state */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 flex min-h-10 items-center justify-between border-t border-outline-variant/10 pt-4"
      >
        {confirmState === 'none' ? (
          <>
            <div className="flex gap-2">
              {!isInactive && (
                <>
                  <button
                    onClick={() => onEdit(loan)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-highest/40 text-on-surface-variant transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                    aria-label="Edit Loan"
                    title="Edit Loan"
                  >
                    <Edit2 size={14} />
                  </button>
                  {isGiven && (
                    <button
                      onClick={() => setConfirmState('default')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-highest/40 text-tertiary transition-all hover:bg-tertiary/10 hover:text-tertiary active:scale-90"
                      aria-label="Mark as Defaulted"
                      title="Mark as Defaulted"
                    >
                      <AlertTriangle size={14} />
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setConfirmState('delete')}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-highest/40 text-on-surface-variant transition-all hover:bg-tertiary/10 hover:text-tertiary active:scale-90"
                aria-label="Delete Loan"
                title="Delete Loan"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onHistory(loan)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-highest/40 text-on-surface-variant transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                aria-label="View History"
                title="View History"
              >
                <History size={14} />
              </button>
              {!isInactive && (
                <button
                  onClick={() => onSettlement(loan)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-secondary px-3.5 text-xs font-semibold text-on-secondary shadow-sm transition-all duration-200 hover:bg-secondary-dim active:scale-95"
                  aria-label="Record Settlement"
                  title="Record Settlement"
                >
                  <Coins size={13} />
                  <span>Settle</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="animate-fade-in flex w-full items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-highest/30 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
              <AlertTriangle size={13} className="text-warning" />
              {confirmState === 'delete' ? 'Delete loan?' : 'Mark defaulted?'}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConfirmState('none')}
                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmState === 'delete') {
                    onDelete(loan.id);
                  } else {
                    onDefault(loan.id);
                  }
                  setConfirmState('none');
                }}
                className="rounded-lg bg-tertiary px-2.5 py-1 text-[11px] font-bold text-on-tertiary transition-opacity hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Loans = () => {
  const { currentUser } = useUserStore();
  const { getLoansForUser, deleteLoan, markAsDefaulted } = useLoanStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [settlementLoan, setSettlementLoan] = useState<Loan | null>(null);
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);
  const [detailsLoan, setDetailsLoan] = useState<Loan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'given' | 'taken'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'defaulted'>(
    'all'
  );

  const userId = currentUser?.id || '';
  const loans = getLoansForUser(userId);

  // ─── Calculations for Layout summary cards ──────────────────────────────────
  const activeGivenAmount = useMemo(() => {
    return loans
      .filter((l) => l.type === 'given' && l.status === 'active')
      .reduce((s, l) => s + l.remainingAmount, 0);
  }, [loans]);

  const activeTakenAmount = useMemo(() => {
    return loans
      .filter((l) => l.type === 'taken' && l.status === 'active')
      .reduce((s, l) => s + l.remainingAmount, 0);
  }, [loans]);

  const filteredLoans = useMemo(() => {
    return loans
      .filter((l) => {
        const matchesSearch = l.personName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || l.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [loans, searchQuery, typeFilter, statusFilter]);

  const handleDelete = (id: string) => {
    deleteLoan(id);
  };

  const handleDefault = (id: string) => {
    const res = markAsDefaulted(id);
    if (!res.ok) alert(res.error);
  };

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-12 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-on-surface">
              Loans & Debts
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">Track money you owe or are owed</p>
          </div>
          <button
            onClick={() => {
              setEditingLoan(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-dim active:scale-[0.98] sm:w-auto"
          >
            <Plus size={16} /> Add Loan
          </button>
        </div>

        {/* Layout Highlight Panel: Given vs Taken totals */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-colors hover:border-secondary/20">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-secondary opacity-50" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                  Money Given (Receivable)
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-on-surface">
                  {formatCurrency(activeGivenAmount, false, currentUser?.defaultCurrency)}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/10 p-2 text-secondary">
                <ArrowUpRight size={18} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container p-5 transition-colors hover:border-primary/20">
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-primary opacity-50" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                  Money Taken (Payable)
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-on-surface">
                  {formatCurrency(activeTakenAmount, false, currentUser?.defaultCurrency)}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ArrowDownRight size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="group relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-outline/50 transition-colors group-focus-within:text-primary/70" />
            <input
              type="text"
              placeholder="Search by person name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container py-3.5 pr-4 pl-12 text-sm font-medium text-on-surface transition-all duration-200 placeholder:text-outline/50 focus:border-primary/40 focus:bg-surface-container focus:ring-4 focus:ring-primary/10 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as 'all' | 'given' | 'taken')}
              options={[
                { label: 'All Types', value: 'all' },
                { label: 'Money Given', value: 'given' },
                { label: 'Money Taken', value: 'taken' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as 'active' | 'closed' | 'defaulted' | 'all')}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Closed', value: 'closed' },
                { label: 'Defaulted', value: 'defaulted' },
              ]}
            />
          </div>
        </div>

        {/* Table/Grid with AnimatePresence layout transitions */}
        <div className="min-h-75 overflow-hidden">
          {filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface-container text-on-surface-variant">
                <Info size={20} className="animate-pulse text-outline" />
              </div>
              <p className="text-base font-bold text-on-surface">No loans found</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Try adjusting your filters or add a new loan
              </p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredLoans.map((loan) => (
                  <motion.div
                    key={loan.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 240 }}
                  >
                    <LoanCard
                      loan={loan}
                      defaultCurrency={currentUser?.defaultCurrency}
                      onEdit={(l) => {
                        setEditingLoan(l);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={handleDelete}
                      onDefault={handleDefault}
                      onHistory={setHistoryLoan}
                      onSettlement={setSettlementLoan}
                      onDetails={setDetailsLoan}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLoan(null);
        }}
        editingLoan={editingLoan}
      />
      <SettlementModal
        isOpen={!!settlementLoan}
        onClose={() => setSettlementLoan(null)}
        loan={settlementLoan}
      />
      <LoanHistoryModal
        isOpen={!!historyLoan}
        onClose={() => setHistoryLoan(null)}
        loan={historyLoan}
      />
      <LoanDetailsModal
        isOpen={!!detailsLoan}
        onClose={() => setDetailsLoan(null)}
        loan={detailsLoan}
      />
    </div>
  );
};

export default Loans;
