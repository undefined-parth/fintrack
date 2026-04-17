import { useAccountStore } from '@/stores/useAccountStore';
import { useUserStore } from '@/stores/useUserStore';
import { NavLink, useNavigate } from 'react-router';

const Sidebar = () => {
  const { currentUser, logoutUser } = useUserStore();
  const { getAccountsForUser } = useAccountStore();
  const navigate = useNavigate();

  const activeClass =
    'flex items-center rounded-lg bg-surface-container px-4 py-2 font-bold text-white transition-all';
  const inactiveClass =
    'flex items-center rounded-lg px-4 py-2 text-on-surface-variant transition-all hover:bg-surface-container hover:text-white';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { path: '/transactions', label: 'Transactions', iconName: 'receipt_long' },
    { path: '/categories', label: 'Categories', iconName: 'category' },
    { path: '/accounts', label: 'Accounts', iconName: 'account_balance_wallet' },
    { path: '/loans', label: 'Loans', iconName: 'payments' },
    { path: '/reports', label: 'Reports', iconName: 'analytics' },
    { path: '/settings', label: 'Settings', iconName: 'settings' },
  ];

  const getNetWorth = (id: string | undefined): number => {
    if (!id) return 0;
    const accounts = getAccountsForUser(id);
    return accounts.reduce((acc, a) => acc + Number(a.balance!), 0);
  };

  const handleLogout = () => {
    logoutUser();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    navigate('/');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? activeClass : inactiveClass;

  return (
    <aside className="relative flex h-screen w-64 flex-col justify-between border-r-0 bg-surface-container-low px-2 py-3 shadow-none">
      <div>
        <div className="mt-2 mb-6 px-4">
          <h1 className="font-['Inter'] text-2xl font-bold tracking-tighter text-white uppercase underline decoration-primary decoration-2 underline-offset-1 select-none">
            FinTrack
          </h1>
          <p className="text-sm font-medium text-on-surface-variant">
            Welcome, {currentUser?.name}
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink className={navClass} to={item.path} key={item.path}>
              <span className="material-symbols-outlined mr-3">{item.iconName}</span>
              <span className="font-['Inter'] text-sm font-medium tracking-wide uppercase">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="w-full border-t border-outline-variant/10 pt-2">
        <div className="flex items-center space-x-3 rounded-xl bg-surface-container px-4 py-3">
          <img
            alt="User Profile Avatar"
            className="h-8 w-8 rounded-full bg-surface-container-highest"
            data-alt="professional corporate profile portrait of a financial analyst in a dark suit with a neutral background"
            src={currentUser?.avatar}
          />
          <div className="overflow-hidden">
            <p className="truncate text-xs font-bold text-primary">{currentUser?.name}</p>
            <p className="text-[10px] text-on-surface-variant">
              Net Worth: {currentUser?.currencyIcon}
              {getNetWorth(currentUser?.id)}
            </p>
          </div>
          <button
            type="button"
            className="ml-auto text-on-surface-variant"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
