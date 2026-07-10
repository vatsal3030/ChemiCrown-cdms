import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Settings, Menu, Users,
  ClipboardCheck, LogOut, ChevronUp, UserPlus, Store,
  Trash2, CheckSquare, Heart, TrendingUp,
  Boxes, ClipboardList,
  FileText, Wallet, CalendarDays,
  UserCheck, Activity, HelpCircle, Bug, Shield, MessageSquare,
  Sun, Moon, Archive, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Search } from 'lucide-react';

// Navigation structure with sections for role-based grouping
const buildNavSections = (role, customerMode = false) => {
  const sections = [];

  // OVERVIEW section
  const overview = { label: 'Overview', items: [] };
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'SALES', 'MARKETING', 'DIGITAL_MARKETING'].includes(role)) {
    overview.items.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true });
  }
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(role)) {
    overview.items.push({ name: 'Analytics Hub', path: '/dashboard/analytics', icon: BarChart2 });
  }
  if (['SUPER_ADMIN', 'OWNER'].includes(role)) {
    overview.items.push({ name: 'Finance', path: '/dashboard/finance', icon: TrendingUp });
  }
  if (overview.items.length) sections.push(overview);

  // CATALOG section (customer)
  if (role === 'CUSTOMER') {
    sections.push({
      label: 'Shopping',
      items: [
        { name: 'Product Catalog', path: '/dashboard/catalog', icon: Store },
        { name: 'My Cart', path: '/dashboard/cart', icon: ShoppingCart },
        { name: 'My Wishlist', path: '/dashboard/wishlist', icon: Heart },
        { name: 'My Orders', path: '/dashboard/orders', icon: ClipboardList },
      ]
    });
  } else if (customerMode && ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'MARKETING', 'DIGITAL_MARKETING', 'INVENTORY_MANAGER'].includes(role)) {
    sections.push({
      label: 'Customer Features',
      items: [
        { name: 'Product Catalog', path: '/dashboard/catalog', icon: Store },
        { name: 'My Cart', path: '/dashboard/cart', icon: ShoppingCart },
        { name: 'My Wishlist', path: '/dashboard/wishlist', icon: Heart },
        { name: 'My Orders', path: '/dashboard/my-orders', icon: ClipboardList },
      ]
    });
  }

  // OPERATIONS section
  const ops = { label: 'Operations', items: [] };
  if (!customerMode && ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'SALES'].includes(role)) {
    ops.items.push({ name: 'Product Catalog', path: '/dashboard/catalog', icon: Store });
  }
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'MARKETING', 'DIGITAL_MARKETING'].includes(role)) {
    ops.items.push({ name: 'Orders', path: '/dashboard/orders', icon: ClipboardList });
  }
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER'].includes(role)) {
    ops.items.push({ name: 'Inventory', path: '/dashboard/inventory', icon: Boxes });
    ops.items.push({ name: 'Lot/Batch Tracking', path: '/dashboard/inventory/lots', icon: Archive });
    ops.items.push({ name: 'Stock History', path: '/dashboard/stock-history', icon: Activity });
  }
  if (ops.items.length) sections.push(ops);

  // PEOPLE section
  const people = { label: 'People', items: [] };
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(role)) {
    people.items.push({ name: 'HR Management', path: '/dashboard/hr', icon: Users, exact: true });
    people.items.push({ name: 'Attendance Register', path: '/dashboard/hr/attendance', icon: ClipboardCheck });
    people.items.push({ name: 'Payroll', path: '/dashboard/payroll', icon: Wallet });
    people.items.push({ name: 'Holiday Calendar', path: '/dashboard/holidays', icon: CalendarDays });
  }
  // Tasks visible to all staff
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING'].includes(role)) {
    people.items.push({ name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare });
  }
  if (['SUPER_ADMIN', 'OWNER'].includes(role)) {
    people.items.push({ name: 'Verify Customers', path: '/dashboard/verify', icon: UserCheck });
  }
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING'].includes(role)) {
    people.items.push({ name: 'My Attendance', path: '/dashboard/me', icon: ClipboardCheck });
    people.items.push({ name: 'My Payslips', path: '/dashboard/my-payroll', icon: FileText });
  }
  if (people.items.length) sections.push(people);

  // SYSTEM section
  const sys = { label: 'System', items: [] };
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(role)) {
    sys.items.push({ name: 'Recycle Bin', path: '/dashboard/recycle-bin', icon: Trash2 });
    sys.items.push({ name: 'Support Tickets', path: '/dashboard/tickets', icon: MessageSquare });
  }
  if (['SUPER_ADMIN', 'OWNER'].includes(role)) {
    sys.items.push({ name: 'Audit Logs', path: '/dashboard/audit-log', icon: Shield });
  }
  // Support & Report — all staff
  sys.items.push({ name: 'Help & Support', path: '/dashboard/support', icon: HelpCircle });
  sys.items.push({ name: 'Report Issue', path: '/dashboard/report-issue', icon: Bug });
  sys.items.push({ name: 'Settings', path: '/dashboard/settings', icon: Settings });
  sections.push(sys);

  return sections;
};

