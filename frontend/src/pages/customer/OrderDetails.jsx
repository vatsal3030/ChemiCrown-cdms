import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, Truck, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '@/components/ReviewModal';

export default function OrderDetails() {
  const { id } = useParams();
  const { token } = useAuth();
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
        if (json.success) {
          setOrder(json.data);
        } else {
          toast.error(json.error || 'Failed to load order');
        }
      } catch (error) {
        toast.error('Network error while loading order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, token]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-slate-500">Order not found.</div>;

  const handleReviewClick = (productId) => {
    setSelectedProductId(productId);
    setReviewModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REQUESTED': return <Clock className="text-blue-500" />;
      case 'PENDING': return <Clock className="text-yellow-500" />;
      case 'PROCESSING': return <Package className="text-orange-500" />;
      case 'PACKAGED': return <Package className="text-orange-500" />;
      case 'DISPATCHED': return <Truck className="text-purple-500" />;
      case 'DELIVERED': return <CheckCircle className="text-green-500" />;
      default: return <Package className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/orders')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order #{order.id}</h1>
          <p className="text-sm text-slate-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="ml-auto">
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-700">
            {getStatusIcon(order.status)}
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity} {item.product.unit}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                    {order.status === 'DELIVERED' && (
                      <Button variant="outline" size="sm" onClick={() => handleReviewClick(item.product.id)}>
                        Leave a Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>₹{order.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span>₹0</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin size={18} /> Shipping Info</h2>
            <p className="text-sm font-medium">{order.customer?.companyName || `${order.customer?.user?.firstName} ${order.customer?.user?.lastName}`}</p>
            <p className="text-sm text-slate-500 mt-1">{order.customer?.address || 'Address not provided'}</p>
            <p className="text-sm text-slate-500 mt-1">Phone: {order.customer?.user?.phone || 'N/A'}</p>
          </div>
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
