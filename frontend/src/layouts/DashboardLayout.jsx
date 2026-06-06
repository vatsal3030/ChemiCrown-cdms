import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, ShoppingCart, Settings, Bell, Search, Menu, Users, FileText, ClipboardCheck, LogOut, ShieldCheck, ChevronUp, UserPlus, Store, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import NavbarSearch from '@/components/layout/NavbarSearch';

export default function DashboardLayout() {
  const location = useLocation();
  const { user, storedAccounts, logout, switchAccount } = useAuth();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Effect to save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isDesktopSidebarCollapsed);
  }, [isDesktopSidebarCollapsed]);

  // If user is null (safety check, should be caught by ProtectedRoute)
  if (!user) return null;

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'SALES', 'MARKETING', 'DIGITAL_MARKETING'] },
    { name: 'Product Catalog', path: '/dashboard/catalog', icon: Store, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'SALES', 'CUSTOMER'] },
    { name: 'Verify Customers', path: '/dashboard/verify', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'OWNER'] },
    { name: 'Inventory', path: '/dashboard/inventory', icon: Package, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER'] },
    { name: 'Stock History', path: '/dashboard/stock-history', icon: ClipboardCheck, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER'] },
    { name: 'HR Management', path: '/dashboard/hr', icon: Users, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER'] },
    { name: 'My Attendance', path: '/dashboard/me', icon: ClipboardCheck, roles: ['MANAGER', 'SALES', 'INVENTORY_MANAGER', 'MARKETING', 'DIGITAL_MARKETING'] },
    { name: 'Orders', path: '/dashboard/orders', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'CUSTOMER', 'MARKETING'] },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CUSTOMER'] },
  ];

  // Filter items based on the user's role
  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDesktopSidebarCollapsed ? 'md:w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight shrink-0">
            <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-8 w-8 object-contain" />
            {!isDesktopSidebarCollapsed && <span>ChemiCrown</span>}
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                } ${isDesktopSidebarCollapsed ? 'justify-center md:px-0' : ''}`}
                title={isDesktopSidebarCollapsed ? item.name : undefined}
              >
                <Icon size={18} className={isActive ? 'text-primary-foreground shrink-0' : 'text-slate-400 shrink-0'} />
                {!isDesktopSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 relative">
          
          {/* Account Switcher Dropdown */}
          {showAccountSwitcher && (
            <div className={`absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-200 ${
              isDesktopSidebarCollapsed 
                ? 'bottom-0 left-full ml-4 w-64 slide-in-from-left-2' 
                : 'bottom-full left-4 right-4 mb-2 slide-in-from-bottom-2'
            }`}>
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">Switch Account</p>
                {isDesktopSidebarCollapsed && (
                  <button onClick={() => setShowAccountSwitcher(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {storedAccounts.map(account => (
                  <button 
                    key={account.id}
                    onClick={() => { switchAccount(account.id); setShowAccountSwitcher(false); }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${user.id === account.id ? 'bg-primary/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                      {account.profileImageUrl ? (
                        <img src={account.profileImageUrl} alt={account.firstName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        account.firstName ? account.firstName.charAt(0) : 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${user.id === account.id ? 'text-primary' : 'text-slate-900 dark:text-slate-50'}`}>{account.firstName}</p>
                      <p className="text-xs text-slate-500 truncate capitalize">{account.role.replace('_', ' ').toLowerCase()}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                <Link to="/login" onClick={() => setShowAccountSwitcher(false)} className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <UserPlus size={16} />
                  Add Account
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-1">
                  <LogOut size={16} />
                  Log out all accounts
                </button>
              </div>
            </div>
          )}

          <div 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
            onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="w-full h-full object-cover" />
              ) : (
                user.firstName ? user.firstName.charAt(0) : 'U'
              )}
            </div>
            <div className={`flex-1 min-w-0 ${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{user.firstName || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
            {!isDesktopSidebarCollapsed && <ChevronUp size={18} className={`text-slate-400 transition-transform ${showAccountSwitcher ? 'rotate-180' : ''}`} />}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 glass flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}>
              <Menu size={20} />
            </Button>
            <NavbarSearch />
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