// Map of icon name → hover animation class
const ICON_ANIMATIONS = {
  Settings: 'group-hover:rotate-45',
  Wallet: 'group-hover:scale-110 group-hover:-translate-y-0.5',
  TrendingUp: 'group-hover:-translate-y-1',
  Boxes: 'group-hover:scale-110 group-hover:-translate-y-0.5',
  Activity: 'group-hover:scale-110',
  Users: 'group-hover:scale-105',
  CheckSquare: 'group-hover:-rotate-6',
  UserCheck: 'group-hover:scale-110',
  ClipboardCheck: 'group-hover:rotate-3',
  FileText: 'group-hover:-translate-y-0.5 group-hover:scale-105',
  Trash2: 'group-hover:rotate-6',
  Store: 'group-hover:scale-110',
  ClipboardList: 'group-hover:-translate-y-0.5',
  Heart: 'group-hover:scale-125',
  ShoppingCart: 'group-hover:scale-110 group-hover:-translate-y-0.5',
  LayoutDashboard: 'group-hover:scale-105',
  HelpCircle: 'group-hover:rotate-12',
  Bug: 'group-hover:scale-110 group-hover:-rotate-6',
  Shield: 'group-hover:scale-110',
  MessageSquare: 'group-hover:scale-105 group-hover:-translate-y-0.5',
  Archive: 'group-hover:scale-110',
  BarChart2: 'group-hover:scale-110 group-hover:-translate-y-0.5',
};

