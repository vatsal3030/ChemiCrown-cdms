import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Beaker, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
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

  const handleSendOtp = (e) => {
    e.preventDefault();
    // Simulate sending OTP via Nodemailer
    toast.success(`OTP sent to ${email}`);
    setStep(2);
    setResendTimer(60); // 60 seconds cooldown
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    toast.success('OTP verified successfully!');
    setStep(3);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    // Simulate password reset
    toast.success('Password reset successfully! Please log in.');
    navigate('/login');
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      toast.success(`A new OTP has been sent to ${email}`);
      setResendTimer(60);
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
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" 
                    placeholder="••••••••"
                    required
                  />
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
