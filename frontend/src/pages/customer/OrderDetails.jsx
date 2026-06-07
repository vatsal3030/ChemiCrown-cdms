import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Package, MapPin, Truck, CheckCircle2,
  Clock, XCircle, RefreshCw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '@/components/ReviewModal';

const STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', color: 'badge-info',    icon: Clock },
  PENDING:   { label: 'Pending',   color: 'badge-warning', icon: Clock },
  PROCESSING:{ label: 'Processing',color: 'badge-purple',  icon: RefreshCw },
  PACKAGED:  { label: 'Packaged',  color: 'badge-orange',  icon: Package },
  DISPATCHED:{ label: 'Dispatched',color: 'badge-info',    icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'badge-success', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'badge-error',   icon: XCircle },
};

const TIMELINE = ['REQUESTED', 'PENDING', 'PROCESSING', 'PACKAGED', 'DISPATCHED', 'DELIVERED'];

export default function OrderDetails() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setOrder(json.data);
        else toast.error(json.error || 'Failed to load order');
      } catch {
        toast.error('Network error while loading order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, token]);

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

  const subtotal = order.items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  const shipping = order.distanceCost || 0;
  const tax = order.taxAmount || 0;
  const total = order.total || subtotal;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">Order #{order.id.substring(0, 8)}…</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <span className={`badge ${statusCfg.color}`}>
          <StatusIcon size={12} />
          {statusCfg.label}
        </span>
        
        {/* Verify Pay on Delivery Button for Admins */}
        {['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role) && 
         order.status === 'REQUESTED' && 
         order.payment?.paymentMethod === 'PAY_ON_DELIVERY' && (
          <Button 
            onClick={async () => {
              try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${order.id}/verify-cod`, {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                  toast.success('Order verified successfully');
                  setOrder(data.order);
                } else {
                  toast.error(data.error || 'Failed to verify order');
                }
              } catch (err) {
                toast.error('Network error');
              }
            }}
            variant="default"
            className="ml-auto bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 size={16} className="mr-2" />
            Verify COD Order
          </Button>
        )}
      </div>

      {/* Timeline (only if not cancelled) */}
      {!isCancelled && (
        <div className="form-card">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Order Progress</p>
          <div className="flex items-center gap-0">
            {TIMELINE.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              const Ic = STATUS_CONFIG[step]?.icon || Clock;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      done ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-muted text-muted-foreground'
                    } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                      <Ic size={14} />
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                      {STATUS_CONFIG[step]?.label}
                    </span>
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${done ? 'bg-primary' : 'bg-muted'}`} />
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

        {/* Summary + Shipping */}
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
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2.5 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-foreground">₹{Number(total).toFixed(2)}</span>
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
            </div>
          </div>

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