function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  let isActive = false;
  if (item.exact) {
    isActive = location.pathname === item.path;
  } else {
    if (item.name === 'Inventory') {
      // Prevent /dashboard/inventory from matching /dashboard/inventory/lots
      isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/product');
    } else if (item.name === 'HR Management') {
      // Prevent /dashboard/hr from matching /dashboard/hr/attendance
      isActive = location.pathname === item.path || location.pathname.match(/^\/dashboard\/hr\/\d+$/);
    } else {
      isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }
  }
  const Icon = item.icon;
  const iconAnim = ICON_ANIMATIONS[item.icon?.displayName || item.icon?.name] || 'group-hover:scale-110';

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.name : undefined}
      className={`sidebar-item group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon size={18} className={`shrink-0 transition-transform duration-300 ease-in-out ${iconAnim}`} />
      {!collapsed && <span className="truncate">{item.name}</span>}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {item.badge}
        </span>
      )}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
      )}
    </Link>
  );
}

import { useCart } from '../context/CartContext';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, storedAccounts, logout, logoutAll, switchAccount } = useAuth();
  const { cartItems } = useCart();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [customerMode, setCustomerMode] = useState(() => localStorage.getItem('customerMode') !== 'false');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const switcherRef = useRef(null);
  const themeToggleRef = useRef(null);

  useKeyboardShortcuts(setSearchModalOpen);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  // Apply dark mode class on initial mount only
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wave animation theme toggle using View Transition API
  const handleThemeToggle = () => {
    const newDark = !darkMode;

    // Calculate animation origin from the toggle button's position
    const rect = themeToggleRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 32;

    // Set CSS custom properties for clip-path origin
    document.documentElement.style.setProperty('--tt-x', `${x}px`);
    document.documentElement.style.setProperty('--tt-y', `${y}px`);

    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', newDark);
    };

    if (document.startViewTransition) {
      const transition = document.startViewTransition(applyTheme);
      transition.finished.then(() => {
        document.documentElement.style.removeProperty('--tt-x');
        document.documentElement.style.removeProperty('--tt-y');
      });
    } else {
      applyTheme();
    }

    setDarkMode(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setCustomerMode(localStorage.getItem('customerMode') !== 'false');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close account switcher on outside click
  useEffect(() => {
    const handler = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setShowAccountSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const navSections = buildNavSections(user.role, customerMode);
  
  // Add badge to My Cart
  navSections.forEach(section => {
    section.items.forEach(item => {
      if (item.name === 'My Cart') {
        item.badge = cartItems.length;
      }
    });
  });

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  const roleLabel = user.role.replace(/_/g, ' ');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 h-full min-h-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-[72px]' : 'w-64'}`}
        style={{ background: 'var(--sidebar)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Logo — click to go to public home page */}
        <Link
          to="/"
          className={`h-16 flex items-center border-b shrink-0 hover:opacity-80 transition-opacity cursor-pointer ${
            collapsed ? 'justify-center px-4' : 'px-5 gap-3'
          }`}
          style={{ borderColor: 'rgba(255,255,255,0.08)', textDecoration: 'none' }}
          title="Go to ChemiCrown website"
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/chemicrown.png" alt="ChemiCrown" className="w-6 h-6 object-contain" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight truncate">ChemiCrown</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest truncate">CDMS Platform</p>
            </div>
          )}
        </Link>

        {/* Nav — scrollbar hidden via CSS (aside selector in index.css) */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="sidebar-section-label mb-1">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItem
                    key={item.path}
                    item={item}
                    collapsed={collapsed}
                    onClick={() => setIsMobileSidebarOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t shrink-0 relative" style={{ borderColor: 'rgba(255,255,255,0.08)' }} ref={switcherRef}>
          {/* Account switcher popup */}
          {showAccountSwitcher && (
            <div className={`absolute z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden ${
              collapsed ? 'bottom-2 left-full ml-2 w-64' : 'bottom-full left-3 right-3 mb-2'
            }`}>
              <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Switch Account</p>
                {/* Customer Mode Toggle */}
                {['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'MARKETING', 'DIGITAL_MARKETING', 'INVENTORY_MANAGER'].includes(user.role) && (
                  <label className="flex items-center cursor-pointer" title="Toggle Customer Mode">
                    <span className="text-xs font-semibold mr-2 text-muted-foreground">Customer Mode</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={customerMode} onChange={(e) => {
                        const val = e.target.checked;
                        setCustomerMode(val);
                        localStorage.setItem('customerMode', val);
                        window.dispatchEvent(new Event('storage'));
                      }} />
                      <div className={`block w-8 h-5 rounded-full transition-colors ${customerMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${customerMode ? 'transform translate-x-3' : ''}`}></div>
                    </div>
                  </label>
                )}
              </div>
              <div className="max-h-52 overflow-y-auto p-2">
                {storedAccounts.map(account => (
                  <button
                    key={account.id}
                    onClick={async () => {
                      const success = await switchAccount(account.id);
                      setShowAccountSwitcher(false);
                      if (success) {
                        navigate('/dashboard');
                      } else {
                        toast.error('This account session has expired or is invalid. Removed from list.');
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      user.id === account.id ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {account.profileImageUrl
                        ? <img src={account.profileImageUrl} className="w-full h-full object-cover" alt="" />
                        : (account.firstName?.[0] || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${user.id === account.id ? 'text-primary' : 'text-foreground'}`}>
                        {account.firstName} {account.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize truncate">{account.role.replace(/_/g, ' ').toLowerCase()}</p>
                    </div>
                    {user.id === account.id && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-border space-y-1">
                <Link
                  to="/login?add-account=true"
                  onClick={() => setShowAccountSwitcher(false)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <UserPlus size={16} className="text-muted-foreground" /> Add Account
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut size={16} className="text-muted-foreground" /> Sign out
                </button>
                <button
                  onClick={logoutAll}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={16} /> Sign out all accounts
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowAccountSwitcher(v => !v)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/10 ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden uppercase">
              {user.profileImageUrl
                ? <img src={user.profileImageUrl} className="w-full h-full object-cover" alt="" />
                : initials || 'U'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-white/50 capitalize truncate">{roleLabel.toLowerCase()}</p>
                </div>
                <ChevronUp size={14} className={`text-white/40 transition-transform shrink-0 ${showAccountSwitcher ? '' : 'rotate-180'}`} />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <Menu size={20} className="text-muted-foreground" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              className="hidden md:flex p-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => setCollapsed(v => !v)}
            >
              <Menu size={20} className="text-muted-foreground" />
            </button>
            <div className="hidden sm:block" onClick={() => setSearchModalOpen(true)}>
              <div className="relative w-64 cursor-text group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="w-full pl-9 pr-4 py-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-xl transition-all shadow-sm flex justify-between items-center group-hover:border-primary/50 cursor-pointer">
                  <span>Search globally...</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-background text-xs font-mono text-muted-foreground border border-border">Ctrl K</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              ref={themeToggleRef}
              onClick={handleThemeToggle}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={18} className="animate-spin-once" /> : <Moon size={18} />}
            </button>
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-5 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  );
}
