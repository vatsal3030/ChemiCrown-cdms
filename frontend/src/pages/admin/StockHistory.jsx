import useSWR from 'swr';
import { History, ArrowUpRight, ArrowDownRight, User, Search, Filter, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import useDebounce from '@/hooks/useDebounce';

export default function StockHistory() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('q')    || '';
  const typeFilter = searchParams.get('type') || 'all';
  const page       = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value || value === 'all') prev.delete(key);
      else prev.set(key, value);
      if (key !== 'page') prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const { data, error, isValidating } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/inventory/logs/all?search=${debouncedSearch}&type=${typeFilter}&page=${page}&limit=${limit}` : null,
    fetcher
  );

  const logs = data?.data || [];
  const pagination = data?.pagination;
  const loading = (!data && !error) || isValidating;
  const hasFilters = searchTerm || typeFilter !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock History</h1>
          <p className="text-slate-500 mt-1">Detailed transaction logs across all inventory.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            className="w-full pl-10" 
            placeholder="Search by product, SKU, user, or remarks..." 
            value={searchTerm}
            onChange={(e) => setParam('q', e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto shrink-0">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            className="w-full sm:w-48 pl-9 pr-8 py-2 bg-transparent border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm"
            value={typeFilter}
            onChange={(e) => setParam('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setParam('q', ''); setParam('type', 'all'); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-destructive transition-colors text-sm shrink-0"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && logs.length === 0 ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48 mb-1" /><Skeleton className="h-3 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    No stock transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const product = log.inventory?.product;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${log.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {log.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {log.type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-50">{product?.name || 'Unknown Product'}</div>
                        <div className="text-xs text-slate-500">SKU: {product?.sku || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-base">
                        <span className={log.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {log.type === 'IN' ? '+' : '-'}{log.quantity}
                        </span>
                        <span className="text-xs font-normal text-slate-500 ml-1">{product?.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <User size={14} className="text-slate-400" />
                          {log.createdBy || 'System'}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                        {log.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && logs.length > 0 && pagination && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setParam('page', String(Math.max(1, page - 1)))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
