import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, Droplet, Truck, ShieldCheck, ChevronDown,
  FlaskConical, TestTubes, Warehouse, PackageCheck, CircleCheckBig
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useSWR from 'swr';
import Reveal from '@/components/scroll/Reveal';

gsap.registerPlugin(ScrollTrigger);

/* ── data ── */
const SUPPLY_STEPS = [
  { icon: FlaskConical, label: 'Sourcing', desc: 'Premium raw materials from certified global suppliers' },
  { icon: TestTubes,    label: 'Quality Testing', desc: 'Rigorous lab analysis ensuring 99.9% purity' },
  { icon: Warehouse,    label: 'Storage', desc: 'Climate-controlled, safety-compliant warehousing' },
  { icon: PackageCheck, label: 'Distribution', desc: 'Hubs across 5 major Indian states' },
  { icon: CircleCheckBig, label: 'Delivery', desc: 'Rapid, fully compliant transit to your facility' },
];

const FEATURES = [
  {
    icon: Droplet, color: '#2F6FED', title: 'Unmatched Purity',
    desc: 'Our chemicals undergo rigorous laboratory testing to ensure 99.9% purity, meeting strict industrial compliance standards.',
    stat: '99.9', suffix: '%', statLabel: 'Purity Standard',
  },
  {
    icon: Truck, color: '#E8A33D', title: 'Express Delivery',
    desc: 'With distribution hubs across major industrial zones, we guarantee rapid, safe, and fully compliant transit.',
    stat: '24', suffix: 'hr', statLabel: 'Average Dispatch',
  },
  {
    icon: ShieldCheck, color: '#22B27D', title: 'ISO 9001 Certified',
    desc: 'Our facilities operate strictly under ISO 9001 guidelines, ensuring complete safety for your workforce and environment.',
    stat: '9001', suffix: '', statLabel: 'ISO Standard',
  },
];

/* ── helpers ── */
const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) return [];
  // Return max 3 products to fit a single stacked screen beautifully
  return json.data.filter(p => p.isAvailable !== false).slice(0, 3);
};

function CountUp({ target, suffix = '' }) {
  const ref = useRef(null);
  useGSAP(() => {
    if (!ref.current) return;
    const num = parseFloat(target);
    if (isNaN(num)) { ref.current.textContent = target + suffix; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: num, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      onUpdate: () => {
        if (!ref.current) return;
        ref.current.textContent = (num % 1 !== 0 ? obj.v.toFixed(1) : Math.round(obj.v)) + suffix;
      },
    });
  }, { scope: ref });
  return <span ref={ref} className="tabular-nums">0{suffix}</span>;
}

/* ═══════════════════════════════════════
   HOME
   ═══════════════════════════════════════ */
