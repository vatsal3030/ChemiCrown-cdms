import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ArrowLeft, Package, MapPin, Truck, CheckCircle2,
  Clock, XCircle, RefreshCw, Star, ChevronRight, AlertTriangle,
  RotateCcw, Building2, Phone, Mail, Hash, ExternalLink, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '@/components/ReviewModal';

const STATUS_CONFIG = {
  REQUESTED:  { label: 'Requested',  color: 'badge-info',        icon: Clock },
  PENDING:    { label: 'Pending',    color: 'badge-warning',     icon: Clock },
  PROCESSING: { label: 'Processing', color: 'badge-secondary',   icon: RefreshCw },
  PACKAGED:   { label: 'Packaged',   color: 'badge-secondary',   icon: Package },
  DISPATCHED: { label: 'Dispatched', color: 'badge-info',        icon: Truck },
  DELIVERED:  { label: 'Delivered',  color: 'badge-success',     icon: CheckCircle2 },
  CANCELLED:  { label: 'Cancelled',  color: 'badge-destructive', icon: XCircle },
};

const TIMELINE = ['REQUESTED', 'PENDING', 'PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const NEXT_ACTION = {
  REQUESTED:  { label: 'Mark as Pending',   note: 'Payment/COD verification complete. Move to Pending.' },
  PENDING:    { label: 'Start Processing',  note: 'Begin preparing the order.' },
  PROCESSING: { label: 'Mark as Packaged',  note: 'Order packed and ready for dispatch.' },
  PACKAGED:   { label: 'Dispatch Order',    note: 'Handing over to logistics.' },
  DISPATCHED: { label: 'Mark as Delivered', note: 'Customer has received the order.' },
};

