import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Beaker, Mail, Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, storedAccounts, switchAccount, removeStoredAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleQuickLogin = (accountId) => {
    switchAccount(accountId);
    toast.success('Switched account');
    toast.success('Switched account');
    navigate(from, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
        toast.success('Successfully logged in!');
        navigate(from, { replace: true });
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center">
            <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-16 w-16 mb-6 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-2">Welcome Back</h2>
          <p className="text-center text-muted-foreground mb-8 text-base">Sign in to your ChemiCrown portal</p>

          {storedAccounts && storedAccounts.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-500 mb-3">Quick Login</p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 pb-2">
                {storedAccounts.map(account => (
                  <div key={account.id} className="relative flex items-center group">
                    <button 
                      onClick={() => handleQuickLogin(account.id)}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors pr-10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden shrink-0">
                          {account.profileImageUrl ? (
                            <img src={account.profileImageUrl} alt={account.firstName || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            account.firstName ? account.firstName.charAt(0) : 'U'
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{account.firstName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{account.role.replace('_', ' ').toLowerCase()}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeStoredAccount(account.id); }}
                      className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors z-10 opacity-0 group-hover:opacity-100"
                      title="Remove account"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="relative mt-6 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or use email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary" 
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary" 
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember" type="checkbox" className="h-4 w-4 text-primary border-input rounded" />
                <label htmlFor="remember" className="ml-2 block text-sm text-foreground">Remember me</label>
              </div>
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">Forgot password?</Link>
              </div>
            </div>

            <button disabled={isLoading} type="submit" className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isLoading ? 'Signing In...' : <>Sign In <ArrowRight className="ml-2 w-5 h-5" /></>}
            </button>
          </form>
        </div>
        <div className="px-8 py-5 bg-muted/50 border-t border-border text-center">
          <span className="text-foreground text-sm">Don't have an account? </span>
          <Link to="/register" className="font-medium text-primary hover:text-primary/80 text-sm">Create account</Link>
        </div>
      </div>
    </div>
  );
}
