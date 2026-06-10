import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Search, Plus, Filter, Trash2, ArrowUpDown, History,
  SlidersHorizontal, X, RefreshCw, Package, IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce';
import AddStockModal from '@/components/AddStockModal';

export default function Inventory() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // All filter state from URL — support both ?q= and ?search= for cross-page navigation
  const page           = parseInt(searchParams.get('page') || '1', 10);
  const searchTerm     = searchParams.get('q') || searchParams.get('search') || '';
  const sortField      = searchParams.get('sort')     || 'name';
  const sortOrder      = searchParams.get('order')    || 'asc';
  const categoryFilter = searchParams.get('cat')      || 'all';
  const stockFilter    = searchParams.get('stock')    || 'all';
  const statusFilter   = searchParams.get('status')   || 'all';
  const minPrice       = searchParams.get('minPrice') || '';
  const maxPrice       = searchParams.get('maxPrice') || '';

  const setParam = (key, value, resetPage = true) => {
    setSearchParams(prev => {
      if (!value || value === 'all' || value === '') prev.delete(key);
      else prev.set(key, value);
      if (resetPage && key !== 'page') prev.set('page', '1');
      return prev;
    }, { replace: true });
  };
  const setPage = (p) => setParam('page', p.toString(), false);

  const [categories, setCategories]       = useState([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct]         = useState(null);
  const [showFilters, setShowFilters]           = useState(false);
  const [totalPages, setTotalPages]             = useState(1);

  const [temp, setTemp] = useState({ cat: categoryFilter, stock: stockFilter, status: statusFilter, minPrice, maxPrice });

  useEffect(() => {
    setTemp({ cat: categoryFilter, stock: stockFilter, status: statusFilter, minPrice, maxPrice });
  }, [categoryFilter, stockFilter, statusFilter, minPrice, maxPrice]);

  const limit = 10;

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const apiUrl = token
    ? `${import.meta.env.VITE_API_URL}/api/inventory?` +
      `search=${encodeURIComponent(debouncedSearch)}&sortField=${sortField}&sortOrder=${sortOrder}` +
      `&page=${page}&limit=${limit}` +
      (categoryFilter !== 'all' ? `&categoryId=${categoryFilter}` : '') +
      (stockFilter    !== 'all' ? `&stockStatus=${stockFilter}`   : '') +
      (statusFilter   !== 'all' ? `&isAvailable=${statusFilter === 'active'}` : '') +
      (minPrice ? `&minPrice=${minPrice}` : '') +
      (maxPrice ? `&maxPrice=${maxPrice}` : '')
    : null;

  const { data, error, mutate } = useSWR(apiUrl, fetcher);
  const products = data?.data || [];
  const loading = !data && !error;

  useEffect(() => {
    if (data?.pagination) setTotalPages(data.pagination.totalPages);
  }, [data]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (token) fetchCategories(); }, [token]);

  const toggleSort = (field) => {
    if (sortField === field) setParam('order', sortOrder === 'asc' ? 'desc' : 'asc');
    else { setParam('sort', field); setParam('order', 'asc'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    if (data) mutate({ ...data, data: data.data.filter(p => p.id !== id) }, false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) { toast.success('Product soft-deleted successfully'); mutate(); }
      else { toast.error(json.error || 'Failed to delete product'); mutate(); }
    } catch { toast.error('Network error'); mutate(); }
  };

  const applyFilters = () => {
    setSearchParams(prev => {
      Object.entries(temp).forEach(([k, v]) => {
        if (!v || v === 'all') prev.delete(k);
        else prev.set(k, v);
      });
      prev.set('page', '1');
      return prev;
    }, { replace: true });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setTemp({ cat: 'all', stock: 'all', status: 'all', minPrice: '', maxPrice: '' });
    setSearchParams(prev => {
      ['cat','stock','status','minPrice','maxPrice','q'].forEach(k => prev.delete(k));
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const hasActiveFilters = categoryFilter !== 'all' || stockFilter !== 'all'
    || statusFilter !== 'all' || minPrice || maxPrice;
  const activeFilterCount = [
    categoryFilter !== 'all', stockFilter !== 'all', statusFilter !== 'all', !!minPrice, !!maxPrice
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chemical Inventory</h1>
          <p className="text-slate-500 mt-1">Manage and track all your chemical products.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => navigate('/dashboard/inventory/product/new')}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 sm:max-w-5xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, CAS number..."
              value={searchTerm}
              onChange={e => setParam('q', e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">

            {/* Advanced filter toggle */}
            <button
              onClick={() => { setShowFilters(v => !v); setTemp({ cat: categoryFilter, stock: stockFilter, status: statusFilter, minPrice, maxPrice }); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-slate-900 border-border text-foreground hover:border-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button onClick={() => mutate()} className="p-2 rounded-lg border border-input hover:bg-muted transition-colors text-muted-foreground">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Expanded Filter Panel ── */}
        {showFilters && (
          <div className="border-b border-border bg-muted/20 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Filter size={15} /> Advanced Filters
              </h3>
              <div className="flex gap-3">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex items-center gap-1">
                    <X size={12} /> Clear all
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Category</label>
                <select
                  value={temp.cat}
                  onChange={e => setTemp(t => ({ ...t, cat: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {/* Stock Level */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Stock Level</label>
                <select
                  value={temp.stock}
                  onChange={e => setTemp(t => ({ ...t, stock: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in">In Stock (&gt;50)</option>
                  <option value="low">Low Stock (1-50)</option>
                  <option value="out">Out of Stock (0)</option>
                </select>
              </div>
              {/* Availability / Status */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Availability</label>
                <select
                  value={temp.status}
                  onChange={e => setTemp(t => ({ ...t, status: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All</option>
                  <option value="active">Active (Visible)</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              {/* Min Price */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-0.5" />Min Price
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={temp.minPrice}
                  onChange={e => setTemp(t => ({ ...t, minPrice: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Max Price */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-0.5" />Max Price
                </label>
                <input
                  type="number"
                  placeholder="₹ ∞"
                  value={temp.maxPrice}
                  onChange={e => setTemp(t => ({ ...t, maxPrice: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
                Reset
              </button>
              <button onClick={applyFilters} className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="px-4 py-2 border-b border-border flex flex-wrap gap-2 items-center">
            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Category: {categories.find(c => c.id === categoryFilter)?.name || categoryFilter}
                <button onClick={() => setParam('cat', 'all')}><X size={10} /></button>
              </span>
            )}
            {stockFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold">
                Stock: {stockFilter}
                <button onClick={() => setParam('stock', 'all')}><X size={10} /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                {statusFilter}
                <button onClick={() => setParam('status', 'all')}><X size={10} /></button>
              </span>
            )}
            {minPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                Min: ₹{minPrice} <button onClick={() => setParam('minPrice', '')}><X size={10} /></button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                Max: ₹{maxPrice} <button onClick={() => setParam('maxPrice', '')}><X size={10} /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive ml-auto">Clear all</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Product <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('casNumber')}>
                  <div className="flex items-center gap-1">CAS Number <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Price <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48 mb-2" /><Skeleton className="h-3 w-64" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-16 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No products match your filter</p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">Clear filters</button>
                    )}
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const quantity = product.inventory?.quantity || 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-50">{product.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[220px]">{product.description}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{product.casNumber || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              quantity === 0 ? 'bg-red-500' : quantity <= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="text-sm">{quantity} × {product.packageSize ? `${product.packageSize}${product.baseUnit} ${product.unit}` : product.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          product.isAvailable !== false
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {product.isAvailable !== false ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">₹{product.price}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Stock History — navigate to stock-history page with pre-filter */}
                          <Button variant="outline" size="icon" className="h-8 w-8" title="View Stock History"
                            onClick={() => navigate(`/dashboard/stock-history?q=${encodeURIComponent(product.name)}`)}>
                            <History size={14} className="text-slate-500" />
                          </Button>
                          {/* Add Stock — icon on mobile, icon+text on md+ */}
                          <Button variant="outline" size="sm" className="gap-1 h-8 px-2 md:px-3"
                            onClick={() => { setStockProduct(product); setIsStockModalOpen(true); }}>
                            <Plus size={14} />
                            <span className="hidden sm:inline">Stock</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => navigate(`/dashboard/inventory/product/${product.id}`)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(product.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages || 1}
              {data?.pagination?.total ? ` · ${data.pagination.total} products` : ''}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={stockProduct}
        token={token}
        onSuccess={(qtyChange) => {
          setIsStockModalOpen(false);
          if (data && qtyChange) {
            mutate({
              ...data,
              data: data.data.map(p =>
                p.id === stockProduct?.id
                  ? { ...p, inventory: { ...p.inventory, quantity: p.inventory.quantity + qtyChange } }
                  : p
              )
            }, false);
          }
        }}
      />

    </div>
  );
}
