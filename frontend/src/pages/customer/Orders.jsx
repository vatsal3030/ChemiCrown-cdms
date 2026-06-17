import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, Filter, Trash2, ArrowUpDown, Eye,
  Package, ChevronRight, X, SlidersHorizontal, RefreshCw,
  Calendar, IndianRupee, CheckCircle, XCircle,
  QrCode, Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SkeletonTableBody } from '@/components/ui/Skeleton';

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

const STATUS_COLORS = {
  REQUESTED:  'bg-sky-500',
  PENDING:    'bg-amber-500',
  PROCESSING: 'bg-violet-500',
  PACKAGED:   'bg-blue-500',
  DISPATCHED: 'bg-indigo-500',
  DELIVERED:  'bg-emerald-500',
  CANCELLED:  'bg-red-500',
};

export default function Orders({ isMyOrders = false }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // All filter state lives in URL searchParams
  const statusFilter   = searchParams.get('status')   || 'all';
  const sortField      = searchParams.get('sort')      || 'createdAt';
  const sortOrder      = searchParams.get('order')     || 'desc';
  const searchTerm     = searchParams.get('q')         || '';
  const dateFrom       = searchParams.get('from')      || '';
  const dateTo         = searchParams.get('to')        || '';
  const minAmount      = searchParams.get('minAmt')    || '';
  const maxAmount      = searchParams.get('maxAmt')    || '';

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value || value === 'all' || value === '') prev.delete(key);
      else prev.set(key, value);
      return prev;
    }, { replace: true });
  };

  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [advancing, setAdvancing] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  // Temp filter state (applied on click)
  const [tempFilters, setTempFilters] = useState({ status: statusFilter, from: dateFrom, to: dateTo, minAmt: minAmount, maxAmt: maxAmount });

  useEffect(() => {
    setTempFilters({ status: statusFilter, from: dateFrom, to: dateTo, minAmt: minAmount, maxAmt: maxAmount });
  }, [statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const isAdmin = !isMyOrders && ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES'].includes(user?.role);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchTerm, sortField, sortOrder });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo)   params.set('to',   dateTo);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      if (isMyOrders) params.set('myOrders', 'true');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
      else toast.error('Failed to fetch orders');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  }, [searchTerm, sortField, sortOrder, statusFilter, dateFrom, dateTo, minAmount, maxAmount, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // UPI Pending Payment Verification (admin only)
  const [pendingUpi, setPendingUpi] = useState([]);
  const [verifyingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingUpi = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/upi/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setPendingUpi(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [isAdmin, token]);

  useEffect(() => { fetchPendingUpi(); }, [fetchPendingUpi]);

  const handleVerifyUpi = async (orderId, action, reason = '') => {
    // Optimistic UI
    const previousPending = [...pendingUpi];
    setPendingUpi(prev => prev.filter(o => o.id !== orderId));
    setRejectModal(null);
    setRejectReason('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/upi/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, action, rejectionReason: reason })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === 'APPROVE' ? '✅ Payment verified! Order is now processing.' : '❌ Payment rejected. Customer notified.');
        if (action === 'APPROVE') fetchOrders();
      } else {
        toast.error(json.error || json.message || 'Failed');
        setPendingUpi(previousPending);
      }
    } catch { 
      toast.error('Network error'); 
      setPendingUpi(previousPending);
    }
  };

  const toggleSort = (field) => {
    setSearchParams(prev => {
      if (sortField === field) {
        prev.set('order', sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        prev.set('sort', field);
        prev.set('order', 'asc');
      }
      return prev;
    });
  };

  const handleCancel = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const reason = window.prompt('Reason for cancellation (optional — leave blank to skip):');
    if (reason === null) return; // User pressed Cancel on the prompt
    if (!window.confirm(`Cancel order #${id.substring(0, 8).toUpperCase()}? This cannot be undone.`)) return;

    const previousStatus = order.status;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    
    // Instant success toast
    toast.success('Order cancelled successfully.');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reason.trim() || undefined })
      });
      const json = await res.json();
      if (json.success) {
        if (json.refundAmount > 0) {
          toast.success(
            `Refund of ₹${json.refundAmount.toFixed(2)} will be processed in ${json.estimatedRefundDays}.`,
            { duration: 6000 }
          );
        }
      } else {
        toast.error(json.error || 'Failed to cancel order');
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: previousStatus } : o)); // Revert only this order
      }
    } catch { 
      toast.error('Network error. Reverting cancellation.'); 
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: previousStatus } : o)); // Revert only this order
    }
  };


  const handleAdvance = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (advancing[id]) return;
    
    // Optimistic UI
    const currentIndex = STATUS_PIPELINE.indexOf(order.status);
    const nextStatus = STATUS_PIPELINE[currentIndex + 1];
    if (!nextStatus) return;

    const previousStatus = order.status;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    setAdvancing(prev => ({ ...prev, [id]: true }));

    // Instant success toast
    toast.success(`Order advanced to ${nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}`);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        // Sync exact status from server just in case
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: json.data.status } : o));
      } else {
        toast.error(json.error || 'Failed to advance status');
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: previousStatus } : o)); // Revert only this order
      }
    } catch { 
      toast.error('Network error. Reverting status update.'); 
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: previousStatus } : o)); // Revert only this order
    } finally {
      setAdvancing(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const applyFilters = () => {
    setSearchParams(prev => {
      Object.entries(tempFilters).forEach(([k, v]) => {
        if (!v || v === 'all') prev.delete(k);
        else prev.set(k, v);
      });
      return prev;
    }, { replace: true });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setTempFilters({ status: 'all', from: '', to: '', minAmt: '', maxAmt: '' });
    setSearchParams(prev => {
      ['status','from','to','minAmt','maxAmt','q'].forEach(k => prev.delete(k));
      return prev;
    }, { replace: true });
  };

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo || minAmount || maxAmount;
  const activeFilterCount = [
    statusFilter !== 'all', !!dateFrom, !!dateTo, !!minAmount, !!maxAmount
  ].filter(Boolean).length;

  const cols = isAdmin ? 7 : 5;

  // Count by status for summary chips
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <ShoppingCart size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">{isAdmin ? 'All Orders' : 'My Orders'}</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage and advance order fulfilment through the pipeline.'
              : 'View your order history and track shipments.'}
          </p>
        </div>
        <button onClick={fetchOrders} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Pipeline legend */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-2.5">
          <span className="font-semibold text-foreground mr-1">Pipeline:</span>
          {STATUS_PIPELINE.map((s, i) => (
            <span key={s} className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => { setParam('status', s); setTempFilters(f => ({ ...f, status: s })); }}
                className={`font-medium px-2 py-0.5 rounded-full transition-all ${statusFilter === s ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
                {statusCounts[s] ? ` (${statusCounts[s]})` : ''}
              </button>
              {i < STATUS_PIPELINE.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
            </span>
          ))}
          {statusFilter !== 'all' && (
            <button onClick={() => setParam('status', 'all')} className="ml-auto text-destructive hover:underline flex flex-wrap items-center gap-1 text-xs">
              <X size={11} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── UPI Pending Payment Verification Banner (Admin Only) ── */}
      {isAdmin && pendingUpi.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-amber-200 dark:border-amber-700 bg-amber-100/50 dark:bg-amber-900/30">
            <QrCode size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                {pendingUpi.length} UPI Payment{pendingUpi.length > 1 ? 's' : ''} Pending Verification
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Customers have submitted UTR numbers — verify to advance their orders
              </p>
            </div>
            <Clock size={15} className="text-amber-500 animate-pulse" />
          </div>
          <div className="divide-y divide-amber-200/60 dark:divide-amber-700/40">
            {pendingUpi.map(order => {
              const payment = order.payment;
              const customer = order.customer?.user;
              return (
                <div key={order.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {customer?.firstName} {customer?.lastName}
                      </span>
                      <span className="font-bold text-primary text-sm">₹{order.total?.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      <span className="font-semibold">UTR:</span>
                      <span className="font-mono ml-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-200">
                        {payment?.utrNumber || '—'}
                      </span>
                      {payment?.upiVpa && <span className="ml-2">UPI: {payment.upiVpa}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => handleVerifyUpi(order.id, 'APPROVE')}
                      disabled={verifyingId === order.id}
                      className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      {verifyingId === order.id ? 'Verifying...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectModal(order)}
                      disabled={verifyingId === order.id}
                      className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject UPI Payment Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex flex-wrap items-center gap-2">
                <XCircle size={18} className="text-destructive" /> Reject UPI Payment
              </h2>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="p-1.5 rounded-lg hover:bg-muted">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
                <p className="font-semibold mb-1">Order #{rejectModal.id?.slice(-8).toUpperCase()}</p>
                <p>UTR: <span className="font-mono">{rejectModal.payment?.utrNumber || '—'}</span></p>
                <p>Amount: ₹{rejectModal.total?.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Reason for rejection <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR number not found in our account, Invalid payment amount..."
                  rows={3}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Customer will be notified with this reason and the order will remain on hold.</p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyUpi(rejectModal.id, 'REJECT', rejectReason)}
                disabled={!rejectReason.trim() || verifyingId === rejectModal.id}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {verifyingId === rejectModal.id ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="bg-white dark:bg-slate-950 border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative flex-1 sm:max-w-5xl w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer..."
              value={searchTerm}
              onChange={e => setParam('q', e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {/* Advanced filter toggle */}
            <button
              onClick={() => { setShowFilters(v => !v); setTempFilters({ status: statusFilter, from: dateFrom, to: dateTo, minAmt: minAmount, maxAmt: maxAmount }); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-primary/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-border text-foreground hover:border-primary'
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
              onClick={fetchOrders}
              className="p-2 border border-border text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Expanded Filter Panel ── */}
        {showFilters && (
          <div className="border-b border-border bg-muted/20 px-6 py-5">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Status */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Status</label>
                <select
                  value={tempFilters.status}
                  onChange={e => setTempFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  {['REQUESTED','PENDING','PROCESSING','PACKAGED','DISPATCHED','DELIVERED','CANCELLED'].map(s => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              {/* Date From */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <Calendar size={11} className="inline mr-1" />From Date
                </label>
                <input
                  type="date"
                  value={tempFilters.from}
                  onChange={e => setTempFilters(f => ({ ...f, from: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Date To */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <Calendar size={11} className="inline mr-1" />To Date
                </label>
                <input
                  type="date"
                  value={tempFilters.to}
                  onChange={e => setTempFilters(f => ({ ...f, to: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Min Amount */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-1" />Min Amount
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={tempFilters.minAmt}
                  onChange={e => setTempFilters(f => ({ ...f, minAmt: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Max Amount */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-1" />Max Amount
                </label>
                <input
                  type="number"
                  placeholder="₹ ∞"
                  value={tempFilters.maxAmt}
                  onChange={e => setTempFilters(f => ({ ...f, maxAmt: e.target.value }))}
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
          <div className="px-4 py-2 border-b border-border flex flex-wrap gap-2">
            {statusFilter !== 'all' && (
              <span className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[statusFilter] || 'bg-primary'}`} />
                {statusFilter}
                <button onClick={() => setParam('status', 'all')} className="ml-0.5 hover:opacity-70"><X size={10} /></button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                From: {dateFrom} <button onClick={() => setParam('from', '')}><X size={10} /></button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                To: {dateTo} <button onClick={() => setParam('to', '')}><X size={10} /></button>
              </span>
            )}
            {minAmount && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                Min: ₹{minAmount} <button onClick={() => setParam('minAmt', '')}><X size={10} /></button>
              </span>
            )}
            {maxAmount && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                Max: ₹{maxAmount} <button onClick={() => setParam('maxAmt', '')}><X size={10} /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive ml-auto">Clear all</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary/5">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('id')}>
                  <div className="flex flex-wrap items-center gap-1">Order ID <ArrowUpDown size={12} className={sortField === 'id' ? 'text-primary' : ''} /></div>
                </th>
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('createdAt')}>
                  <div className="flex flex-wrap items-center gap-1">Date <ArrowUpDown size={12} className={sortField === 'createdAt' ? 'text-primary' : ''} /></div>
                </th>
                {isAdmin && <th className="data-table-cell text-left">Customer</th>}
                <th className="data-table-cell text-left cursor-pointer hover:text-foreground" onClick={() => toggleSort('total')}>
                  <div className="flex flex-wrap items-center gap-1">Total <ArrowUpDown size={12} className={sortField === 'total' ? 'text-primary' : ''} /></div>
                </th>
                <th className="data-table-cell text-left">Status</th>
                {isAdmin && <th className="data-table-cell text-left">Advance</th>}
                <th className="data-table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SkeletonTableBody rows={5} columns={cols} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={cols} className="px-6 py-16 text-center">
                    <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">No orders found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? 'Try adjusting your filters.' : 'No orders have been placed yet.'}
                    </p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">Clear filters</button>
                    )}
                  </td>
                </tr>
              ) : orders.map(order => {
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
                    {isAdmin && (
                      <td className="data-table-cell">
                        <div className="font-semibold text-foreground text-xs">
                          {order.customer?.companyName || 'Retail Customer'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.customer?.user?.firstName} {order.customer?.user?.lastName}
                        </div>
                      </td>
                    )}
                    <td className="data-table-cell font-semibold text-foreground">
                      ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="data-table-cell">
                      <span className={STATUS_STYLES[order.status] || 'badge badge-secondary'}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>
                      {order.lastHandledBy && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[120px]" title={`Handled by ${order.lastHandledBy}`}>
                          👤 {order.lastHandledBy}
                        </p>
                      )}
                      {order.paymentMethod && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {order.paymentMethod === 'PAY_ON_DELIVERY' ? '🏷️ COD' : order.paymentMethod === 'RAZORPAY' ? '💳 Online' : order.paymentMethod === 'UPI_DIRECT' ? '📱 UPI' : '💰'}
                        </p>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="data-table-cell">
                        {canAdvance ? (
                          <button
                            onClick={() => handleAdvance(order.id)}
                            disabled={!!advancing[order.id]}
                            className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {advancing[order.id] ? (
                              <span className="flex flex-wrap items-center gap-1.5">
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
                          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/70 rounded-xl transition-colors"
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

        {/* Footer summary */}
        {orders.length > 0 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{orders.length} order{orders.length !== 1 ? 's' : ''} shown</span>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusCounts).map(([s, c]) => (
                <span key={s} className="flex flex-wrap items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[s] || 'bg-muted'}`} />
                  {c} {s.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
