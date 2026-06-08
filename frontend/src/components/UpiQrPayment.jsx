import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Copy, Smartphone, AlertCircle, Clock, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * UpiQrPayment Component
 * Generates a UPI payment QR code and collects UTR confirmation.
 * Works independently of Razorpay — supports GPay, PhonePe, Paytm, BHIM, any UPI app.
 */
export default function UpiQrPayment({ amount, orderId, merchantUpi, merchantName, onSuccess, onCancel }) {
  const [step, setStep] = useState('qr'); // 'qr' | 'confirm' | 'success'
  const [utrNumber, setUtrNumber] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Build UPI deeplink (NPCI standard)
  const upiString = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`ChemiCrown Order ${orderId?.substring(0, 8) || ''}`)}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    toast.success('UPI ID copied!');
  };

  const handleSubmit = async () => {
    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      toast.error('Please enter a valid UTR / Transaction Reference number');
      return;
    }
    setSubmitting(true);
    try {
      await onSuccess({ utrNumber: utrNumber.trim(), upiVpa: upiVpa.trim() });
      setStep('success');
    } catch (err) {
      toast.error(err.message || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Payment Details Submitted!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your UTR reference has been recorded. Our team will verify the payment and update your order status shortly.
        </p>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg text-xs">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Verification usually takes 15–30 minutes during business hours.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setStep('qr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step === 'qr' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          <QrCode className="w-3 h-3" /> 1. Scan QR
        </button>
        <div className="h-px w-6 bg-border" />
        <button
          onClick={() => utrNumber && setStep('confirm')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step === 'confirm' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          <CheckCircle className="w-3 h-3" /> 2. Confirm Payment
        </button>
      </div>

      {step === 'qr' && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-border">
              <QRCodeSVG
                value={upiString}
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '/chemicrown-icon.png',
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Scan with any UPI app</p>
              <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map(app => (
                  <span key={app} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">{app}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-3xl font-black text-primary">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">to {merchantName}</p>
          </div>

          {/* UPI ID copy */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
            <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm flex-1 font-mono text-foreground">{merchantUpi}</span>
            <button onClick={copyUpi} className="p-1.5 hover:bg-background rounded-lg transition-colors" title="Copy UPI ID">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> How to Pay:
            </p>
            {['Open GPay, PhonePe, Paytm, or any UPI app', 'Scan the QR code above OR enter the UPI ID manually', `Pay exactly ₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 'Note the UTR / Transaction ID from the payment confirmation'].map((step, i) => (
              <p key={i} className="text-xs text-blue-600 dark:text-blue-400 flex gap-1.5">
                <span className="font-bold shrink-0">{i + 1}.</span> {step}
              </p>
            ))}
          </div>

          <button
            onClick={() => setStep('confirm')}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
          >
            I've Completed the Payment →
          </button>
          <button onClick={onCancel} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancel, choose different payment method
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Enter the UTR / Transaction Reference Number from your UPI app payment confirmation screen. This is required to verify your payment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              UTR / Transaction Reference Number <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 506240781234 or T2506240781234"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Found in your UPI app → Transactions history → Payment receipt</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Your UPI ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. yourname@gpay or 9876543210@paytm"
              value={upiVpa}
              onChange={(e) => setUpiVpa(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Helps us identify your payment faster</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-3 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-bold text-foreground">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('qr')}
              className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !utrNumber.trim()}
              className="flex-2 flex-grow py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'Submitting...' : 'Confirm Payment ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
