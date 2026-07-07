import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, RefreshCw, Activity, AlertCircle, X, ArrowUpDown, Clock, Shield, Trash2, SlidersHorizontal } from 'lucide-react';
import { Skeleton, SkeletonTableBody } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  ROLE_CHANGED:        'badge-purple',
  UPDATED_INVENTORY:   'badge-info',
  DELETED_PRODUCT:     'badge-destructive',
  CREATED_PRODUCT:     'badge-success',
  UPDATED_PRODUCT:     'badge-warning',
  DEFAULT:             'badge-secondary',
};

export default function AuditLog() {
  const { token } = useAuth();
  const { confirm } = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const page      = parseInt(searchParams.get('page') || '1', 10);
  const action    = searchParams.get('action') || '';
  const entity    = searchParams.get('entity') || '';
  const from      = searchParams.get('from')   || '';
  const to        = searchParams.get('to')     || '';
  const sortField = searchParams.get('sort')   || 'createdAt';
  const sortOrder = searchParams.get('order')  || 'desc';

  // Temp filter state (applied on click)
  const [temp, setTemp] = useState({ action, entity, from, to });
  const [showFilters, setShowFilters] = useState(false);

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value) prev.delete(key);
      else prev.set(key, value);
      if (key !== 'page') prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, sortField, sortOrder });
      if (action) params.set('action', action);
      if (entity) params.set('entity', entity);
      if (from)   params.set('from', from);
      if (to)     params.set('to', to);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) { setLogs(json.data); setTotal(json.total); }
      else toast.error('Failed to load audit logs');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  }, [page, action, entity, from, to, sortField, sortOrder, token]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const applyFilters = () => {
    setSearchParams(prev => {
      Object.entries(temp).forEach(([k, v]) => {
        if (!v) prev.delete(k); else prev.set(k, v);
      });
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const clearFilters = () => {
    setTemp({ action: '', entity: '', from: '', to: '' });
    setSearchParams(prev => {
      ['action','entity','from','to'].forEach(k => prev.delete(k));
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const hasActiveFilters = action || entity || from || to;

  const toggleSort = (field) => {
    setSearchParams(prev => {
      if (sortField === field) {
        prev.set('order', sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        prev.set('sort', field);
        prev.set('order', 'asc');
      }
      return prev;
    }, { replace: true });
  };


  const handleDelete = async (id) => {
    const ok = await confirm('Delete Audit Log Entry', 'Are you sure you want to delete this audit log entry? This action cannot be undone.', { type: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/audit-logs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Audit log entry deleted');
        setLogs(prev => prev.filter(l => l.id !== id));
        setTotal(prev => prev - 1);
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="page-header mb-0">
        <div className="page-header-icon bg-primary/10 text-primary">
          <Shield size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Read-only record of all system actions. Logs are written automatically and cannot be created manually.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="flex flex-wrap items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Industry Standard Notice */}
      <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Industry Standard:</strong> Audit logs are automatically generated by the system for every privileged action. They cannot be manually created or edited — only read and, by SUPER_ADMIN/OWNER, deleted for compliance archival purposes.
        </p>
      </div>

      {/* Content wrapper */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 sm:max-w-5xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-9 w-full" 
              placeholder="Search is not available for audit logs... Use advanced filters." 
              disabled
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-card border-border text-foreground hover:border-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && (
                <span className="bg-white/20 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] ml-1">
                  {[action, entity, from, to].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={fetchLogs}
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
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex flex-wrap items-center gap-1">
                    <X size={12} /> Clear all
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Action</label>
                <select
                  value={temp.action}
                  onChange={e => setTemp(t => ({ ...t, action: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="ROLE_CHANGED">ROLE_CHANGED</option>
                  <option value="UPDATED_INVENTORY">UPDATED_INVENTORY</option>
                  <option value="CREATED_PRODUCT">CREATED_PRODUCT</option>
                  <option value="UPDATED_PRODUCT">UPDATED_PRODUCT</option>
                  <option value="DELETED_PRODUCT">DELETED_PRODUCT</option>
                  <option value="CREATED_USER">CREATED_USER</option>
                  <option value="UPDATED_USER">UPDATED_USER</option>
                  <option value="DELETED_USER">DELETED_USER</option>
                  <option value="PROCESSED_PAYROLL">PROCESSED_PAYROLL</option>
                  <option value="VERIFIED_PAYMENT">VERIFIED_PAYMENT</option>
                  <option value="CANCELLED_ORDER">CANCELLED_ORDER</option>
                  <option value="ISSUED_WARNING">ISSUED_WARNING</option>
                  <option value="TERMINATED_EMPLOYEE">TERMINATED_EMPLOYEE</option>
                  <option value="SUSPENDED_EMPLOYEE">SUSPENDED_EMPLOYEE</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Entity</label>
                <select
                  value={temp.entity}
                  onChange={e => setTemp(t => ({ ...t, entity: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm"
                >
                  <option value="">All Entities</option>
                  <option value="User">User</option>
                  <option value="Product">Product</option>
                  <option value="Order">Order</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Employee">Employee</option>
                  <option value="Customer">Customer</option>
                  <option value="Salary">Salary</option>
                  <option value="LeaveRequest">LeaveRequest</option>
                  <option value="Payment">Payment</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">From Date</label>
                <input type="date" value={temp.from} onChange={e => setTemp(t => ({ ...t, from: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">To Date</label>
                <input type="date" value={temp.to} onChange={e => setTemp(t => ({ ...t, to: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-slate-500 dark:text-slate-400 font-medium border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('createdAt')}>
                  <div className="flex flex-wrap items-center gap-1">Timestamp <ArrowUpDown size={12} className={sortField === 'createdAt' ? 'text-primary' : ''} /></div>
                </th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('action')}>
                  <div className="flex flex-wrap items-center gap-1">Action <ArrowUpDown size={12} className={sortField === 'action' ? 'text-primary' : ''} /></div>
                </th>
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('entity')}>
                  <div className="flex flex-wrap items-center gap-1">Entity <ArrowUpDown size={12} className={sortField === 'entity' ? 'text-primary' : ''} /></div>
                </th>
                <th className="data-table-cell text-left">Entity ID</th>
                <th className="data-table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SkeletonTableBody rows={8} columns={6} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <Shield size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No audit logs found</p>
                    <p className="text-xs mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="data-table-row">
                  <td className="data-table-cell text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="data-table-cell">
                    <div>
                      <p className="font-semibold text-foreground text-xs">{log.user?.firstName} {log.user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{log.user?.role?.replace(/_/g, ' ')}</p>
                    </div>
                  </td>
                  <td className="data-table-cell">
                    <span className={`badge ${ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="data-table-cell font-medium text-foreground">{log.entity}</td>
                  <td className="data-table-cell">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{log.entityId?.substring(0, 8)}…</code>
                  </td>
                  <td className="data-table-cell text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => window.location.href = `/dashboard/audit-log/${log.id}`}>
                        View Details
                      </Button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete log entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} total entries)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setParam('page', String(Math.max(1, page - 1)))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setParam('page', String(Math.min(totalPages, page + 1)))} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
