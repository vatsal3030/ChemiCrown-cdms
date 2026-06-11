import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Package, Users, ShoppingCart, ArrowRight, Layout, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], employees: [], orders: [], pages: [] });
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'pages', 'products', 'orders', 'employees'
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);
  const { token, user } = useAuth();

  const SYSTEM_PAGES = useMemo(() => [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard', description: 'System overview and metrics' },
    { id: 'inventory', name: 'Product Catalog', path: '/dashboard/inventory', description: 'Manage inventory and products' },
    { id: 'orders', name: 'Orders', path: '/dashboard/orders', description: 'View and manage customer orders' },
    { id: 'hr', name: 'HR Management', path: '/dashboard/hr', description: 'Employee directory and leave management' },
    { id: 'payroll', name: 'Payroll', path: '/dashboard/payroll', description: 'Manage salaries and payslips' },
    { id: 'finance', name: 'Finance', path: '/dashboard/finance', description: 'Income and expense tracking' },
    { id: 'attendance', name: 'Attendance Register', path: '/dashboard/hr/attendance', description: 'Employee attendance calendar' },
    { id: 'tickets', name: 'Support Tickets', path: '/dashboard/support', description: 'Customer support queries' },
    { id: 'tasks', name: 'Tasks', path: '/dashboard/tasks', description: 'Task management' },
    { id: 'stock-history', name: 'Stock History', path: '/dashboard/stock-history', description: 'Inventory movement logs' },
    { id: 'recycle-bin', name: 'Recycle Bin', path: '/dashboard/recycle-bin', description: 'Restore deleted items' },
    { id: 'audit-log', name: 'Audit Log', path: '/dashboard/audit-log', description: 'System activity tracking' },
    { id: 'holiday-calendar', name: 'Holiday Calendar', path: '/dashboard/holidays', description: 'Company holidays and observances' }
  ], []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setActiveCategory('all');
      setResults({ products: [], employees: [], orders: [], pages: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults({ products: [], employees: [], orders: [], pages: [] });
        return;
      }

      setLoading(true);
      try {
        const fetchPromises = [];

        // 1. Search Products (Inventory)
        if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'INVENTORY_MANAGER'].includes(user?.role)) {
          fetchPromises.push(
            fetch(`${import.meta.env.VITE_API_URL}/api/inventory?search=${encodeURIComponent(debouncedQuery)}&limit=3`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json()).then(d => ({ type: 'products', data: d.data || [] })).catch(() => ({ type: 'products', data: [] }))
          );
        }

        // 2. Search Orders
        if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role)) {
          fetchPromises.push(
            fetch(`${import.meta.env.VITE_API_URL}/api/orders?search=${encodeURIComponent(debouncedQuery)}&limit=3`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json()).then(d => ({ type: 'orders', data: d.data || [] })).catch(() => ({ type: 'orders', data: [] }))
          );
        }

        // 3. Search Employees (HR)
        if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR_MANAGER'].includes(user?.role)) {
          // HR doesn't have a search param right now, but we can fetch all and filter client side
          fetchPromises.push(
            fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json()).then(d => {
              const all = d.data || [];
              const filtered = all.filter(e => 
                e.user?.firstName?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                e.user?.lastName?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                e.user?.email?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                e.jobTitle?.toLowerCase().includes(debouncedQuery.toLowerCase())
              ).slice(0, 3);
              return { type: 'employees', data: filtered };
            }).catch(() => ({ type: 'employees', data: [] }))
          );
        }

        // 4. Search Pages (Local)
        const matchedPages = SYSTEM_PAGES.filter(p => 
          p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
          p.description.toLowerCase().includes(debouncedQuery.toLowerCase())
        ).slice(0, 3);
        
        fetchPromises.push(Promise.resolve({ type: 'pages', data: matchedPages }));

        const responses = await Promise.all(fetchPromises);
        const newResults = { products: [], employees: [], orders: [], pages: [] };
        responses.forEach(r => { newResults[r.type] = r.data; });
        setResults(newResults);

      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, token, user]);

  if (!isOpen) return null;

  const totalResults = results.products.length + results.employees.length + results.orders.length + results.pages.length;

  const showCategory = (cat) => activeCategory === 'all' || activeCategory === cat;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-top-4 fade-in duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder-slate-400 text-foreground"
            placeholder="Search products, orders, employees..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {loading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />}
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Filters */}
        {query.length >= 2 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card overflow-x-auto no-scrollbar">
            <Filter size={14} className="text-muted-foreground shrink-0 mr-1" />
            <button onClick={() => setActiveCategory('all')} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All</button>
            <button onClick={() => setActiveCategory('pages')} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === 'pages' ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'}`}>Pages</button>
            <button onClick={() => setActiveCategory('products')} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === 'products' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'}`}>Products</button>
            <button onClick={() => setActiveCategory('orders')} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === 'orders' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'}`}>Orders</button>
            <button onClick={() => setActiveCategory('employees')} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === 'employees' ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'}`}>Employees</button>
          </div>
        )}

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length < 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Type at least 2 characters to search globally.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="badge badge-neutral text-xs">Ctrl+K to open</span>
                <span className="badge badge-neutral text-xs">Esc to close</span>
                <span className="badge badge-neutral text-xs">Space-separated keywords</span>
              </div>
            </div>
          ) : totalResults === 0 && !loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              
              {/* Pages */}
              {showCategory('pages') && results.pages.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 px-2 flex items-center gap-2">
                    <Layout size={14} /> System Pages
                  </h3>
                  <div className="space-y-1">
                    {results.pages.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(p.path); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 text-left transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                        <ArrowRight size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {showCategory('products') && results.products.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 px-2 flex items-center gap-2">
                    <Package size={14} /> Products
                  </h3>
                  <div className="space-y-1">
                    {results.products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(`/dashboard/inventory/product/${p.id}`); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 text-left transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku} {p.casNumber ? `• CAS: ${p.casNumber}` : ''}</p>
                        </div>
                        <ArrowRight size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {showCategory('orders') && results.orders.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 px-2 flex items-center gap-2">
                    <ShoppingCart size={14} /> Orders
                  </h3>
                  <div className="space-y-1">
                    {results.orders.map(o => (
                      <button
                        key={o.id}
                        onClick={() => { navigate(`/dashboard/orders/${o.id}`); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 text-left transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Order #{o.id.substring(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{o.customer?.companyName || o.customer?.name} • ₹{o.totalAmount}</p>
                        </div>
                        <ArrowRight size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees */}
              {showCategory('employees') && results.employees.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 px-2 flex items-center gap-2">
                    <Users size={14} /> Employees
                  </h3>
                  <div className="space-y-1">
                    {results.employees.map(e => (
                      <button
                        key={e.id}
                        onClick={() => { navigate(`/dashboard/hr/employee/${e.id}`); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 text-left transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{e.user?.firstName} {e.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{e.jobTitle} • {e.department}</p>
                        </div>
                        <ArrowRight size={16} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
