import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Beaker, Menu, X, MapPin, Phone, Mail } from 'lucide-react';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'Contact', path: '/contact' },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-[4.5rem] max-w-screen-2xl items-center px-4 mx-auto justify-between">
          <Link to="/" className="flex items-center space-x-3 mr-6">
            <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-10 w-10 group-hover:scale-105 transition-transform object-contain" />
            <span className="font-extrabold text-2xl tracking-tight text-primary">ChemiCrown</span>
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

            <nav className="flex items-center space-x-3">
              <Link to="/login" className="text-base font-medium hover:text-primary px-4 py-2 transition-colors">Log in</Link>
              <Link to="/register" className="bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:scale-105 h-10 px-5 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-bold transition-all">Get Started</Link>
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur absolute w-full left-0 p-4 shadow-lg flex flex-col space-y-4">
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
            <div className="h-px w-full bg-border my-2"></div>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium p-2 text-foreground">Log in</Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-primary text-primary-foreground w-full text-center py-3 rounded-md text-lg font-bold">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
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
    </div>
  );
}
