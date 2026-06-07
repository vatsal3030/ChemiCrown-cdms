import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Trash2, ArrowUpDown, Eye, Package, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_PIPELINE = ['REQUESTED', 'PENDING', 'PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];

const STATUS_STYLES = {
  REQUESTED:  'badge badge-info',
  PENDING:    'badge badge-warning',
  PROCESSING: 'badge badge-secondary',
  PACKAGED:   'badge badge-secondary',
  DISPATCHED: 'badge badge-info',
  DELIVERED:  'badge badge-success',
  CANCELLED:  'badge badge-destructive',
};

const NEXT_LABEL = {
  REQUESTED:  'Mark Pending',
  PENDING:    'Start Processing',
  PROCESSING: 'Mark Packaged',
  PACKAGED:   'Dispatch',
  DISPATCHED: 'Mark Delivered',
};

export default function Orders() {
  const { token, user } = useAuth();
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [advancing, setAdvancing]     = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [sortField, setSortField]     = useState('createdAt');
  const [sortOrder, setSortOrder]     = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES'].includes(user?.role);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchTerm, sortField, sortOrder });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
      else toast.error('Failed to fetch orders');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [searchTerm, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(s => s === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/cancel`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) toast.success('Order cancelled successfully');
      else { toast.error(json.error || 'Failed to cancel order'); fetchOrders(); }
    } catch { toast.error('Network error'); fetchOrders(); }
  };

  const handleAdvance = async (id, currentStatus) => {
    setAdvancing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: json.data.status } : o));
      } else toast.error(json.error || 'Failed to advance status');
    } catch { toast.error('Network error'); }
    finally { setAdvancing(null); }
  };

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);
  const cols = isAdmin ? 6 : 5;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <ShoppingCart size={22} />
        </div>
        <div>
          <h1 className="page-title">{isAdmin ? 'All Orders' : 'My Orders'}</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage and advance order fulfilment through the pipeline.'
              : 'View your order history and track shipments.'}
          </p>
        </div>
      </div>

      {/* Admin pipeline legend */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-2.5">
          <span className="font-semibold text-foreground mr-1">Pipeline:</span>
          {STATUS_PIPELINE.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span className="font-medium text-foreground">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
              {i < STATUS_PIPELINE.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
            </span>
          ))}
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-muted-foreground shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              {['REQUESTED','PENDING','PROCESSING','PACKAGED','DISPATCHED','DELIVERED','CANCELLED'].map(s => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary/5">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('id')}>
                  <div className="flex items-center gap-1">Order ID <ArrowUpDown size={12} /></div>
                </th>
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('createdAt')}>
                  <div className="flex items-center gap-1">Date <ArrowUpDown size={12} /></div>
                </th>
                <th className="data-table-cell text-left">Total</th>
                <th className="data-table-cell text-left">Status</th>
                {isAdmin && <th className="data-table-cell text-left">Advance</th>}
                <th className="data-table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(cols).fill(0).map((_, j) => (
                      <td key={j} className="data-table-cell">
                        <div className="h-4 bg-muted rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={cols} className="px-6 py-16 text-center">
                    <Package size={36} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">No orders found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {statusFilter !== 'all' ? 'Try a different status filter.' : 'No orders have been placed yet.'}
                    </p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => {
                const canAdvance = isAdmin
                  && STATUS_PIPELINE.includes(order.status)
                  && order.status !== 'DELIVERED'
                  && order.status !== 'CANCELLED';
                return (
                  <tr key={order.id} className="data-table-row">
                    <td className="data-table-cell">
                      <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td className="data-table-cell text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="data-table-cell font-semibold text-foreground">
                      ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="data-table-cell">
                      <span className={STATUS_STYLES[order.status] || 'badge badge-secondary'}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="data-table-cell">
                        {canAdvance ? (
                          <button
                            onClick={() => handleAdvance(order.id, order.status)}
                            disabled={advancing === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {advancing === order.id ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin inline-block" />
                                Advancing…
                              </span>
                            ) : (
                              <><ChevronRight size={13} className="shrink-0" />{NEXT_LABEL[order.status]}</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="data-table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/70 rounded-xl transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                        {(order.status === 'REQUESTED' || order.status === 'PENDING') && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Cancel order"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
