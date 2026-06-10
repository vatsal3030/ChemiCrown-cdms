import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], employees: [], orders: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);
  const { token, user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ products: [], employees: [], orders: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults({ products: [], employees: [], orders: [] });
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

        const responses = await Promise.all(fetchPromises);
        const newResults = { products: [], employees: [], orders: [] };
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

  const totalResults = results.products.length + results.employees.length + results.orders.length;

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
              
              {/* Products */}
              {results.products.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2 flex items-center gap-2">
                    <Package size={14} /> Products
                  </h3>
                  <div className="space-y-1">
                    {results.products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(`/dashboard/inventory/product/${p.id}`); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku} {p.casNumber ? `• CAS: ${p.casNumber}` : ''}</p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {results.orders.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2 flex items-center gap-2">
                    <ShoppingCart size={14} /> Orders
                  </h3>
                  <div className="space-y-1">
                    {results.orders.map(o => (
                      <button
                        key={o.id}
                        onClick={() => { navigate(`/dashboard/orders/${o.id}`); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Order #{o.id.substring(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{o.customer?.companyName || o.customer?.name} • ₹{o.totalAmount}</p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees */}
              {results.employees.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2 flex items-center gap-2">
                    <Users size={14} /> Employees
                  </h3>
                  <div className="space-y-1">
                    {results.employees.map(e => (
                      <button
                        key={e.id}
                        onClick={() => { navigate(`/dashboard/hr/employee/${e.id}`); onClose(); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{e.user?.firstName} {e.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{e.jobTitle} • {e.department}</p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
