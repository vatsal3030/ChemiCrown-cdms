import { useState, useCallback, useRef, useEffect } from 'react';
import { CreditCard, ShieldCheck, Building, ShoppingCart, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapAddressPicker } from '@/components/ui/MapAddressPicker';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

const WAREHOUSE_LAT = 21.7411471;
const WAREHOUSE_LNG = 72.0706172;
const COST_PER_KM = 10; // ₹10 per km

export default function Checkout() {
  const { user, token } = useAuth();
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const SESSION_KEY = `checkout_form_${user?.id || 'guest'}`;

  // Restore from sessionStorage on mount to survive refresh
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`checkout_form_${user?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      companyName: '',
      gstNumber: '',
      shippingAddress: '',
      phone: user?.phone || '',
      email: user?.email || '',
      notes: '',
      lat: null,
      lng: null
    };
  });

  const isProcessing = useRef(false);

  // Persist form to sessionStorage on every change
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(formData)); }
    catch {}
  }, [formData, SESSION_KEY]);

  const isDirty = !!(formData.companyName || formData.gstNumber || formData.shippingAddress);
  useUnsavedChangesWarning(isDirty && !loading);


  const distanceKm = calculateDistance(WAREHOUSE_LAT, WAREHOUSE_LNG, formData.lat, formData.lng);
  const distanceCost = distanceKm * COST_PER_KM;

  const handleLocationChange = useCallback((lat, lng) => {
    setFormData(prev => {
      if (prev.lat === lat && prev.lng === lng) return prev;
      return { ...prev, lat, lng };
    });
  }, []);

  const handlePayment = async () => {
    if (!formData.companyName || !formData.gstNumber || !formData.shippingAddress || !formData.phone || !formData.email) {
      toast.error("Please fill in all required text fields.");
      return;
    }
    if (!formData.lat || !formData.lng) {
      toast.error("Please select a delivery location on the map.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    
    if (isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true);
    
    try {
      const items = cartItems.map(item => ({
        chemicalId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      // In real implementation, this would call /api/orders
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          items, 
          companyName: formData.companyName,
          gstNumber: formData.gstNumber,
          phone: formData.phone,
          email: formData.email,
          shippingAddress: formData.shippingAddress,
          orderNotes: formData.notes,
          distanceKm,
          paymentMethod: 'bank_transfer'
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Order placed successfully!');
        clearCart();
        try { sessionStorage.removeItem(SESSION_KEY); } catch {}
        navigate('/dashboard/orders');
      } else {
        toast.error(data.error || 'Failed to place order.');
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const gstAmount = Number((cartTotal * 0.18).toFixed(2));
  const hazardousFee = cartTotal > 0 ? 500 : 0; // Hazardous material handling fee
  const finalTotal = Number((cartTotal + gstAmount + hazardousFee + distanceCost).toFixed(2));

  if (cartItems.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-20">
        <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
        <p className="text-muted-foreground mt-2 mb-6">Looks like you haven't added any products to your cart yet.</p>
        <Button onClick={() => navigate('/catalog')}>Browse Catalog</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Secure Checkout</h1>
        <p className="text-muted-foreground mt-2">Review your order details and complete the payment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-4 mb-4 text-foreground flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-sm font-normal text-muted-foreground">{cartItems.length} items</span>
            </h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {cartItems.map(item => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden shrink-0">
                    {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                      <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingCart size={20} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">₹{item.product.price} / {item.product.unit}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-0.5 hover:bg-muted text-xs">-</button>
                        <span className="px-2 py-0.5 text-xs font-medium border-x border-border min-w-[30px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-0.5 hover:bg-muted text-xs">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-destructive hover:text-destructive/80 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-medium text-sm">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm mt-6 border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hazardous Handling Fee</span>
                <span className="font-medium text-foreground">₹{hazardousFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-medium text-foreground">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Distance Cost ({distanceKm.toFixed(1)} km × ₹{COST_PER_KM}/km)</span>
                <span className="font-medium text-foreground">₹{distanceCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t border-border pt-4 mt-4 text-primary">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Building size={20} /> Company Details (Required)</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Company Name *</label>
                  <Input 
                    placeholder="Acme Chemicals Ltd."
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">GST Number *</label>
                  <Input 
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <Input 
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <Input 
                    type="email"
                    placeholder="purchasing@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Shipping Address *</label>
                <textarea 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  rows={3}
                  placeholder="Complete delivery address including PIN code..."
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                  required
                />
              </div>
              <div>
                <MapAddressPicker onLocationChange={handleLocationChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Order Notes (Optional)</label>
                <textarea 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  rows={2}
                  placeholder="Special delivery instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-4 mb-4 text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Payment Method
            </h3>
            
            <p className="text-sm text-muted-foreground mb-8">
              You will be redirected to the secure Razorpay payment gateway to complete your purchase. We support Credit Cards, UPI, Netbanking, and Wallets.
            </p>

            <button 
              onClick={handlePayment}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-6 py-4 text-lg font-bold text-primary-foreground bg-primary rounded-xl shadow hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Processing...' : `Pay ₹${finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`}
            </button>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-success/10 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-success" /> <span className="text-success font-medium">100% Encrypted Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
