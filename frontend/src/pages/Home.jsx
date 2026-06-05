import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Droplet, ArrowRight, Beaker, Zap, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 flex-1 flex items-center justify-center min-h-[85vh]">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Abstract 3D Chemical "Objects" simulated with CSS */}
        <div className="absolute top-20 right-[15%] opacity-40 animate-float z-0 hidden lg:block">
          <Beaker className="w-48 h-48 text-secondary drop-shadow-[0_0_30px_rgba(230,81,58,0.6)]" strokeWidth={1} />
        </div>
        <div className="absolute bottom-20 left-[10%] opacity-30 animate-float-delayed z-0 hidden lg:block">
          <Droplet className="w-32 h-32 text-primary drop-shadow-[0_0_30px_rgba(31,46,84,0.8)]" strokeWidth={1.5} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-sm font-semibold text-secondary mb-8 shadow-2xl">
            <span className="flex h-2.5 w-2.5 rounded-full bg-secondary mr-2 animate-pulse"></span>
            Enterprise Grade Chemical Solutions
          </div>
          
          <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 leading-tight drop-shadow-lg">
            Precision Chemicals for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-secondary animate-pulse-slow">Modern Industry</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-300 mb-12 leading-relaxed font-light">
            Geeta Chemicals delivers premium thinners, solvents, and specialized industrial chemicals with uncompromising quality and reliable distribution networks across India.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link 
              to="/catalog" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-primary rounded-xl shadow-[0_0_40px_rgba(31,46,84,0.6)] hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 border border-primary/50"
            >
              Explore Products
            </Link>
            <Link 
              to="/contact" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all group"
            >
              Contact Sales <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30 border-t border-border/50 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-6">Why Choose ChemiCrown?</h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">We combine decades of chemical manufacturing expertise with cutting-edge supply chain management.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-10 rounded-3xl shadow-sm border border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Droplet className="h-8 w-8 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Unmatched Purity</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Our chemicals undergo rigorous laboratory testing to ensure 99.9% purity, meeting strict industrial compliance standards.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-card p-10 rounded-3xl shadow-sm border border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-primary-foreground transition-colors">
                <Truck className="h-8 w-8 text-secondary group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Express Delivery</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                With distribution hubs across major industrial zones, we guarantee rapid, safe, and fully compliant transit of hazardous materials.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-card p-10 rounded-3xl shadow-sm border border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-success group-hover:text-primary-foreground transition-colors">
                <ShieldCheck className="h-8 w-8 text-success group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">ISO Certified</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Our facilities operate strictly under ISO 9001 guidelines, ensuring complete safety for your workforce and environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[40rem] h-[40rem] rounded-full bg-black/20 blur-[100px]"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-primary-foreground mb-8 drop-shadow-md">Ready to streamline your supply chain?</h2>
          <p className="text-primary-foreground/90 text-xl mb-12 max-w-3xl mx-auto font-medium">
            Create an account today to get access to real-time inventory tracking, wholesale pricing, and instant quotations directly through our CDMS.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center px-10 py-5 text-xl font-extrabold text-primary bg-background rounded-2xl shadow-2xl hover:scale-105 hover:shadow-primary/50 transition-all duration-300"
          >
            Create Customer Account <Zap className="ml-2 w-6 h-6 text-secondary animate-pulse" />
          </Link>
        </div>
      </section>
    </div>
  );
}
