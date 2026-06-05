import { useState } from 'react';
import { CreditCard, ShieldCheck, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../context/AuthContext';

export default function Checkout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    shippingAddress: '',
    phone: '',
    email: user?.email || '',
    notes: ''
  });

  const handlePayment = async () => {
    if (!formData.companyName || !formData.gstNumber || !formData.shippingAddress || !formData.phone || !formData.email) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    // Real implementation would:
    // 1. Fetch Razorpay Script
    // 2. Call backend /api/orders/create
    // 3. Open Razorpay Window
    // 4. Call /api/orders/verify-payment on success

    setTimeout(() => {
      alert("Razorpay Integration Simulated!\n\nIn production, this button launches the Razorpay overlay utilizing the backend Order ID generated via the SDK.");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Secure Checkout</h1>
        <p className="text-muted-foreground mt-2">Review your order details and complete the payment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-4 mb-4 text-foreground">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Premium GP Thinner (200L)</span>
                <span className="font-medium text-foreground">₹45,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hazardous Shipping</span>
                <span className="font-medium text-foreground">₹2,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-medium text-foreground">₹8,550</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t border-border pt-4 mt-4 text-primary">
                <span>Total Amount</span>
                <span>₹56,050</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-border">
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
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col justify-center">
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
              {loading ? 'Initializing Gateway...' : 'Pay ₹56,050 via Razorpay'}
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
