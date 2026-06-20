import { useState, useCallback, useRef, useEffect } from 'react';
import { CreditCard, ShieldCheck, Building, ShoppingCart, Trash2, Smartphone } from 'lucide-react';
import UpiQrPayment from '../../components/UpiQrPayment';
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
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Indian GST number regex: 2-digit state code + 10-char PAN + 1-char entity + Z + 1-char checksum
  const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const SESSION_KEY = `checkout_form_${user?.id || 'guest'}`;

  // Restore from sessionStorage on mount to survive refresh
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`checkout_form_${user?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch (err) { console.error('Session storage read error', err); }
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
    catch (err) { console.error('Session storage write error', err); }
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
    const errors = {};
    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';
    // GST is optional — only validate format if provided
    if (formData.gstNumber.trim() && !GST_REGEX.test(formData.gstNumber.trim().toUpperCase())) {
      errors.gstNumber = 'Invalid GST number format (e.g. 22AAAAA0000A1Z5)';
    }
    if (!formData.shippingAddress.trim()) errors.shippingAddress = 'Shipping address is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.lat || !formData.lng) errors.location = 'Please select a delivery location on the map';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorKey = Object.keys(errors)[0];
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    setFieldErrors({});

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

      // Call API to create order
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
          paymentMethod
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.outOfStockItem) {
          toast.error(data.error || 'Insufficient stock.');
          if (data.outOfStockItem.available > 0) {
            updateQuantity(data.outOfStockItem.id, data.outOfStockItem.available);
            toast.success(`Adjusted ${data.outOfStockItem.name} to maximum available stock.`);
          } else {
            removeFromCart(data.outOfStockItem.id);
            toast.success(`Removed ${data.outOfStockItem.name} from cart as it is out of stock.`);
          }
        } else {
          toast.error(data.error || 'Failed to place order.');
        }
        setLoading(false);
        isProcessing.current = false;
        return;
      }

      if (paymentMethod === 'PAY_ON_DELIVERY') {
        toast.success(data.message || 'Order requested successfully!');
        clearCart();
        try { sessionStorage.removeItem(SESSION_KEY); } catch (err) { console.error(err); }
        navigate('/dashboard/orders');
      } else if (paymentMethod === 'UPI_QR') {
        // Store order ID and show UPI QR payment inline
        setCreatedOrderId(data.orderId);
        setLoading(false);
        isProcessing.current = false;
        toast.success('Order created! Please complete UPI payment below.');
        // Scroll to payment section
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 200);
        return;
      } else if (paymentMethod === 'RAZORPAY' && data.razorpayOrder) {
        // Load Razorpay Script
        const resScript = await loadRazorpayScript();
        if (!resScript) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setLoading(false);
          isProcessing.current = false;
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', 
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: "ChemiCrown CDMS",
          description: "Order Payment",
          image: "/chemicrown.png",
          order_id: data.razorpayOrder.id,
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [{ method: "upi" }]
                },
                qr: {
                  name: "Scan QR Code",
                  instruments: [{ method: "upi", flows: ["qr"] }]
                },
                other: {
                  name: "Other Methods",
                  instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }]
                }
              },
              sequence: ["block.upi", "block.qr", "block.other"],
              preferences: { show_default_blocks: true }
            }
          },
          handler: async function (response) {
            try {
              const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: data.orderId
                })
              });
              
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                toast.success('Payment successful and order verified!');
                clearCart();
                try { sessionStorage.removeItem(SESSION_KEY); } catch (err) { console.error(err); }
                navigate('/dashboard/orders');
              } else {
                toast.error(verifyData.error || 'Payment verification failed.');
                navigate('/dashboard/orders'); // Navigate anyway, payment might need manual sync
              }
            } catch (err) {
              console.error(err);
              toast.error('Error verifying payment.');
            }
          },
          prefill: {
            name: formData.companyName,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#1F2E54"
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (response) {
          toast.error(response.error.description || 'Payment Failed');
        });
        paymentObject.open();
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Compute GST per item using product's gstRate (default 18% if not set)
  const gstAmount = cartItems.reduce((acc, item) => {
    const rate = item.product?.gstRate || 18;
    return acc + Number(((item.product.price * item.quantity) * rate / 100).toFixed(2));
  }, 0);
  const hazardousFee = cartTotal > 0 ? 2500 : 0; // Hazardous material handling fee (matches backend)
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
    <div className="px-3 py-5 sm:px-6 sm:py-8 max-w-6xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Secure Checkout</h1>
        <p className="text-muted-foreground mt-2">Review your order details and complete the payment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-4 mb-4 text-foreground flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-sm font-normal text-muted-foreground">{cartItems.length} items</span>
            </h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {cartItems.map(item => (
                <div key={item.product.id} className="flex flex-wrap gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                    {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                      <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingCart size={20} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      ₹{item.product.price} / {item.product.unit}
                      <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded">GST {item.product.gstRate || 18}%</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
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
                <span className="text-muted-foreground">CGST</span>
                <span className="font-medium text-foreground">₹{(gstAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span className="font-medium text-foreground">₹{(gstAmount / 2).toFixed(2)}</span>
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
            <h2 className="text-xl font-bold mb-4 flex flex-wrap items-center gap-2"><Building size={20} /> Company Details (Required)</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-companyName">
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Company Name *</label>
                  <Input 
                    placeholder="Acme Chemicals Ltd."
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({...formData, companyName: e.target.value});
                      if (fieldErrors.companyName) setFieldErrors(p => ({ ...p, companyName: undefined }));
                    }}
                    className={fieldErrors.companyName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {fieldErrors.companyName && <p className="text-xs text-red-600 mt-1">{fieldErrors.companyName}</p>}
                </div>
                <div id="field-gstNumber">
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">GST Number <span className="text-muted-foreground font-normal">(Optional)</span></label>
                  <Input 
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase();
                      setFormData({...formData, gstNumber: v});
                      if (fieldErrors.gstNumber) setFieldErrors(p => ({ ...p, gstNumber: undefined }));
                    }}
                    maxLength={15}
                    className={fieldErrors.gstNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {fieldErrors.gstNumber && <p className="text-xs text-red-600 mt-1 flex flex-wrap items-center gap-1">{fieldErrors.gstNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-phone">
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <Input 
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: undefined }));
                    }}
                    className={fieldErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
                </div>
                <div id="field-email">
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <Input 
                    type="email"
                    placeholder="purchasing@company.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined }));
                    }}
                    className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>
              </div>
              <div id="field-shippingAddress">
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Shipping Address *</label>
                <textarea 
                  className={`w-full rounded-md border ${fieldErrors.shippingAddress ? 'border-red-500 focus-visible:ring-red-500' : 'border-input focus-visible:ring-primary'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2`}
                  rows={3}
                  placeholder="Complete delivery address including PIN code..."
                  value={formData.shippingAddress}
                  onChange={(e) => {
                    setFormData({...formData, shippingAddress: e.target.value});
                    if (fieldErrors.shippingAddress) setFieldErrors(p => ({ ...p, shippingAddress: undefined }));
                  }}
                  required
                />
                {fieldErrors.shippingAddress && <p className="text-xs text-red-600 mt-1">{fieldErrors.shippingAddress}</p>}
              </div>
              <div id="field-location">
                <MapAddressPicker onLocationChange={handleLocationChange} />
                {fieldErrors.location && <p className="text-xs text-red-600 mt-1">{fieldErrors.location}</p>}
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
            <h3 className="font-semibold text-lg border-b border-border pb-4 mb-4 text-foreground flex flex-wrap items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Payment Method
            </h3>
            
              <div className="space-y-2.5 mb-5">
              <label 
                className={`flex items-start p-3 sm:p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'RAZORPAY' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted'}`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="RAZORPAY" 
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={(e) => { setPaymentMethod(e.target.value); setCreatedOrderId(null); }}
                  className="w-4 h-4 text-primary focus:ring-primary mt-1"
                />
                <div className="ml-4 flex-1">
                  <span className="block font-semibold text-foreground">Cards / Netbanking / Wallets</span>
                  <span className="block text-sm text-muted-foreground mt-1">Pay via Razorpay secure checkout</span>
                  {paymentMethod === 'RAZORPAY' && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['VISA', 'MasterCard', 'Netbanking', 'Wallets'].map(b => (
                        <span key={b} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs border border-border">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* UPI / QR */}
              <label 
                className={`flex items-start p-3 sm:p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'UPI_QR' ? 'border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500/20' : 'border-border hover:bg-muted'}`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="UPI_QR" 
                  checked={paymentMethod === 'UPI_QR'}
                  onChange={(e) => { setPaymentMethod(e.target.value); setCreatedOrderId(null); }}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 mt-1"
                />
                <div className="ml-4 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="block font-semibold text-foreground">UPI / QR Code Payment</span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">Instant</span>
                  </div>
                  <span className="block text-sm text-muted-foreground mt-1">Scan QR or pay via GPay, PhonePe, Paytm, BHIM, any UPI app</span>
                  {paymentMethod === 'UPI_QR' && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Any UPI'].map(b => (
                        <span key={b} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs border border-green-200 dark:border-green-800 font-medium">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* Pay on Delivery */}
              <label 
                className={`flex items-center p-3 sm:p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'PAY_ON_DELIVERY' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted'}`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="PAY_ON_DELIVERY" 
                  checked={paymentMethod === 'PAY_ON_DELIVERY'}
                  onChange={(e) => { setPaymentMethod(e.target.value); setCreatedOrderId(null); }}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-4 flex-1">
                  <span className="block font-semibold text-foreground">Pay on Delivery</span>
                  <span className="block text-sm text-muted-foreground mt-1">Requires manual admin verification before the order is processed.</span>
                </div>
              </label>
            </div>

            {/* UPI QR Inline Payment UI */}
            {paymentMethod === 'UPI_QR' && createdOrderId && (
              <div className="mb-6 border border-green-200 dark:border-green-800 rounded-xl overflow-hidden">
                <div className="bg-green-50 dark:bg-green-950/50 px-4 py-3 border-b border-green-200 dark:border-green-800 flex flex-wrap items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">Complete UPI Payment</span>
                </div>
                <div className="p-4">
                  <UpiQrPayment
                    amount={finalTotal}
                    orderId={createdOrderId}
                    merchantUpi={import.meta.env.VITE_MERCHANT_UPI || 'chemicrown@upi'}
                    merchantName="ChemiCrown CDMS"
                    onSuccess={async ({ utrNumber, upiVpa }) => {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/upi/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ orderId: createdOrderId, utrNumber, upiVpa })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Failed to submit payment');
                      toast.success('Payment details submitted! Order placed successfully.');
                      clearCart();
                      try { sessionStorage.removeItem(SESSION_KEY); } catch (err) { console.error(err); }
                      navigate('/dashboard/orders');
                    }}
                    onCancel={() => { setPaymentMethod('RAZORPAY'); setCreatedOrderId(null); }}
                  />
                </div>
              </div>
            )}

            {/* Pay / Place Order button — hidden when UPI QR flow is active */}
            {!(paymentMethod === 'UPI_QR' && createdOrderId) && (
              <button 
                onClick={handlePayment}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-6 py-4 text-lg font-bold text-primary-foreground bg-primary rounded-xl shadow hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Processing...' : paymentMethod === 'RAZORPAY' ? `Pay ₹${finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : paymentMethod === 'UPI_QR' ? `Proceed to UPI Payment ₹${finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : 'Place Order'}
              </button>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-success/10 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-success" /> <span className="text-success font-medium">100% Encrypted Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