export default function Home() {
  const mainContainerRef = useRef(null);

  const { data: products } = useSWR(
    `${import.meta.env.VITE_API_URL}/api/inventory?limit=3`, fetcher,
    { revalidateOnFocus: false },
  );

  useGSAP(() => {
    // Only run on desktop (md+)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) return;

    const container = mainContainerRef.current;
    if (!container) return;

    const panels = gsap.utils.toArray('.home-panel');
    
    // Set all panels except first to translation yPercent: 100
    gsap.set(panels.slice(1), { yPercent: 100 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${panels.length * window.innerHeight * 1.3}`,
        invalidateOnRefresh: true,
      }
    });

    // 0. Hero Zoom-Through (first section transitions)
    tl.to('.hero-bg-img', { scale: 1.12, y: '12%', ease: 'none', duration: 0.5 }, 0);
    tl.to('.hero-molecules-svg', { scale: 2.3, opacity: 0, ease: 'none', duration: 0.5 }, 0);
    tl.to('.hero-content-text', { opacity: 0, y: -30, ease: 'none', duration: 0.4 }, 0);

    // 1. Slide Panel 2 (Supply Chain) up
    tl.to(panels[1], {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 0.8
    }, 0.4);
    tl.to(panels[0], {
      scale: 0.94,
      opacity: 0.3,
      ease: 'power1.inOut',
      duration: 0.8
    }, 0.4);

    tl.fromTo('.supply-step-reveal',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      0.7
    );

    // 2. Slide Panel 3 (Why Choose Us) up
    tl.to(panels[2], {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 0.8
    }, 1.4);
    tl.to(panels[1], {
      scale: 0.94,
      opacity: 0.3,
      ease: 'power1.inOut',
      duration: 0.8
    }, 1.4);

    tl.fromTo('.feature-card-reveal',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out' },
      1.7
    );

    // 3. Slide Panel 4 (Featured Products) up
    tl.to(panels[3], {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 0.8
    }, 2.4);
    tl.to(panels[2], {
      scale: 0.94,
      opacity: 0.3,
      ease: 'power1.inOut',
      duration: 0.8
    }, 2.4);

    tl.fromTo('.product-card-reveal',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      2.7
    );

    // 4. Slide Panel 5 (CTA) up
    tl.to(panels[4], {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 0.8
    }, 3.4);
    tl.to(panels[3], {
      scale: 0.94,
      opacity: 0.3,
      ease: 'power1.inOut',
      duration: 0.8
    }, 3.4);

    tl.fromTo('.cta-content-reveal',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      3.7
    );

  }, { scope: mainContainerRef, dependencies: [] });

  return (
    <div ref={mainContainerRef} className="relative bg-ink overflow-hidden w-full min-h-screen">

      {/* ═══════ PANEL 1 — HERO ═══════ */}
      <div className="home-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-ink z-10 flex items-center justify-center overflow-hidden">
        {/* Parallax background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.png" alt=""
            className="hero-bg-img w-full h-full object-cover animate-fade-in origin-center"
          />
          <div className="absolute inset-0 bg-ink/75" />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-ink/30 via-transparent to-ink pointer-events-none" />

        {/* Foreground 3D molecules scaling past the camera */}
        <div className="absolute inset-0 z-[2] pointer-events-none flex items-center justify-center overflow-hidden">
          <svg className="hero-molecules-svg w-[130vw] h-[130vh] text-brand/10 dark:text-brand/5 stroke-current fill-none shrink-0 origin-center" viewBox="0 0 800 600">
            {/* Left float molecules */}
            <path d="M120,120 L160,90 L200,120 L200,170 L160,200 L120,170 Z" strokeWidth="2.5" />
            <circle cx="120" cy="120" r="5" className="fill-brand/60" />
            <circle cx="160" cy="90" r="5" className="fill-brand/60" />
            <circle cx="200" cy="120" r="5" className="fill-brand/60" />
            <circle cx="200" cy="170" r="5" className="fill-brand/60" />
            <circle cx="160" cy="200" r="5" className="fill-brand/60" />
            <circle cx="120" cy="170" r="5" className="fill-brand/60" />
            <line x1="200" y1="120" x2="260" y2="90" strokeWidth="1.5" strokeDasharray="3,3" />
            <circle cx="260" cy="90" r="4" className="fill-accent-cobalt" />

            {/* Right float molecules */}
            <path d="M620,380 L670,350 L720,380 L720,440 L670,470 L620,440 Z" strokeWidth="2.5" />
            <circle cx="620" cy="380" r="6" className="fill-accent-emerald" />
            <circle cx="670" cy="350" r="6" className="fill-accent-emerald" />
            <circle cx="720" cy="380" r="6" className="fill-accent-emerald" />
            <circle cx="720" cy="440" r="6" className="fill-accent-emerald" />
            <circle cx="670" cy="470" r="6" className="fill-accent-emerald" />
            <circle cx="620" cy="440" r="6" className="fill-accent-emerald" />

            {/* Floating background bonds */}
            <path d="M380,80 L420,50 L460,80 L460,130 L420,160 M420,50 L420,0" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="380" cy="80" r="3" className="fill-slate-500" />
            <circle cx="460" cy="80" r="3" className="fill-slate-500" />
          </svg>
        </div>

        {/* Content */}
        <div className="hero-content-text relative z-10 text-center px-6 max-w-5xl mx-auto">
          <Reveal delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-5 py-2 text-sm font-semibold text-brand mb-8 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              Enterprise Grade Chemical Solutions
            </span>
          </Reveal>

          <Reveal delay={0.2}>
            <h1 className="text-headline text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-white mb-8 leading-[1.05]">
              Precision Chemicals<br className="hidden sm:block" /> for Modern Industry
            </h1>
          </Reveal>

          <Reveal delay={0.35}>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-300/90 mb-14 leading-relaxed">
              ChemiCrown delivers premium thinners, solvents, and specialized
              industrial chemicals with uncompromising quality and reliable
              distribution networks across India.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/catalog"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-brand rounded-xl shadow-[0_8px_32px_rgba(255,90,60,0.35)] hover:shadow-[0_12px_40px_rgba(255,90,60,0.5)] hover:bg-[#ff6a4e] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Products
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-white/10 backdrop-blur border border-white/15 rounded-xl hover:bg-white/20 transition-all duration-300 group"
              >
                Contact Sales
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Reveal>

          <div className="mt-20 flex flex-col items-center text-slate-500 animate-bounce">
            <span className="text-[10px] uppercase tracking-[0.25em] mb-1.5">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ═══════ PANEL 2 — SUPPLY CHAIN ═══════ */}
      <div className="home-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-ink z-20 flex flex-col justify-center border-t border-white/[0.04] overflow-hidden">
        {/* BG image */}
        <img
          src="/images/supply-chain-bg.png" alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
        <div className="absolute inset-0 bg-ink-2/90" />

        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-headline text-3xl sm:text-5xl md:text-6xl text-white mb-4">
              From Source to Site
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
              Every chemical we deliver follows a rigorous five-stage journey ensuring safety and purity at every step.
            </p>
          </div>

          {/* Steps — responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {SUPPLY_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="supply-step-reveal flex flex-col items-center text-center group">
                  {/* Step number + icon */}
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-accent-cobalt/10 border border-accent-cobalt/20 flex items-center justify-center group-hover:bg-accent-cobalt/20 group-hover:border-accent-cobalt/40 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-8 h-8 text-accent-cobalt" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent-cobalt text-white text-xs font-bold flex items-center justify-center shadow-lg">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base mb-2">{step.label}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[200px]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════ PANEL 3 — WHY CHOOSE US ═══════ */}
      <div className="home-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-paper z-30 flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#0B1220 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-headline text-3xl sm:text-5xl text-ink mb-4">
              Why Choose ChemiCrown?
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
              Decades of chemical expertise combined with cutting-edge supply chain management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="feature-card-reveal h-full">
                  <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col text-left">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${feat.color}12` }}
                    >
                      <Icon className="w-8 h-8" style={{ color: feat.color }} />
                    </div>

                    <h3 className="text-xl font-bold text-ink mb-3">{feat.title}</h3>
                    <p className="text-slate-500 text-[15px] leading-relaxed mb-6 flex-1">{feat.desc}</p>

                    {/* Stat */}
                    <div className="pt-5 border-t border-slate-100 mt-auto">
                      <div className="text-3xl font-extrabold text-headline" style={{ color: feat.color }}>
                        <CountUp target={feat.stat} suffix={feat.suffix} />
                      </div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
                        {feat.statLabel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════ PANEL 4 — LIQUID MACRO & FEATURED PRODUCTS ═══════ */}
      <div className="home-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-ink z-40 flex flex-col justify-center border-t border-white/[0.04] overflow-hidden">
        {/* Parallax background overlay */}
        <div className="absolute inset-0 z-0 opacity-15">
          <img src="/images/liquid-macro-bg.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-ink-2/95 z-0" />

        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-headline text-3xl sm:text-5xl md:text-6xl text-white mb-4">
              Featured Products
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Industrial &amp; laboratory chemicals — direct from manufacturer.
            </p>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <div key={product.id} className="product-card-reveal h-full">
                  <Link
                    to={`/catalog/${product.id}`}
                    className="group block bg-ink-2 rounded-2xl border border-white/[0.06] overflow-hidden hover:border-accent-cobalt/30 hover:shadow-2xl hover:shadow-accent-cobalt/5 transition-all duration-500 hover:-translate-y-1 h-full"
                  >
                    <div className="aspect-[4/3] relative bg-[#0d1530] overflow-hidden">
                      {product.imageUrls?.length > 0 ? (
                        <img
                          src={product.imageUrls[0]} alt={product.name} loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <img
                          src={i % 2 === 0 ? '/images/chemical-drum.png' : '/images/chemical-beaker.png'}
                          alt={product.name} loading="lazy"
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                      {product.category?.name && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-5 text-left">
                      <h3 className="text-white font-bold text-base mb-1 group-hover:text-accent-cobalt transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      {product.casNumber && (
                        <p className="text-slate-500 text-xs font-mono mb-3">CAS {product.casNumber}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold text-brand">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-accent-cobalt font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-ink-2 rounded-2xl border border-white/[0.06] overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-white/[0.03]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                    <div className="h-6 bg-white/[0.04] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 text-accent-cobalt hover:text-white transition-colors text-base font-semibold group"
            >
              Browse Full Catalog
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ PANEL 5 — CTA ═══════ */}
      <div className="home-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full flex flex-col justify-center overflow-hidden bg-gradient-to-br from-brand via-[#e04a30] to-[#c73820] shadow-[0_-30px_60px_rgba(0,0,0,0.45)] z-50">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-white/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] rounded-full bg-black/15 blur-[100px] -ml-40 -mb-40 pointer-events-none" />

        <div className="cta-content-reveal container mx-auto px-6 text-center relative z-10 max-w-4xl">
          <h2 className="text-headline text-4xl md:text-5xl lg:text-6xl text-white mb-8">
            Ready to streamline<br className="hidden sm:block" /> your supply chain?
          </h2>

          <p className="text-white/90 text-lg md:text-xl mb-14 max-w-2xl mx-auto leading-relaxed">
            Create an account today to access real-time inventory tracking,
            wholesale pricing, and instant quotations through our CDMS.
          </p>

          <div className="inline-block">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-extrabold text-brand bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_56px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Create Customer Account
              <Zap className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
