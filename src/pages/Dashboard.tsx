import DashboardAccountSnapshotCard from '@/components/DashboardAccountSnapshotCard';
import DashboardLoanSnapshotCard from '@/components/DashboardLoanSnapshotCard';
import DashboardStatsCard from '@/components/DashboardStatsCard';
import DashboardTransactionListItem from '@/components/DashboardTransactionListItem';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useLoanStore } from '@/stores/useLoanStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Loan, Transaction } from '@/types';
import { Link } from 'react-router';

const Dashboard = () => {
  const { currentUser } = useUserStore();
  const { getTransactionsForUser } = useTransactionStore();
  const { getAccountsForUser } = useAccountStore();
  const { getActiveLoans } = useLoanStore();
  const { getAllCategories } = useCategoryStore();

  const userId = currentUser?.id ?? '';
  const transactions = getTransactionsForUser(userId);
  const accounts = getAccountsForUser(userId);
  const activeLoans = getActiveLoans(userId);
  const categories = getAllCategories(userId);

  const currencyIcon = currentUser?.currencyIcon;

  const getTotalIncome = (Transactions: Transaction[]) => {
    const incomeTransactions = Transactions.filter((transaction) => transaction.type === 'income');
    return incomeTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  };

  const getTotalExpense = (Transactions: Transaction[]) => {
    const expenseTransactions = Transactions.filter(
      (transaction) => transaction.type === 'expense'
    );
    return expenseTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  };

  const getLoanTaken = (Loans: Loan[]) => {
    const loanTaken = Loans.filter((loan) => loan.type === 'taken');
    return loanTaken.reduce((total, loan) => total + loan.totalAmount, 0);
  };

  const getLoanGiven = (Loans: Loan[]) => {
    const loanTaken = Loans.filter((loan) => loan.type === 'given');
    return loanTaken.reduce((total, loan) => total + loan.totalAmount, 0);
  };

  const DashboardCards = [
    {
      title: 'Total Income',
      value: getTotalIncome(transactions),
    },
    {
      title: 'Total Expense',
      value: getTotalExpense(transactions),
    },
    {
      title: 'Total Loan Taken',
      value: getLoanTaken(activeLoans),
    },
    {
      title: 'Total Loan Given',
      value: getLoanGiven(activeLoans),
    },
  ];

  return (
    <div className="h-screen bg-background px-8 pt-6">
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        {DashboardCards.map((card) => (
          <DashboardStatsCard
            key={card.title}
            cardTitle={card.title}
            currencyIcon={currencyIcon!}
            Value={card.value}
          />
        ))}
      </div>

      {/* <!-- Main Dashboard Split Layout --> */}
      <div className="grid grid-cols-12 gap-8">
        {/* <!-- Left: Top Transactions (8 cols) --> */}
        <div className="col-span-12 lg:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-on-background">
              Top Transactions
            </h3>
            <Link
              to="/transactions"
              className="text-xs font-bold tracking-widest text-primary uppercase hover:underline"
            >
              View All
            </Link>
          </div>

          {/* <!-- Transaction List --> */}

          <div className="space-y-4">
            {transactions.length > 0 &&
              transactions
                .slice(0, 4)
                .map((transaction) => (
                  <DashboardTransactionListItem
                    key={transaction.id}
                    transaction={transaction}
                    categories={categories}
                  />
                ))}
          </div>
        </div>
        {/* <!-- Right: Account Snapshots (4 cols) --> */}
        <div className="col-span-12 space-y-8 lg:col-span-4">
          <div>
            <h3 className="mb-6 text-lg font-bold tracking-tight text-on-background">
              Account Snapshots
            </h3>
            <div className="space-y-6">
              {accounts.map((account) => (
                <DashboardAccountSnapshotCard key={account.id} a={account} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-6 text-lg font-bold tracking-tight text-on-background">
              Loans Snapshots
            </h3>
            <div className="space-y-6">
              {activeLoans.map((loan) => (
                <DashboardLoanSnapshotCard key={loan.id} l={loan} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
