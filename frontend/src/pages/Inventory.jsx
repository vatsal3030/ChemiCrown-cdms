import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Filter, Trash2, ArrowUpDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce';

import AddStockModal from '@/components/AddStockModal';
import StockLogsModal from '@/components/admin/StockLogsModal';

export default function Inventory() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);

  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const setPage = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: true });
  };
  
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const catParam = categoryFilter !== 'all' ? `&categoryId=${categoryFilter}` : '';
  const stockParam = stockFilter !== 'all' ? `&stockStatus=${stockFilter}` : '';
  
  const { data, error, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/inventory?search=${debouncedSearch}&sortField=${sortField}&sortOrder=${sortOrder}&page=${page}&limit=${limit}${catParam}${stockParam}` : null,
    fetcher
  );

  const products = data?.data || [];
  const loading = !data && !error;

  useEffect(() => {
    if (data?.pagination) {
      setTotalPages(data.pagination.totalPages);
    }
  }, [data]);

  const fetchCategories = async () => {
    try {
      if (categories.length === 0 && token) {
        const catRes = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const catJson = await catRes.json();
        if (catJson.success) setCategories(catJson.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stockFilter, categoryFilter, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    // Optimistic UI Update
    if (data) {
      mutate(
        {
          ...data,
          data: data.data.filter(p => p.id !== id)
        },
        false
      );
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Product soft-deleted successfully');
        mutate(); // Revalidate
      } else {
        toast.error(json.error || 'Failed to delete product');
        mutate(); // Revert
      }
    } catch {
      toast.error('Network error. Failed to delete product');
      mutate(); // Revert
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, CAS number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="pl-3 pr-8 rounded-md border border-input bg-background py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex items-center">
              <Filter size={16} className="absolute left-3 text-slate-400" />
              <select 
                value={stockFilter} 
                onChange={e => setStockFilter(e.target.value)}
                className="pl-9 pr-8 rounded-md border border-input bg-background py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Stock Levels</option>
                <option value="in">In Stock (&gt;50)</option>
                <option value="low">Low Stock (1-50)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Product <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('casNumber')}>
                  <div className="flex items-center gap-1">CAS Number <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Price <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-3 w-64" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-16 rounded hidden md:block" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No products match your filter.</td></tr>
              ) : (
                products.map((product) => {
                  const quantity = product.inventory?.quantity || 0;
                  return (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-50">{product.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{product.casNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{quantity} &times; {product.packageSize ? `${product.packageSize}${product.baseUnit} ${product.unit}` : product.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${product.isAvailable !== false ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                        {product.isAvailable !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">₹{product.price}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 hidden md:flex" title="Stock History" onClick={() => { setStockProduct(product); setIsLogsModalOpen(true); }}>
                          <History size={14} className="text-slate-500" />
                        </Button>
                        <Button variant="outline" size="sm" className="hidden md:flex gap-1 h-8" onClick={() => { setStockProduct(product); setIsStockModalOpen(true); }}>
                          <Plus size={14} /> Stock
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => navigate(`/dashboard/inventory/product/${product.id}`)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && products.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
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
            mutate(
              {
                ...data,
                data: data.data.map(p => 
                  p.id === stockProduct?.id 
                    ? { ...p, inventory: { ...p.inventory, quantity: p.inventory.quantity + qtyChange } } 
                    : p
                )
              }, 
              false
            );
          }
        }}
      />

      <StockLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        product={stockProduct}
        token={token}
      />
    </div>
  );
}
