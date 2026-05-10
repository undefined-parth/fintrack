import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Sidebar from '../Sidebar';
import type { User, Account } from '@/types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLogoutUser = vi.fn();
const mockNavigate = vi.fn();
const mockGetAccountsForUser = vi.fn();

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('@/stores/useAccountStore', () => ({
  useAccountStore: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Simplify framer-motion so tests don't need animation support
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

import { useUserStore } from '@/stores/useUserStore';
import { useAccountStore } from '@/stores/useAccountStore';

const mockUseUserStore = vi.mocked(useUserStore);
const mockUseAccountStore = vi.mocked(useAccountStore);

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Alice',
  password: 'secret',
  defaultCurrency: 'USD',
  currencyIcon: '$',
  avatar: 'https://example.com/avatar.jpg',
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  userId: 'user-1',
  name: 'Savings',
  type: 'bank',
  balance: 1000,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

function setupMocks(user: User | null, accounts: Account[] = []) {
  mockUseUserStore.mockReturnValue({
    currentUser: user,
    logoutUser: mockLogoutUser,
  } as ReturnType<typeof useUserStore>);

  mockGetAccountsForUser.mockReturnValue(accounts);
  mockUseAccountStore.mockReturnValue({
    getAccountsForUser: mockGetAccountsForUser,
  } as unknown as ReturnType<typeof useAccountStore>);
}

function renderSidebar(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks(createUser());
  });

  // ── Brand / Header ──────────────────────────────────────────────────────────

  describe('brand header', () => {
    it('renders FIN text in the heading', () => {
      renderSidebar();
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toContain('FIN');
    });

    it('renders TRACK text in the heading', () => {
      renderSidebar();
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('TRACK');
    });

    it('renders the Personal Finance Tracker subtitle', () => {
      renderSidebar();
      expect(screen.getByText('Personal Finance Tracker')).toBeInTheDocument();
    });

    it('renders the Cpu icon in the header area', () => {
      renderSidebar();
      // The Cpu icon is rendered by lucide-react as an SVG
      // It's the only icon at the top with animate-pulse class
      const aside = screen.getByRole('complementary');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const header = aside.querySelector('.animate-pulse');
      expect(header).toBeInTheDocument();
    });
  });

  // ── Navigation items ────────────────────────────────────────────────────────

  describe('navigation items', () => {
    it('renders all seven navigation labels', () => {
      renderSidebar();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Loans')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders nav links with correct href paths', () => {
      renderSidebar();
      const links = screen.getAllByRole('link');
      const hrefs = links.map((l) => l.getAttribute('href'));
      expect(hrefs).toContain('/dashboard');
      expect(hrefs).toContain('/transactions');
      expect(hrefs).toContain('/categories');
      expect(hrefs).toContain('/accounts');
      expect(hrefs).toContain('/loans');
      expect(hrefs).toContain('/reports');
      expect(hrefs).toContain('/settings');
    });

    it('does not use material-symbols spans for icons', () => {
      renderSidebar();
      // Old implementation used <span class="material-symbols-outlined">.
      // New implementation uses lucide-react SVG icons.
      const materialSpans = document.querySelectorAll('.material-symbols-outlined');
      expect(materialSpans).toHaveLength(0);
    });

    it('renders lucide-react SVG icons for navigation items', () => {
      renderSidebar();
      const nav = screen.getByRole('navigation');
      const svgs = nav.querySelectorAll('svg');
      // 7 nav items each have an icon + each nested NavLink may not have an svg
      expect(svgs.length).toBeGreaterThanOrEqual(7);
    });

    it('applies active styles to the current route link', () => {
      renderSidebar('/dashboard');
      // The active NavLink gets bg-primary/10 and border-primary/20 classes
      const links = screen.getAllByRole('link');
      const dashboardLinks = links.filter((l) => l.getAttribute('href') === '/dashboard');
      const activeLink = dashboardLinks.find((l) =>
        l.className.includes('bg-primary/10')
      );
      expect(activeLink).toBeDefined();
    });

    it('applies inactive styles to non-current route links', () => {
      renderSidebar('/dashboard');
      const links = screen.getAllByRole('link');
      // transactions link should be inactive
      const transactionsLink = links.find(
        (l) =>
          l.getAttribute('href') === '/transactions' &&
          l.className.includes('border-transparent')
      );
      expect(transactionsLink).toBeDefined();
    });

    it('reports label was updated from Reports to Analytics', () => {
      renderSidebar();
      // Verify the label changed from 'Reports' to 'Analytics' as per the PR diff
      expect(screen.queryByText('Reports')).not.toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  // ── User card ───────────────────────────────────────────────────────────────

  describe('user card', () => {
    it('renders the current user name', () => {
      setupMocks(createUser({ name: 'Alice' }));
      renderSidebar();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders the user avatar image', () => {
      setupMocks(createUser({ avatar: 'https://example.com/avatar.jpg' }));
      renderSidebar();
      const img = screen.getByAltText('User Profile');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders the currency icon', () => {
      setupMocks(createUser({ currencyIcon: '€' }));
      renderSidebar();
      // The currency icon is rendered inline next to net worth
      const aside = screen.getByRole('complementary');
      expect(aside.textContent).toContain('€');
    });

    it('renders the LogOut icon in the logout button', () => {
      renderSidebar();
      const logoutButton = screen.getByTitle('Logout');
      expect(logoutButton).toBeInTheDocument();
      // LogOut icon is an SVG inside the button
      const svg = logoutButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders the logout button with correct title', () => {
      renderSidebar();
      expect(screen.getByTitle('Logout')).toBeInTheDocument();
    });

    it('does not crash when currentUser is null', () => {
      setupMocks(null);
      expect(() => renderSidebar()).not.toThrow();
    });

    it('renders the component when currentUser is null without showing a name', () => {
      setupMocks(null);
      renderSidebar();
      // Brand heading should still appear
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  // ── Net worth display ───────────────────────────────────────────────────────

  describe('net worth display', () => {
    it('displays net worth of 0 when user has no accounts', () => {
      setupMocks(createUser({ currencyIcon: '$' }), []);
      renderSidebar();
      // getNetWorth returns 0, toLocaleString on 0 → '0'
      const aside = screen.getByRole('complementary');
      expect(aside.textContent).toContain('$0');
    });

    it('displays net worth summed from multiple accounts', () => {
      const accounts = [
        createAccount({ id: 'acc-1', balance: 500 }),
        createAccount({ id: 'acc-2', balance: 1500 }),
      ];
      setupMocks(createUser({ currencyIcon: '$' }), accounts);
      renderSidebar();
      // Sum = 2000, toLocaleString → '2,000' or '2000' depending on locale
      const aside = screen.getByRole('complementary');
      expect(aside.textContent).toContain('$');
      // Should contain digits for 2000
      expect(aside.textContent).toMatch(/2[,.]?000/);
    });

    it('calls getAccountsForUser with current user id', () => {
      const user = createUser({ id: 'user-123' });
      setupMocks(user, []);
      renderSidebar();
      expect(mockGetAccountsForUser).toHaveBeenCalledWith('user-123');
    });

    it('displays 0 net worth when no user id is available', () => {
      setupMocks(null);
      renderSidebar();
      // getNetWorth(undefined) → returns 0
      expect(mockGetAccountsForUser).not.toHaveBeenCalled();
    });

    it('uses toLocaleString formatting for net worth', () => {
      // 1000000 should be formatted with locale separators
      const accounts = [createAccount({ balance: 1000000 })];
      setupMocks(createUser({ currencyIcon: '₹' }), accounts);
      renderSidebar();
      const aside = screen.getByRole('complementary');
      // toLocaleString should produce something like 1,000,000
      expect(aside.textContent).not.toContain('1000000');
    });
  });

  // ── Logout handler ──────────────────────────────────────────────────────────

  describe('logout handler', () => {
    it('calls logoutUser when logout button is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByTitle('Logout'));
      expect(mockLogoutUser).toHaveBeenCalledTimes(1);
    });

    it('navigates to / when logout button is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByTitle('Logout'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('calls logoutUser before navigating', async () => {
      const callOrder: string[] = [];
      mockLogoutUser.mockImplementation(() => callOrder.push('logout'));
      mockNavigate.mockImplementation(() => callOrder.push('navigate'));

      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByTitle('Logout'));

      expect(callOrder).toEqual(['logout', 'navigate']);
    });
  });

  // ── Framer-motion integration ───────────────────────────────────────────────

  describe('framer-motion active indicator', () => {
    it('renders an active indicator for the active route', () => {
      renderSidebar('/dashboard');
      // motion.div with layoutId="activeIndicator" is mocked as a plain div.
      // It's only rendered when the NavLink is active.
      // The indicator has bg-primary class.
      const aside = screen.getByRole('complementary');
      const indicators = aside.querySelectorAll('[class*="bg-primary"][class*="rounded-full"]');
      expect(indicators.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Layout structure ────────────────────────────────────────────────────────

  describe('layout structure', () => {
    it('renders as an aside element', () => {
      renderSidebar();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('renders a navigation element', () => {
      renderSidebar();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders the background glow div', () => {
      renderSidebar();
      const aside = screen.getByRole('complementary');
      const glow = aside.querySelector('.blur-\\[80px\\]');
      expect(glow).toBeInTheDocument();
    });

    it('renders inline style for text-outline-variant', () => {
      renderSidebar();
      // The component injects a <style> tag for .text-outline-variant
      const styleTag = document.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('text-outline-variant');
    });
  });

  // ── navItems structure (PR change: icon component vs iconName string) ────────

  describe('navItems use React components not icon name strings', () => {
    it('renders icon SVGs in nav items instead of text-based icon names', () => {
      renderSidebar();
      const nav = screen.getByRole('navigation');
      // Each nav item should render an SVG from lucide-react
      const svgs = nav.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(7);
    });

    it('does not render iconName strings like "dashboard" as text', () => {
      renderSidebar();
      // Old implementation rendered <span>dashboard</span>, <span>receipt_long</span>, etc.
      // Ensure these are not present
      expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('receipt_long')).not.toBeInTheDocument();
      expect(screen.queryByText('category')).not.toBeInTheDocument();
      expect(screen.queryByText('account_balance_wallet')).not.toBeInTheDocument();
      expect(screen.queryByText('payments')).not.toBeInTheDocument();
      expect(screen.queryByText('analytics')).not.toBeInTheDocument();
      expect(screen.queryByText('settings')).not.toBeInTheDocument();
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles an account with undefined balance without crashing', () => {
      // Credit accounts have no balance field - Number(undefined) = NaN
      const creditAccount = createAccount({
        type: 'credit',
        balance: undefined,
        limit: 5000,
        used: 1000,
      });
      setupMocks(createUser(), [creditAccount]);
      expect(() => renderSidebar()).not.toThrow();
    });

    it('handles an empty accounts array gracefully', () => {
      setupMocks(createUser(), []);
      renderSidebar();
      const aside = screen.getByRole('complementary');
      // Should show 0 net worth
      expect(aside.textContent).toContain('0');
    });

    it('renders correctly with a user who has no avatar', () => {
      setupMocks(createUser({ avatar: undefined }));
      expect(() => renderSidebar()).not.toThrow();
    });

    it('getNetWorth is called once per render', () => {
      setupMocks(createUser({ id: 'user-1' }), [createAccount()]);
      renderSidebar();
      expect(mockGetAccountsForUser).toHaveBeenCalledTimes(1);
    });

    it('renders correctly on a non-matching route (no active indicator)', () => {
      renderSidebar('/some/unknown/path');
      // No nav item should be active, so no active classes
      const links = screen.getAllByRole('link');
      const activeLinks = links.filter((l) => l.className.includes('bg-primary/10'));
      expect(activeLinks).toHaveLength(0);
    });
  });
});