import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Package, MapPin, Truck, CheckCircle2,
  Clock, XCircle, RefreshCw, Star, ChevronRight, AlertTriangle
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
  REQUESTED:  { label: 'Mark as Pending',     note: 'Payment/COD verification complete. Move to Pending.' },
  PENDING:    { label: 'Start Processing',    note: 'Begin preparing the order.' },
  PROCESSING: { label: 'Mark as Packaged',    note: 'Order packed and ready for dispatch.' },
  PACKAGED:   { label: 'Dispatch Order',      note: 'Handing over to logistics.' },
  DISPATCHED: { label: 'Mark as Delivered',   note: 'Customer has received the order.' },
};

export default function OrderDetails() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceNote, setAdvanceNote] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'SALES'].includes(user?.role);
  const [cancelling, setCancelling] = useState(false);

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
    if (reason === null) return; // User clicked cancel on prompt
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
          toast.success(`Order cancelled. Refund of ₹${json.refundAmount.toFixed(2)} will be processed in ${json.estimatedRefundDays}.`, { duration: 6000 });
        } else {
          toast.success('Order cancelled successfully.');
        }
      } else {
        toast.error(json.error || 'Failed to cancel order');
      }
    } catch { toast.error('Network error'); }
    finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-80 bg-muted rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-64 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="max-w-4xl mx-auto text-center py-16">
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
  const currentStep = TIMELINE.indexOf(order.status);
  const canAdvance = isAdmin && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && NEXT_ACTION[order.status];
  const subtotal = order.items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  const shipping  = order.distanceCost || 0;
  const tax       = order.taxAmount || 0;
  const total     = order.total || subtotal;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">
            Order #{order.id.substring(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <span className={`badge ${statusCfg.color}`}>
          <StatusIcon size={12} /> {statusCfg.label}
        </span>
        {/* Cancel Order Button */}
        {!isCancelled && order.status !== 'DELIVERED' && order.status !== 'DISPATCHED' && (
          <Button
            variant="outline"
            size="sm"
            disabled={cancelling}
            onClick={handleCancelOrder}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
          >
            <XCircle size={14} className="mr-1.5" />
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}
      </div>

      {/* Admin Advance Panel */}
      {isAdmin && canAdvance && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-bold text-foreground flex items-center gap-2">
                <ChevronRight size={16} className="text-primary" />
                Next Action: {NEXT_ACTION[order.status]?.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{NEXT_ACTION[order.status]?.note}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={advanceNote}
              onChange={e => setAdvanceNote(e.target.value)}
              placeholder="Optional note for customer (e.g. courier tracking number)..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleAdvance} disabled={advancing} className="whitespace-nowrap shrink-0">
              {advancing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Advancing…
                </span>
              ) : (
                <><ChevronRight size={16} className="mr-1" />{NEXT_ACTION[order.status]?.label}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* COD Verify for admins */}
      {isAdmin && order.status === 'REQUESTED' && order.payment?.paymentMethod === 'PAY_ON_DELIVERY' && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">Pay on Delivery — Pending Verification</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">Manually verify the COD order to move it to Processing.</p>
            </div>
          </div>
          <Button onClick={handleVerifyCod} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
            <CheckCircle2 size={16} className="mr-2" /> Verify COD Order
          </Button>
        </div>
      )}

      {/* Timeline */}
      {!isCancelled && (
        <div className="form-card overflow-x-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Order Progress</p>
          <div className="flex items-center min-w-[480px]">
            {TIMELINE.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              const Ic = STATUS_CONFIG[step]?.icon || Clock;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      done
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-muted text-muted-foreground'
                    } ${active ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                      <Ic size={15} />
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight whitespace-nowrap ${
                      done ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {STATUS_CONFIG[step]?.label}
                    </span>
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 mb-5 rounded-full transition-all duration-500 ${done ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 form-card">
          <h2 className="font-bold text-foreground mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  {item.product?.imageUrls?.length > 0
                    ? <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    : <Package size={20} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.product?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × ₹{Number(item.price).toFixed(2)} / {item.product?.unit}
                  </p>
                  {item.product?.casNumber && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">CAS: {item.product.casNumber}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">₹{Number(item.quantity * item.price).toFixed(2)}</p>
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => { setSelectedProductId(item.product.id); setReviewModalOpen(true); }}
                      className="mt-1 text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Star size={11} /> Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="form-card">
            <h2 className="font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm">
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
              <div className="border-t border-border pt-2.5 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">₹{Number(total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-muted-foreground" /> Shipping Info
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">
                {order.customer?.companyName || `${order.customer?.user?.firstName || ''} ${order.customer?.user?.lastName || ''}`.trim()}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress || order.customer?.address || 'Address not provided'}</p>
              <p className="text-muted-foreground">Phone: {order.customer?.user?.phone || 'N/A'}</p>
              <p className="text-muted-foreground">Email: {order.customer?.user?.email || 'N/A'}</p>
            </div>
          </div>

          {order.payment && (
            <div className="form-card">
              <h2 className="font-bold text-foreground mb-3">Payment</h2>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{order.payment?.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${order.payment?.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.payment?.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {order.orderNotes && (
            <div className="form-card">
              <h2 className="font-bold text-foreground mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.orderNotes}</p>
            </div>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={selectedProductId}
      />
    </div>
  );
}
