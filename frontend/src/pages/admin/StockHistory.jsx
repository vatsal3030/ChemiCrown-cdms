import useSWR from 'swr';
import { History, ArrowUpRight, ArrowDownRight, User, Search, Filter, X, SlidersHorizontal, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import useDebounce from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';

export default function StockHistory() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const searchTerm = searchParams.get('q')    || '';
  const typeFilter = searchParams.get('type') || 'all';
  const sortOrder  = searchParams.get('sort') || 'desc';
  const startDate  = searchParams.get('startDate') || '';
  const endDate    = searchParams.get('endDate') || '';
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

  const [temp, setTemp] = useState({ type: typeFilter, sort: sortOrder, startDate, endDate });

  useEffect(() => {
    if (showFilters) {
      setTemp({ type: typeFilter, sort: sortOrder, startDate, endDate });
    }
  }, [showFilters, typeFilter, sortOrder, startDate, endDate]);

  const applyFilters = () => {
    setParam('type', temp.type);
    setParam('sort', temp.sort);
    setParam('startDate', temp.startDate);
    setParam('endDate', temp.endDate);
  };

  const clearFilters = () => {
    setParam('q', '');
    setParam('type', 'all');
    setParam('sort', 'desc');
    setParam('startDate', '');
    setParam('endDate', '');
    setTemp({ type: 'all', sort: 'desc', startDate: '', endDate: '' });
  };

  const activeFilterCount = [
    typeFilter !== 'all',
    sortOrder !== 'desc',
    startDate !== '',
    endDate !== ''
  ].filter(Boolean).length;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const queryParams = new URLSearchParams({
    search: debouncedSearch,
    type: typeFilter,
    sortOrder: sortOrder,
    page: page,
    limit: limit,
  });
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const { data, error, isValidating, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/inventory/logs/all?${queryParams.toString()}` : null,
    fetcher
  );

  const logs = data?.data || [];
  const pagination = data?.pagination;
  const loading = (!data && !error) || isValidating;
  const hasFilters = searchTerm || typeFilter !== 'all' || sortOrder !== 'desc' || startDate || endDate;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock History</h1>
          <p className="text-slate-500 mt-1">Detailed transaction logs across all inventory.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 sm:max-w-5xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-9 w-full" 
              placeholder="Search by product, SKU, user, or remarks..." 
              value={searchTerm}
              onChange={(e) => setParam('q', e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                hasFilters
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-card border-border text-foreground hover:border-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] ml-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => mutate()}
              className="p-2 border border-border text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-foreground flex flex-wrap items-center gap-2 text-sm">
                <Filter size={15} /> Advanced Filters
              </h3>
              <div className="flex flex-wrap gap-3">
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex flex-wrap items-center gap-1">
                    <X size={12} /> Clear all
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Type</label>
                <select 
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm"
                  value={temp.type}
                  onChange={(e) => setTemp({ ...temp, type: e.target.value })}
                >
                  <option value="all">All Types</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Sort</label>
                <select 
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm"
                  value={temp.sort}
                  onChange={(e) => setTemp({ ...temp, sort: e.target.value })}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">From Date</label>
                <Input 
                  type="date" 
                  className="w-full text-sm" 
                  value={temp.startDate}
                  onChange={(e) => setTemp({ ...temp, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">To Date</label>
                <Input 
                  type="date" 
                  className="w-full text-sm" 
                  value={temp.endDate}
                  onChange={(e) => setTemp({ ...temp, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-slate-500 dark:text-slate-400 font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && logs.length === 0 ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="data-table-row">
                    <td className="data-table-cell"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="data-table-cell"><Skeleton className="h-4 w-48 mb-1" /><Skeleton className="h-3 w-24" /></td>
                    <td className="data-table-cell"><Skeleton className="h-5 w-16" /></td>
                    <td className="data-table-cell"><Skeleton className="h-4 w-32" /></td>
                    <td className="data-table-cell"><Skeleton className="h-4 w-40" /></td>
                    <td className="data-table-cell"><Skeleton className="h-4 w-32" /></td>
                    <td className="data-table-cell"><Skeleton className="h-6 w-16 float-right" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500">
                    No stock transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const product = log.inventory?.product;
                  return (
                    <tr key={log.id} className="data-table-row">
                      <td className="data-table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${log.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {log.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {log.type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td className="data-table-cell">
                        <div className="font-medium text-slate-900 dark:text-slate-50">{product?.name || 'Unknown Product'}</div>
                        <div className="text-xs text-slate-500">SKU: {product?.sku || 'N/A'}</div>
                      </td>
                      <td className="data-table-cell font-bold text-base">
                        <span className={log.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {log.type === 'IN' ? '+' : '-'}{log.quantity}
                        </span>
                        <span className="text-xs font-normal text-slate-500 ml-1">{product?.unit}</span>
                      </td>
                      <td className="data-table-cell">
                        <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-300">
                          <User size={14} className="text-slate-400" />
                          {log.user?.employeeProfile?.id ? (
                            <a href={`/dashboard/hr/${log.user.employeeProfile.id}`} className="text-primary hover:underline hover:text-primary/80">
                              {log.user.firstName} {log.user.lastName}
                            </a>
                          ) : (
                            log.createdBy || 'System'
                          )}
                        </div>
                      </td>
                      <td className="data-table-cell max-w-[200px]">
                        {log.remarks ? (
                          <div className="group relative w-full">
                            <div className="truncate text-slate-600 dark:text-slate-400 cursor-help">{log.remarks}</div>
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg min-w-[200px] max-w-[300px] whitespace-normal wrap-break-word">
                              {log.remarks}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="data-table-cell text-slate-500 text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="data-table-cell text-right">
                        <Link to={`/dashboard/stock-history/${log.id}`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                            <Eye size={14} /> View
                          </Button>
                        </Link>
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
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} records)
            </span>
            <div className="flex flex-wrap items-center gap-2">
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
