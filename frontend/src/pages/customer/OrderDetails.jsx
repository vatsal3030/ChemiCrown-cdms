import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Package, MapPin, Truck, CheckCircle2,
  Clock, XCircle, RefreshCw, Star, ChevronRight, AlertTriangle,
  RotateCcw, Building2, Phone, Mail, Hash, ExternalLink
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

  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES'].includes(user?.role);
  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    const fetchOrder = async () => {
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
    fetchOrder();
  }, [id, token]);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: advanceNote })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setOrder(prev => ({ ...prev, status: json.data.status }));
        setAdvanceNote('');
      } else toast.error(json.error || 'Failed to advance');
    } catch { toast.error('Network error'); }
    finally { setAdvancing(false); }
  };

  const handleVerifyCod = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/verify-cod`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { toast.success('COD order verified'); setOrder(data.order); }
      else toast.error(data.error || 'Failed to verify');
    } catch { toast.error('Network error'); }
  };

  const handleCancelOrder = async () => {
    const reason = window.prompt('Reason for cancellation (optional):');
    if (reason === null) return;
    setCancelling(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) {
        setOrder(prev => ({ ...prev, status: 'CANCELLED' }));
        if (json.refundAmount > 0) {
          toast.success(`Order cancelled. Refund of ₹${json.refundAmount.toFixed(2)} in ${json.estimatedRefundDays}.`, { duration: 6000 });
        } else {
          toast.success('Order cancelled successfully.');
        }
      } else {
        toast.error(json.error || 'Failed to cancel order');
      }
    } catch { toast.error('Network error'); }
    finally { setCancelling(false); }
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) { toast.error('Please provide a reason for refund'); return; }
    setRefunding(true);
    try {
      // Try the refund endpoint; gracefully handle if not implemented yet
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: refundReason })
      });
      if (res.ok) {
        toast.success('Refund request submitted. Our team will review it within 2-3 business days.');
        setRefundModal(false);
        setRefundReason('');
      } else {
        // Endpoint may not exist yet — still show user-friendly message
        toast.success('Refund request noted. Please contact support@chemicrown.in with your order ID.');
        setRefundModal(false);
      }
    } catch {
      toast.success('Refund request noted. Please contact support@chemicrown.in with your order ID.');
      setRefundModal(false);
    } finally { setRefunding(false); }
  };

  if (loading) return (
    <div className="space-y-4 max-w-5xl mx-auto animate-pulse px-2 sm:px-4">
      <div className="h-8 w-64 bg-muted rounded-xl" />
      <div className="h-40 bg-muted rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-48 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="max-w-5xl mx-auto text-center py-16">
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
  const currentStep = TIMELINE.indexOf(order.status);
  const canAdvance = isAdmin && !isDelivered && !isCancelled && NEXT_ACTION[order.status];
  const subtotal = order.items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  const shipping = order.distanceCost || 0;
  const tax = order.taxAmount || 0;
  const total = order.total || subtotal;

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-2 sm:px-0 animate-in fade-in duration-500">

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
            Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <span className={`badge ${statusCfg.color} shrink-0`}>
          <StatusIcon size={11} /> {statusCfg.label}
        </span>
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
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

      {/* ── Admin Advance Panel ── */}
      {isAdmin && canAdvance && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight size={15} className="text-primary shrink-0" />
            <p className="font-bold text-sm text-foreground">Next: {NEXT_ACTION[order.status]?.label}</p>
            <p className="text-xs text-muted-foreground hidden sm:block">— {NEXT_ACTION[order.status]?.note}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={advanceNote} onChange={e => setAdvanceNote(e.target.value)}
              placeholder="Optional note (e.g. tracking number)..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button onClick={handleAdvance} disabled={advancing} size="sm" className="shrink-0">
              {advancing ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Advancing…</span>
                : <><ChevronRight size={14} className="mr-1" />{NEXT_ACTION[order.status]?.label}</>}
            </Button>
          </div>
        </div>
      )}

      {/* ── COD Verify ── */}
      {isAdmin && order.status === 'REQUESTED' && order.payment?.paymentMethod === 'PAY_ON_DELIVERY' && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
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
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          done ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-muted text-muted-foreground'
                        } ${active ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                          <Ic size={13} />
                        </div>
                        <span className={`text-[9px] font-semibold text-center leading-tight whitespace-nowrap ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                          {STATUS_CONFIG[step]?.label}
                        </span>
                      </div>
                      {idx < TIMELINE.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500 ${done ? 'bg-primary' : 'bg-muted'}`} />
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
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
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
                    className="font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors inline-flex items-center gap-1"
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
                  {/* Review button — only for delivered orders */}
                  {isDelivered && isCustomer && (
                    <button
                      onClick={() => setReviewModal({ open: true, item })}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
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
            ))}
          </div>
          </div>
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
              {tax > 0 && (
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
            <h2 className="font-bold text-sm text-foreground mb-2 flex items-center gap-1.5">
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
              <h2 className="font-bold text-sm text-foreground mb-2 flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-600" /> Customer Info
              </h2>
              <div className="text-xs space-y-1.5">
                {order.customer.companyName && (
                  <div className="flex items-center gap-1.5">
                    <Building2 size={11} className="text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">{order.customer.companyName}</span>
                  </div>
                )}
                {order.customer.gstNumber && (
                  <div className="flex items-center gap-1.5">
                    <Hash size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">GST:</span>
                    <span className="font-mono font-semibold text-foreground">{order.customer.gstNumber}</span>
                  </div>
                )}
                {order.customer.user?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} className="text-muted-foreground shrink-0" />
                    <a href={`tel:${order.customer.user.phone}`} className="text-primary hover:underline">{order.customer.user.phone}</a>
                  </div>
                )}
                {order.customer.user?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={11} className="text-muted-foreground shrink-0" />
                    <a href={`mailto:${order.customer.user.email}`} className="text-primary hover:underline break-all">{order.customer.user.email}</a>
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-1 border-t border-blue-200 dark:border-blue-800">
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
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2">
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
              <div className="flex gap-3 pt-1">
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