export default function OrderDetails() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { confirm, prompt } = useDialog();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceNote, setAdvanceNote] = useState('');
  const [reviewModal, setReviewModal] = useState({ open: false, item: null });
  const [cancelling, setCancelling] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  // Logistics state
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Reviews state (mapping: productId -> review)
  const [reviews, setReviews] = useState({});

  // Admin refund notes & loading
  const [refundAdminNotes, setRefundAdminNotes] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES'].includes(user?.role);
  const isCustomer = user?.role === 'CUSTOMER';

  const getOrder = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOrder(json.data);
      else toast.error(json.error || 'Failed to load order');
    } catch { toast.error('Network error while loading order'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    getOrder();
  }, [id, token]);

  // Prefill driver details from order if already set
  useEffect(() => {
    if (order) {
      if (order.driverName) setDriverName(order.driverName);
      if (order.driverPhone) setDriverPhone(order.driverPhone);
      if (order.vehicleNumber) setVehicleNumber(order.vehicleNumber);
    }
  }, [order]);

  // Fetch reviews for each item in the order
  useEffect(() => {
    if (order?.items) {
      if (isCustomer) {
        order.items.forEach(item => {
          fetch(`${import.meta.env.VITE_API_URL}/api/reviews/my/${item.productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            if (data.review) {
              setReviews(prev => ({ ...prev, [item.productId]: data.review }));
            }
          })
          .catch(() => {});
        });
      } else if (isAdmin) {
        order.items.forEach(item => {
          fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${item.productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.data)) {
              const customerReview = data.data.find(r => r.customerId === order.customerId);
              if (customerReview) {
                setReviews(prev => ({ ...prev, [item.productId]: customerReview }));
              }
            }
          })
          .catch(() => {});
        });
      }
    }
  }, [order, isCustomer, isAdmin, token]);

  const handleAdvance = async () => {
    if (advancing) return;
    const previousStatus = order.status;
    const previousHistory = order.history ? [...order.history] : [];
    
    const currentIndex = TIMELINE.indexOf(order.status);
    const nextStatus = TIMELINE[currentIndex + 1];
    if (!nextStatus) return;

    // Validate driver details for DISPATCHED or DELIVERED stages (if not already filled)
    const isLogisticsStage = nextStatus === 'DISPATCHED' || nextStatus === 'DELIVERED';
    const isAlreadyAssigned = order.driverName && order.vehicleNumber;
    if (isLogisticsStage && !isAlreadyAssigned && (!driverName.trim() || !vehicleNumber.trim())) {
      toast.error('Driver Name and Vehicle Number are required for dispatch/delivery phases.');
      return;
    }

    // Optimistically update order status and append note/history
    setOrder(prev => ({ 
      ...prev, 
      status: nextStatus,
      driverName: driverName || prev.driverName,
      driverPhone: driverPhone || prev.driverPhone,
      vehicleNumber: vehicleNumber || prev.vehicleNumber,
      history: [
        {
          id: 'temp-' + Date.now(),
          status: nextStatus,
          createdAt: new Date().toISOString(),
          note: advanceNote,
          user: { firstName: user.firstName, lastName: user.lastName }
        },
        ...(prev.history || [])
      ]
    }));
    setAdvancing(true);

    // Instant success toast
    toast.success(`Order advanced to ${nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}`);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          note: advanceNote,
          driverName: driverName.trim() || undefined,
          driverPhone: driverPhone.trim() || undefined,
          vehicleNumber: vehicleNumber.trim() || undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        // Sync exact data (status, history, etc.)
        setOrder(prev => ({ ...prev, ...json.data }));
        setAdvanceNote('');
      } else {
        toast.error(json.error || 'Failed to advance status. Reverting...');
        setOrder(prev => ({ ...prev, status: previousStatus, history: previousHistory })); // Rollback
      }
    } catch { 
      toast.error('Network error. Reverting status update.'); 
      setOrder(prev => ({ ...prev, status: previousStatus, history: previousHistory })); // Rollback
    } finally { 
      setAdvancing(false); 
    }
  };

  const handleProcessRefund = async (statusToSet) => {
    if (!order.refund?.id) return;
    setProcessingRefund(true);
    
    // Optimistic update
    setOrder(prev => ({
      ...prev,
      status: statusToSet === 'PROCESSED' ? 'REFUNDED' : prev.status,
      refund: {
        ...prev.refund,
        status: statusToSet,
        notes: refundAdminNotes
      }
    }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/refunds/${order.refund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusToSet, notes: refundAdminNotes })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Refund status marked as ${statusToSet}`);
        setRefundAdminNotes('');
        getOrder();
      } else {
        toast.error(data.error || 'Failed to update refund status.');
        getOrder();
      }
    } catch {
      toast.error('Network error updating refund status.');
      getOrder();
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleVerifyCod = async () => {
    const previousStatus = order.status;
    const previousHistory = order.history ? [...order.history] : [];

    setOrder(prev => ({
      ...prev,
      status: 'PROCESSING',
      history: [
        {
          id: 'temp-cod-' + Date.now(),
          status: 'PROCESSING',
          createdAt: new Date().toISOString(),
          note: 'COD verification completed by admin',
          user: { firstName: user.firstName, lastName: user.lastName }
        },
        ...(prev.history || [])
      ]
    }));

    // Instant success toast
    toast.success('COD order verified successfully');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/verify-cod`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        toast.error(data.error || 'Failed to verify COD order. Reverting...');
        setOrder(prev => ({ ...prev, status: previousStatus, history: previousHistory })); // Rollback
      }
    } catch {
      toast.error('Network error. Reverting COD verification.');
      setOrder(prev => ({ ...prev, status: previousStatus, history: previousHistory })); // Rollback
    }
  };

  const handleCancelOrder = async () => {
    const reason = await prompt('Cancel Order', 'Reason for cancellation (optional):', '', { placeholder: 'e.g. Changed my mind' });
    if (reason === null) return;
    const ok = await confirm('Confirm Cancellation', `Are you sure you want to cancel order #${id.substring(0, 8).toUpperCase()}? This cannot be undone.`, { type: 'danger' });
    if (!ok) return;
    
    const previousStatus = order.status;
    const previousHistory = order.history ? [...order.history] : [];
    
    setOrder(prev => ({
      ...prev,
      status: 'CANCELLED',
      history: [
        {
          id: 'temp-cancel-' + Date.now(),
          status: 'CANCELLED',
          createdAt: new Date().toISOString(),
          note: reason?.trim() || 'Order cancelled',
          user: { firstName: user.firstName, lastName: user.lastName }
        },
        ...(prev.history || [])
      ]
    }));
    setCancelling(true);

    // Instant success toast
    toast.success('Order cancelled successfully.');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) {
        if (json.refundAmount > 0) {
          toast.success(`Refund of ₹${json.refundAmount.toFixed(2)} will be processed in ${json.estimatedRefundDays}.`, { duration: 6000 });
        }
      } else {
        toast.error(json.error || 'Failed to cancel order. Reverting...');
        setOrder(prev => ({ ...prev, status: previousStatus, history: previousHistory })); // Rollback
      }
    } catch { 
      toast.error('Network error. Reverting cancellation.'); 
      setOrder(prev => ({ ...prev, status: previousStatus, history: previousHistory })); // Rollback
    } finally { 
      setCancelling(false); 
    }
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) { toast.error('Please provide a reason for refund'); return; }
    setRefunding(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: refundReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Refund request submitted successfully!');
        setRefundModal(false);
        setRefundReason('');
        getOrder();
      } else {
        toast.error(data.error || 'Failed to submit refund request.');
      }
    } catch {
      toast.error('Network error submitting refund request.');
    } finally { setRefunding(false); }
  };

  if (loading) return (
    <div className="space-y-4 max-w-[1600px] px-4 md:px-8 mx-auto animate-pulse">
      <div className="h-8 w-64 bg-muted rounded-xl" />
      <div className="h-40 bg-muted rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-48 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="max-w-[1600px] px-4 md:px-8 mx-auto text-center py-16">
      <Package size={48} className="mx-auto mb-4 text-muted-foreground/40" />
      <p className="font-semibold text-foreground">Order not found.</p>
      <Button variant="outline" onClick={() => navigate('/dashboard/orders')} className="mt-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Orders
      </Button>
    </div>
  );

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const currentStep = ['REFUND_REQUESTED', 'REFUNDED'].includes(order.status)
    ? TIMELINE.length - 1
    : TIMELINE.indexOf(order.status);
  const canAdvance = isAdmin && !isDelivered && !isCancelled && NEXT_ACTION[order.status];
  const subtotal = order.items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  const shipping = order.distanceCost || 0;
  const tax = order.taxAmount || 0;
  const total = order.total || subtotal;

  return (
    <div className="space-y-4 max-w-[1600px] px-4 md:px-8 mx-auto animate-in fade-in duration-500">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
            Order #{order.id.substring(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-muted-foreground">
            Placed on {fmt(order.createdAt)}
          </p>
        </div>
        <span className={`badge ${statusCfg.color} shrink-0`}>
          <StatusIcon size={11} /> {statusCfg.label}
        </span>
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {/* Invoice — available from PROCESSING onwards */}
          {['PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'].includes(order.status) && (
            <Link
              to={`/dashboard/orders/${order.id}/invoice`}
              className={`${buttonVariants({ variant: 'outline', size: 'sm' })} border-primary/30 text-primary hover:bg-primary/5 text-xs h-8 px-3`}
            >
              <FileText size={13} className="mr-1" /> Invoice
            </Link>
          )}
          {/* Delivery Challan — admin only, from PACKAGED onwards */}
          {isAdmin && ['PACKAGED', 'DISPATCHED', 'DELIVERED'].includes(order.status) && (
            <Link
              to={`/dashboard/orders/${order.id}/challan`}
              className={`${buttonVariants({ variant: 'outline', size: 'sm' })} border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 text-xs h-8 px-3`}
            >
              <Truck size={13} className="mr-1" /> Challan
            </Link>
          )}
          {/* Cancel — available before dispatched */}
          {!isCancelled && !isDelivered && order.status !== 'DISPATCHED' && (
            <Button variant="outline" size="sm" disabled={cancelling} onClick={handleCancelOrder}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-8 px-3">
              <XCircle size={13} className="mr-1" />
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </Button>
          )}
          {/* Refund — only for delivered orders as customer */}
          {isDelivered && isCustomer && (
            <Button variant="outline" size="sm" onClick={() => setRefundModal(true)}
              className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs h-8 px-3">
              <RotateCcw size={13} className="mr-1" /> Refund Request
            </Button>
          )}
        </div>
      </div>

      {/* ── Refund Status Banner ── */}
      {order.refund && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-amber-600 shrink-0" size={16} />
            <div>
              <p className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Refund Status: <span className="uppercase font-extrabold">{order.refund.status}</span>
              </p>
              <p className="text-xs text-amber-705 dark:text-amber-400">
                Requested by customer on {fmt(order.refund.createdAt)}
              </p>
            </div>
          </div>
          {order.refund.reason && (
            <p className="text-xs text-amber-800 dark:text-amber-350 italic pl-6">
              "Reason: {order.refund.reason}"
            </p>
          )}
          {order.refund.notes && (
            <p className="text-xs text-amber-900 dark:text-amber-200 pl-6 font-semibold">
              Admin Processing Notes: {order.refund.notes}
            </p>
          )}
        </div>
      )}

      {/* ── Admin Advance Panel ── */}
      {isAdmin && canAdvance && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ChevronRight size={15} className="text-primary shrink-0" />
            <p className="font-bold text-sm text-foreground">Next: {NEXT_ACTION[order.status]?.label}</p>
            <p className="text-xs text-muted-foreground hidden sm:block">— {NEXT_ACTION[order.status]?.note}</p>
          </div>

          {/* Logistics Inputs (required when advancing to dispatched or delivered, and not already assigned) */}
          {(TIMELINE[currentStep + 1] === 'DISPATCHED' || TIMELINE[currentStep + 1] === 'DELIVERED') && !(order.driverName && order.vehicleNumber) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Driver Name *</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={e => setDriverPhone(e.target.value)}
                  placeholder="Enter contact number"
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value)}
                  placeholder="GJ-04-XX-1234"
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 border-t border-border/40 pt-2.5">
            <input type="text" value={advanceNote} onChange={e => setAdvanceNote(e.target.value)}
              placeholder="Optional progress/status update note..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button onClick={handleAdvance} disabled={advancing} size="sm" className="shrink-0">
              {advancing ? <span className="flex flex-wrap items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Advancing…</span>
                : <><ChevronRight size={14} className="mr-1" />{NEXT_ACTION[order.status]?.label}</>}
            </Button>
          </div>
        </div>
      )}

      {/* ── Admin Refund Approval Panel ── */}
      {isAdmin && order.status === 'REFUND_REQUESTED' && order.refund?.status === 'PENDING' && (
        <div className="bg-rose-50 border-2 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-rose-600" />
            <div>
              <p className="font-bold text-sm text-rose-950 dark:text-rose-200">
                Action Required: Review Refund Request
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Requested by customer. Approve to process refund and return items to stock.
              </p>
            </div>
          </div>
          
          <div className="bg-white/85 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Customer Reason</p>
            <p className="text-sm text-foreground italic mt-0.5">"{order.refund.reason}"</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Admin Processing Notes (Optional)</label>
            <textarea
              value={refundAdminNotes}
              onChange={e => setRefundAdminNotes(e.target.value)}
              rows={2}
              placeholder="Enter payment payout UTR, instructions, or rejection reasons..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-foreground resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleProcessRefund('PROCESSED')}
              disabled={processingRefund}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 font-bold text-xs py-2 h-9"
            >
              Approve & Refund
            </Button>
            <Button
              onClick={() => handleProcessRefund('FAILED')}
              disabled={processingRefund}
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 flex-1 font-bold text-xs py-2 h-9"
            >
              Reject Refund
            </Button>
          </div>
        </div>
      )}

      {/* ── COD Verify ── */}
      {isAdmin && order.status === 'REQUESTED' && order.payment?.paymentMethod === 'PAY_ON_DELIVERY' && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">Pay on Delivery — Pending Verification</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Manually verify to move to Processing.</p>
            </div>
          </div>
          <Button onClick={handleVerifyCod} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
            <CheckCircle2 size={14} className="mr-1.5" /> Verify COD
          </Button>
        </div>
      )}

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* LEFT COLUMN: Timeline & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Progress Timeline ── */}
          {!isCancelled && (
            <div className="form-card overflow-x-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Order Progress</p>
              <div className="flex items-center min-w-[440px]">
                 {TIMELINE.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  const Ic = STATUS_CONFIG[step]?.icon || Clock;
                  
                  const stepColors = {
                    REQUESTED:  'bg-sky-500 text-white shadow-sky-500/20',
                    PENDING:    'bg-amber-500 text-white shadow-amber-500/20',
                    PROCESSING: 'bg-violet-500 text-white shadow-violet-500/20',
                    PACKAGED:   'bg-indigo-500 text-white shadow-indigo-500/20',
                    DISPATCHED: 'bg-blue-500 text-white shadow-blue-500/20',
                    DELIVERED:  'bg-emerald-500 text-white shadow-emerald-500/20',
                  };

                  let circleStyle = 'bg-muted text-muted-foreground';
                  if (active) {
                    circleStyle = 'bg-green-600 text-white shadow-md shadow-green-600/30 ring-4 ring-green-600/20 scale-110';
                  } else if (done) {
                    circleStyle = stepColors[step] || 'bg-primary text-white';
                  }

                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${circleStyle}`}>
                          <Ic size={13} />
                        </div>
                        <span className={`text-[9px] font-semibold text-center leading-tight whitespace-nowrap ${done ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                          {STATUS_CONFIG[step]?.label}
                        </span>
                      </div>
                      {idx < TIMELINE.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500 ${done ? 'bg-primary/70' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Items Ordered ── */}
          <div className="form-card">
            <h2 className="font-bold text-sm text-foreground mb-3">Items Ordered</h2>
        <div className="divide-y divide-border">
            {order.items?.map((item) => {
              const review = reviews[item.productId];
              return (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 border-b border-border last:border-0">
                  <div className="flex items-start gap-3">
                    {/* Product image — clickable link to catalog */}
                    <Link
                      to={`/dashboard/catalog/${item.productId || item.product?.id}`}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-border hover:border-primary transition-colors"
                      title="View product details"
                    >
                      {item.product?.imageUrls?.length > 0
                        ? <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        : <Package size={18} className="text-muted-foreground" />}
                    </Link>
                    {/* Name + details */}
                    <div className="flex-1 min-w-0">
                      {/* Product name — clickable link */}
                      <Link
                        to={`/dashboard/catalog/${item.productId || item.product?.id}`}
                        className="font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors inline-flex flex-wrap items-center gap-1"
                      >
                        {item.product?.name}
                        <ExternalLink size={10} className="opacity-40" />
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ₹{Number(item.price).toFixed(2)} / {item.product?.unit}
                      </p>
                      {item.product?.casNumber && (
                        <p className="text-[10px] text-muted-foreground font-mono">CAS: {item.product.casNumber}</p>
                      )}
                      {(item.hsnCode || item.product?.hsnCode) && (
                        <p className="text-[10px] text-muted-foreground font-mono">HSN: {item.hsnCode || item.product?.hsnCode}{item.gstRate ? ` · GST ${item.gstRate}%` : ''}</p>
                      )}
                      {/* Review button — only for delivered orders */}
                      {isDelivered && isCustomer && (
                        <button
                          onClick={() => setReviewModal({ open: true, item })}
                          className="mt-1.5 inline-flex flex-wrap items-center gap-1 text-xs text-primary font-semibold hover:underline"
                        >
                          <Star size={11} className="fill-current" /> Write / Edit Review
                        </button>
                      )}
                    </div>
                    {/* Line total */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-foreground">₹{Number(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Inline review if already written by user */}
                  {review && (
                    <div className="mt-2.5 ml-15 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-300'}`} />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {isCustomer ? 'You reviewed this product' : 'Customer reviewed this product'}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-foreground italic font-medium">"{review.comment}"</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>

          {/* ── Status History ── */}
          {order.history && order.history.length > 0 && (
            <div className="form-card">
              <h2 className="font-bold text-sm text-foreground mb-4">Status History</h2>
              <div className="space-y-4">
                {order.history.map((history, idx) => {
                  const hStatus = history.status || history.newStatus;
                  return (
                    <div key={history.id} className="relative pl-6">
                      {/* Timeline line */}
                      {idx !== order.history.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border" />
                      )}
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background ${STATUS_CONFIG[hStatus]?.color || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {(() => {
                          const Icon = STATUS_CONFIG[hStatus]?.icon || Clock;
                          return <Icon size={10} className="shrink-0" />;
                        })()}
                      </div>
                      {/* Content */}
                      <div>
                        <p className="font-semibold text-sm text-foreground">{STATUS_CONFIG[hStatus]?.label || hStatus}</p>
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {fmt(history.changedAt || history.createdAt)}
                        </p>
                        {history.note && (
                          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg mt-1 border border-border">
                            {history.note}
                          </p>
                        )}
                        {history.user && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Handled by: <span className="font-medium text-foreground">{history.user.firstName} {history.user.lastName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Summary, Address, Payment */}
        <div className="space-y-6">
        {/* Order Summary */}
          <div className="form-card">
            <h2 className="font-bold text-sm text-foreground mb-3">Order Summary</h2>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {shipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">₹{shipping.toFixed(2)}</span>
                </div>
              )}
              {/* GST breakup */}
              {order.cgstTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST</span>
                  <span className="font-medium">₹{Number(order.cgstTotal).toFixed(2)}</span>
                </div>
              )}
              {order.sgstTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST</span>
                  <span className="font-medium">₹{Number(order.sgstTotal).toFixed(2)}</span>
                </div>
              )}
              {order.igstTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IGST</span>
                  <span className="font-medium">₹{Number(order.igstTotal).toFixed(2)}</span>
                </div>
              )}
              {/* Fallback: show total tax if no breakup data */}
              {!order.cgstTotal && !order.sgstTotal && !order.igstTotal && tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{Number(total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="form-card">
            <h2 className="font-bold text-sm text-foreground mb-2 flex flex-wrap items-center gap-1.5">
              <MapPin size={13} className="text-muted-foreground" /> Shipping Info
            </h2>
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground text-sm">
                {order.customer?.companyName || `${order.customer?.user?.firstName || ''} ${order.customer?.user?.lastName || ''}`.trim()}
              </p>
              <p className="text-muted-foreground leading-relaxed">{order.shippingAddress || order.customer?.address || 'Address not provided'}</p>
              {order.customer?.user?.phone && <p className="text-muted-foreground">📞 {order.customer.user.phone}</p>}
              {order.customer?.user?.email && <p className="text-muted-foreground break-all">✉ {order.customer.user.email}</p>}
            </div>
          </div>

          {/* Delivery & Tracking Info */}
          {order.history?.find(h => (h.status === 'DISPATCHED' || h.newStatus === 'DISPATCHED'))?.note && (
            <div className="form-card border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
              <h2 className="font-bold text-sm text-indigo-700 dark:text-indigo-300 mb-2 flex flex-wrap items-center gap-1.5">
                <Truck size={13} /> Delivery & Tracking
              </h2>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-foreground">
                  Status: Dispatched
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {order.history.find(h => (h.status === 'DISPATCHED' || h.newStatus === 'DISPATCHED')).note}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Dispatched on {fmt(order.history.find(h => (h.status === 'DISPATCHED' || h.newStatus === 'DISPATCHED'))?.changedAt || order.history.find(h => (h.status === 'DISPATCHED' || h.newStatus === 'DISPATCHED'))?.createdAt)}
                </p>
              </div>
            </div>
          )}

          {/* Driver & Logistics Info */}
          {(order.driverName || order.vehicleNumber) && (isAdmin || ['DISPATCHED', 'DELIVERED'].includes(order.status)) && (
            <div className="form-card border-indigo-250 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
              <h2 className="font-bold text-sm text-indigo-700 dark:text-indigo-350 mb-2 flex items-center gap-1.5">
                <Truck size={13} className="text-indigo-600 dark:text-indigo-400" /> Driver & Logistics Info
              </h2>
              <div className="text-xs space-y-1.5">
                {order.driverName && (
                  <div>
                    <span className="text-muted-foreground">Driver Name:</span>
                    <p className="font-bold text-foreground text-sm">{order.driverName}</p>
                  </div>
                )}
                {order.driverPhone && (
                  <div>
                    <span className="text-muted-foreground">Driver Contact:</span>
                    <p className="font-semibold text-foreground">
                      📞 <a href={`tel:${order.driverPhone}`} className="hover:underline">{order.driverPhone}</a>
                    </p>
                  </div>
                )}
                {order.vehicleNumber && (
                  <div>
                    <span className="text-muted-foreground">Vehicle Number:</span>
                    <div>
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded inline-block">
                        {order.vehicleNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Manager */}
          {order.assignedSales && (
            <div className="form-card border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10">
              <h2 className="font-bold text-sm text-violet-700 dark:text-violet-300 mb-2 flex flex-wrap items-center gap-1.5">
                <Building2 size={13} /> Account Manager
              </h2>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-foreground">
                  {order.assignedSales.firstName} {order.assignedSales.lastName}
                </p>
                {order.assignedSales.phone && (
                  <p className="text-muted-foreground">
                    📞 <a href={`tel:${order.assignedSales.phone}`} className="hover:underline">{order.assignedSales.phone}</a>
                  </p>
                )}
                {order.assignedSales.email && (
                  <p className="text-muted-foreground break-all">
                    ✉ <a href={`mailto:${order.assignedSales.email}`} className="hover:underline">{order.assignedSales.email}</a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment */}
          {order.payment && (
            <div className="form-card">
              <h2 className="font-bold text-sm text-foreground mb-2">Payment</h2>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{order.payment?.paymentMethod?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold ${order.payment?.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.payment?.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Admin-only: Customer Business Info */}
          {isAdmin && order.customer && (
            <div className="form-card border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
              <h2 className="font-bold text-sm text-foreground mb-2 flex flex-wrap items-center gap-1.5">
                <Building2 size={13} className="text-blue-600" /> Customer Info
              </h2>
              <div className="text-xs space-y-1.5">
                {order.customer.companyName && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Building2 size={11} className="text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">{order.customer.companyName}</span>
                  </div>
                )}
                {order.customer.gstNumber && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Hash size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">GST:</span>
                    <span className="font-mono font-semibold text-foreground">{order.customer.gstNumber}</span>
                  </div>
                )}
                {order.customer.user?.phone && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Phone size={11} className="text-muted-foreground shrink-0" />
                    <a href={`tel:${order.customer.user.phone}`} className="text-primary hover:underline">{order.customer.user.phone}</a>
                  </div>
                )}
                {order.customer.user?.email && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Mail size={11} className="text-muted-foreground shrink-0" />
                    <a href={`mailto:${order.customer.user.email}`} className="text-primary hover:underline break-all">{order.customer.user.email}</a>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-blue-200 dark:border-blue-800">
                  <span className="text-muted-foreground">Customer ID:</span>
                  <span className="font-mono text-[10px] text-foreground">{order.customerId}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.orderNotes && (
            <div className="form-card">
              <h2 className="font-bold text-sm text-foreground mb-1.5">Notes</h2>
              <p className="text-xs text-muted-foreground">{order.orderNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Review Modal ── */}
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, item: null })}
        orderItem={reviewModal.item}
        token={token}
        onSuccess={() => toast.success('Thank you for your review!')}
      />

      {/* ── Refund Request Modal ── */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-5xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground flex flex-wrap items-center gap-2">
                <RotateCcw size={16} className="text-amber-600" /> Refund Request
              </h2>
              <button onClick={() => setRefundModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <XCircle size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Order <span className="font-mono font-semibold">#{id.substring(0, 8).toUpperCase()}</span> — Total ₹{Number(total).toFixed(2)}
              </p>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Reason for Refund <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Describe the issue (e.g. product damaged, wrong item received, quality issue)..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{refundReason.length}/500</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠ Refund requests are reviewed within 2–3 business days. Valid refunds are processed within 5–7 working days.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button variant="outline" onClick={() => setRefundModal(false)} className="flex-1" disabled={refunding}>Cancel</Button>
                <Button onClick={handleRefundRequest} disabled={refunding || !refundReason.trim()} className="flex-1">
                  {refunding ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
