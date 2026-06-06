import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `OTP sent to ${email}`);
        setStep(2);
        setResendTimer(60);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP verified successfully!');
        setStep(3);
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset successfully! Please log in.');
        navigate('/login');
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleResend = async () => {
    if (resendTimer === 0) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`A new OTP has been sent to ${email}`);
          setResendTimer(60);
        } else {
          toast.error(data.error || 'Failed to resend OTP');
        }
      } catch {
        toast.error('Network error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center">
            <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-16 w-16 mb-6 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-2">Password Reset</h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            {step === 1 && "Enter your email to receive a recovery OTP."}
            {step === 2 && "Enter the 6-digit code sent to your email."}
            {step === 3 && "Create a new strong password."}
          </p>

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" 
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                Send Recovery OTP <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">6-Digit OTP</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-widest text-xl px-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" 
                  placeholder="------"
                  required
                />
              </div>
              <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                Verify OTP <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              
              <div className="text-center mt-4 text-sm">
                <button 
                  type="button" 
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className={`font-medium ${resendTimer > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline'}`}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" 
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                Update Password <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </form>
          )}

        </div>
        <div className="px-8 py-5 bg-muted/50 border-t border-border text-center">
          <Link to="/login" className="flex items-center justify-center font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
