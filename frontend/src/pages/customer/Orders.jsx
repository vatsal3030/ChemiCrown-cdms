import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Trash2, ArrowUpDown, Eye, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  REQUESTED: 'badge badge-info',
  PENDING: 'badge badge-warning',
  PROCESSING: 'badge badge-secondary',
  PACKAGED: 'badge badge-secondary',
  DISPATCHED: 'badge badge-info',
  DELIVERED: 'badge badge-success',
  CANCELLED: 'badge badge-destructive',
};

export default function Orders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

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
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [searchTerm, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(s => s === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) toast.success('Order cancelled');
      else { toast.error(json.error || 'Failed'); fetchOrders(); }
    } catch {
      toast.error('Network error');
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);
  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES'].includes(user?.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <ShoppingCart size={22} />
        </div>
        <div>
          <h1 className="page-title">{isAdmin ? 'All Orders' : 'My Orders'}</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Manage and track all customer orders.' : 'View your order history and track shipments.'}
          </p>
        </div>
      </div>

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
              <option value="REQUESTED">Requested</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKAGED">Packaged</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('id')}>
                  <div className="flex items-center gap-1">Order ID <ArrowUpDown size={12} /></div>
                </th>
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('createdAt')}>
                  <div className="flex items-center gap-1">Date <ArrowUpDown size={12} /></div>
                </th>
                <th className="data-table-cell text-left">Total</th>
                <th className="data-table-cell text-left">Status</th>
                <th className="data-table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="data-table-cell"><div className="h-4 bg-muted rounded-lg w-32 animate-pulse" /></td>
                    <td className="data-table-cell"><div className="h-4 bg-muted rounded-lg w-24 animate-pulse" /></td>
                    <td className="data-table-cell"><div className="h-4 bg-muted rounded-lg w-20 animate-pulse" /></td>
                    <td className="data-table-cell"><div className="h-5 bg-muted rounded-full w-20 animate-pulse" /></td>
                    <td className="data-table-cell text-right"><div className="h-8 bg-muted rounded-lg w-24 animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <Package size={36} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">No orders found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {statusFilter !== 'all' ? 'Try a different status filter.' : 'No orders have been placed yet.'}
                    </p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="data-table-row">
                  <td className="data-table-cell">
                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {order.id.substring(0, 8)}…
                    </code>
                  </td>
                  <td className="data-table-cell text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="data-table-cell font-semibold text-foreground">
                    ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="data-table-cell">
                    <span className={STATUS_STYLES[order.status] || 'badge badge-secondary'}>
                      {order.status}
                    </span>
                  </td>
                  <td className="data-table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                      {(order.status === 'REQUESTED' || order.status === 'PENDING') && (
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Cancel order"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
