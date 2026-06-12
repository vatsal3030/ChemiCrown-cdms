import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, X, ChevronDown, Shield, Zap, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, storedAccounts, switchAccount, removeStoredAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleQuickLogin = (accountId) => {
    switchAccount(accountId);
    toast.success('Switched account');
    navigate(from, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password to sign in');
      return;
    }
    
    setPendingVerification(false);
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, rememberMe })
      });
      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        toast.success('Successfully logged in!');
        navigate(from, { replace: true });
      } else if (data.requiresVerification) {
        setPendingVerification(true);
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const hasMoreAccounts = storedAccounts && storedAccounts.length > 2;

  return (
    <div className="flex-1 flex items-stretch min-h-0 bg-muted/30">
      {/* ── Left Brand Panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-primary text-primary-foreground p-10 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative z-10">
          <img src="/chemicrown.png" alt="ChemiCrown" className="h-12 w-12 object-contain mb-8 rounded-lg" />
          <h1 className="text-3xl font-extrabold leading-tight mb-3">Welcome back to ChemiCrown</h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Your all-in-one chemical distribution management platform. Access your orders, inventory, and team from one place.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: Shield, text: 'Bank-grade secure authentication' },
            { icon: Zap,    text: 'Real-time order & inventory updates' },
            { icon: Package, text: 'Wholesale pricing & bulk ordering' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-wrap items-center gap-3 text-sm text-primary-foreground/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon size={15} />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-5xl">
          {/* Logo (mobile only) */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src="/chemicrown.png" alt="ChemiCrown" className="h-12 w-12 object-contain rounded-lg" />
          </div>

          <h2 className="text-2xl font-extrabold text-foreground mb-1">Sign in</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in to your ChemiCrown portal
          </p>

          {/* ── Quick Login ── */}
          {storedAccounts && storedAccounts.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Login</p>
              <div className={`space-y-1.5 ${hasMoreAccounts ? 'max-h-38 overflow-y-auto' : ''} relative`}>
                {storedAccounts.map((account) => (
                  <div key={account.id} className="relative flex items-center group">
                    <button
                      onClick={() => handleQuickLogin(account.id)}
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:bg-muted/60 transition-colors pr-10 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                          {account.profileImageUrl ? (
                            <img src={account.profileImageUrl} alt={account.firstName || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            account.firstName?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">{account.firstName} {account.lastName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {account.role?.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeStoredAccount(account.id); }}
                      className="absolute right-2.5 p-1 rounded-full text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors z-10 opacity-0 group-hover:opacity-100"
                      title="Remove account"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Scroll hint when there are more than 2 accounts */}
              {hasMoreAccounts && (
                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground/60">
                  <ChevronDown size={12} className="animate-bounce" />
                  <span>Scroll to see {storedAccounts.length - 2} more account{storedAccounts.length - 2 > 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-background text-muted-foreground">or sign in with email</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Pending Verification Banner ── */}
          {pendingVerification && (
            <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Account Pending Verification</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  An administrator needs to approve your account before you can log in.
                </p>
              </div>
            </div>
          )}

          {/* ── Email & Password Form ── */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-input rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 border border-input rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary border-input rounded cursor-pointer"
                />
                <span className="text-sm text-foreground select-none">
                  Remember me <span className="text-xs text-muted-foreground">({rememberMe ? '30 days' : '7 days'})</span>
                </span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                Forgot password?
              </Link>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Signing In...' : <><span>Sign In</span><ArrowRight className="ml-2 w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
