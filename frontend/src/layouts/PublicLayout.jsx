import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, Phone, Mail, ChevronDown, ArrowRight, ShoppingCart, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import ScrollProvider from '@/components/scroll/ScrollProvider';
import Reveal from '@/components/scroll/Reveal';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { storedAccounts, switchAccount, user } = useAuth();
  const { cartItems } = useCart();

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const themeToggleRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleThemeToggle = () => {
    const newDark = !darkMode;
    const rect = themeToggleRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 32;

    document.documentElement.style.setProperty('--tt-x', `${x}px`);
    document.documentElement.style.setProperty('--tt-y', `${y}px`);

    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', newDark);
    };

    if (document.startViewTransition) {
      const transition = document.startViewTransition(applyTheme);
      transition.finished.then(() => {
        document.documentElement.style.removeProperty('--tt-x');
        document.documentElement.style.removeProperty('--tt-y');
      });
    } else {
      applyTheme();
    }
    setDarkMode(newDark);
  };

  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If we scroll down, hide navbar. If we scroll up, show navbar.
      // We also keep the navbar visible when close to the top of the page.
      if (currentScrollY < 50) {
        setNavbarVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scroll down
        setNavbarVisible(false);
      } else {
        // Scroll up
        setNavbarVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickLogin = (accountId) => {
    switchAccount(accountId);
    toast.success('Switched account');
    navigate('/dashboard');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'Contact', path: '/contact' },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/70 shadow-sm transition-transform duration-500 ease-in-out ${navbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container flex h-16 max-w-screen-2xl items-center px-4 mx-auto justify-between">
          <Link to="/" className="flex items-center space-x-2.5 mr-6 group">
            <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-9 w-9 object-contain group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-xl tracking-tight text-[#1F2E54] dark:text-white">ChemiCrown</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end space-x-6">
            <nav className="flex items-center space-x-6 text-base font-medium">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.name}
                    to={link.path} 
                    className={`transition-colors hover:text-primary relative group ${isActive ? 'text-primary' : 'text-foreground/80'}`}
                  >
                    {link.name}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="h-6 w-px bg-border mx-2"></div> {/* Separator */}

            <nav className="flex items-center space-x-3 relative">
              <button
                ref={themeToggleRef}
                onClick={handleThemeToggle}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mr-1"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-500" />}
              </button>
              
              <Link to={user ? "/dashboard/cart" : "/login"} className="relative p-2 text-foreground/80 hover:text-primary transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartItems?.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              
              {storedAccounts && storedAccounts.length > 0 ? (
                <div 
                  className="relative"
                  ref={menuRef}
                >
                  <button 
                    onClick={() => setAccountMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex -space-x-2">
                      {storedAccounts.slice(0, 3).map((account, i) => (
                        <div key={account.id} className={`w-8 h-8 rounded-full border-2 border-background bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 z-${30-i*10}`}>
                          {account.profileImageUrl ? (
                            <img src={account.profileImageUrl} alt={account.firstName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            account.firstName ? account.firstName.charAt(0) : 'U'
                          )}
                        </div>
                      ))}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>
                  
                  {accountMenuOpen && (
                    <div className="absolute right-0 top-full pt-2 w-64 z-50">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 py-2">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Login</span>
                        </div>
                      <div className="max-h-64 overflow-y-auto">
                        {storedAccounts.map(account => (
                          <button 
                            key={account.id}
                            onClick={() => handleQuickLogin(account.id)}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                                {account.profileImageUrl ? (
                                  <img src={account.profileImageUrl} alt={account.firstName} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  account.firstName ? account.firstName.charAt(0) : 'U'
                                )}
                              </div>
                              <div className="text-left overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate">{account.firstName}</p>
                                <p className="text-xs text-muted-foreground capitalize truncate">{account.role.replace('_', ' ').toLowerCase()}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary shrink-0 transition-colors" />
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 p-2 pb-0">
                        <Link to="/login" className="w-full text-center block py-2 text-sm text-primary font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          Add another account
                        </Link>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-base font-medium hover:text-primary px-4 py-2 transition-colors">Log in</Link>
                  <Link to="/register" className="bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:scale-105 h-10 px-5 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-bold transition-all">Get Started</Link>
                </>
              )}
            </nav>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="md:hidden p-2 text-foreground focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 top-16 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background absolute w-full left-0 p-4 shadow-2xl flex flex-col space-y-4 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg font-medium p-2 rounded-md ${location.pathname === link.path ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center justify-between p-2 border-t border-border/60 pt-4">
              <span className="text-base font-semibold text-foreground">Theme Mode</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-foreground transition-all hover:bg-muted"
              >
                {darkMode ? (
                  <>
                    <Sun size={16} className="text-amber-500" />
                    <span className="text-xs font-medium">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} className="text-indigo-400" />
                    <span className="text-xs font-medium">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
            <div className="h-px w-full bg-border my-2"></div>
            {storedAccounts && storedAccounts.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Quick Login</span>
                {storedAccounts.map(account => (
                  <button 
                    key={account.id}
                    onClick={() => { setMobileMenuOpen(false); handleQuickLogin(account.id); }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden shrink-0">
                        {account.profileImageUrl ? (
                          <img src={account.profileImageUrl} alt={account.firstName} className="w-full h-full object-cover" />
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
                ))}
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-3 text-primary font-medium border border-primary/20 rounded-md mt-2">
                  Add another account
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium p-2 text-foreground">Log in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-primary text-primary-foreground w-full text-center py-3 rounded-md text-lg font-bold">Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Main Content — wrapped in ScrollProvider for Lenis smooth scroll */}
      <ScrollProvider>
        <main className="flex-1">
          <Outlet />
        </main>

      {/* Footer */}
      <Reveal direction="up" amount={0.1}>
      <footer className="border-t border-border bg-muted/30 py-8 md:py-12">
        <div className="container px-4 mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-8 w-8 object-contain" />
              <span className="font-extrabold text-xl text-foreground tracking-tight">ChemiCrown</span>
            </div>
            <p className="text-base text-muted-foreground mb-6 max-w-sm leading-relaxed">
              India's leading chemical distributor. Delivering high-quality industrial solvents, thinners, and specialty chemicals with precision and trust.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" /> Plot No - 26, Shed No - 4, Madhav Industrial Park, Vartej, Bhavnagar. 364004
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" /> +91 - 7043180599 / 8530903009
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" /> chemicrown402@gmail.com
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-3 text-base text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/catalog" className="hover:text-primary transition-colors">Products Catalog</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3 text-base text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="container px-4 mx-auto mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ChemiCrown CDMS. All rights reserved.
        </div>
      </footer>
      </Reveal>
      </ScrollProvider>
    </div>
  );
}
