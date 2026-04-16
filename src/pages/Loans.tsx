import Select from '@/components/ui/Select';
import { useMemo, useState } from 'react';
import IconPlus from '../assets/icons/IconPlus';
import { useLoanStore } from '../stores/useLoanStore';
import { useUserStore } from '../stores/useUserStore';
import type { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import AddLoanModal from '@/components/AddLoanModal';
import LoanHistoryModal from '@/components/LoanHistoryModal';
import SettlementModal from '@/components/SettlementModal';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Loans = () => {
  const { currentUser } = useUserStore();
  const { getLoansForUser, deleteLoan } = useLoanStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [settlementLoan, setSettlementLoan] = useState<Loan | null>(null);
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'given' | 'taken'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  const userId = currentUser?.id || '';
  const loans = getLoansForUser(userId);

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
    if (
      confirm(
        'Are you sure you want to delete this loan? All related transactions will also be deleted.'
      )
    ) {
      deleteLoan(id);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-8 pt-7 pb-10 font-sans text-on-surface">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.15em] text-outline uppercase">
              Track money you owe or are owed
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-on-background">
              Loans & Debts
            </h1>
          </div>
          <button
            onClick={() => {
              setEditingLoan(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold outline transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary hover:shadow-[0_1px_20px_-6px_rgba(121,157,255,0.6)] active:scale-95 sm:w-auto"
          >
            <IconPlus /> Add Loan
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="group relative flex-1">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 opacity-40">🔍</span>
            <input
              type="text"
              placeholder="Search by person name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-transparent bg-surface-container-low/80 py-3.5 pr-4 pl-12 text-sm font-medium text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:bg-surface-container focus:ring-4 focus:ring-primary/10 focus:outline-none"
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
              onChange={(val) => setStatusFilter(val as 'active' | 'closed' | 'all')}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Closed', value: 'closed' },
              ]}
            />
          </div>
        </div>

        {/* Table/Grid */}
        <div className="overflow-hidden">
          {filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-32 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container text-4xl opacity-20">
                🤝
              </div>
              <p className="text-xl font-bold text-on-surface">No loans found</p>
              <p className="mt-1 text-sm text-outline">
                Try adjusting your filters or add a new loan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLoans.map((loan) => {
                const isClosed = loan.status === 'closed';

                return (
                  <div
                    key={loan.id}
                    className={`group relative flex flex-col gap-4 rounded-3xl border transition-all ${
                      isClosed
                        ? 'border-outline-variant/10 bg-surface-container-low/50 opacity-60 grayscale-[0.5]'
                        : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'
                    } p-6`}
                  >
                    {isClosed && (
                      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12">
                        <div className="rounded-xl border-4 border-red-500 px-4 py-2 text-4xl font-black tracking-[0.2em] text-red-500 uppercase select-none">
                          Closed
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                            isClosed
                              ? 'bg-outline/10 text-outline'
                              : loan.type === 'given'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {loan.type === 'given' ? 'Given' : 'Taken'}
                        </span>
                        <h3 className="mt-2 text-lg font-bold text-on-surface">
                          {loan.personName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xl font-bold text-on-surface">
                          {formatCurrency(loan.remainingAmount, false)}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-outline uppercase">
                          Remaining of {formatCurrency(loan.totalAmount, false)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5 text-xs font-semibold text-outline">
                      <div className="flex justify-between">
                        <span>Started</span>
                        <span>{formatDate(loan.startDate)}</span>
                      </div>
                      {loan.dueDate && (
                        <div className="flex justify-between">
                          <span>Due Date</span>
                          <span
                            className={
                              !isClosed && new Date(loan.dueDate) < new Date() ? 'text-error' : ''
                            }
                          >
                            {formatDate(loan.dueDate)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span
                          className={`capitalize ${isClosed ? 'text-outline' : 'text-secondary'}`}
                        >
                          {loan.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-4">
                      <div className="flex gap-2">
                        {!isClosed && (
                          <button
                            onClick={() => {
                              setEditingLoan(loan);
                              setIsAddModalOpen(true);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-variant/30 text-outline transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                            title="Edit Loan"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(loan.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-variant/30 text-outline transition-all hover:bg-error-container/30 hover:text-error active:scale-90"
                          title="Delete Loan"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setHistoryLoan(loan)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-variant/30 text-lg text-outline transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
                          title="View History"
                        >
                          📋
                        </button>
                        {!isClosed && (
                          <button
                            onClick={() => setSettlementLoan(loan)}
                            className="flex h-9 w-12 items-center justify-center gap-1 rounded-xl bg-secondary px-2 text-on-secondary shadow-md shadow-secondary/20 transition-all hover:scale-105 active:scale-95"
                            title="Record Settlement"
                          >
                            <span className="text-lg">💰</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
};

export default Loans;
