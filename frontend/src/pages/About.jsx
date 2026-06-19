import { useState, useRef, useEffect } from 'react';
import { Target, Lightbulb, Users, Award, Globe } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Reveal from '@/components/scroll/Reveal';

gsap.registerPlugin(ScrollTrigger);

/* ── Timeline milestones ── */
const MILESTONES = [
  {
    year: '1995', title: 'Foundation',
    desc: 'ChemiCrown established in Bhavnagar, Gujarat — focusing on high-grade GP Thinner for local automotive industries.',
    color: '#FF5A3C',
  },
  {
    year: '2010', title: 'National Expansion',
    desc: 'Portfolio expanded to 50+ chemical variants with distribution hubs across 5 major Indian states.',
    color: '#2F6FED',
  },
  {
    year: '2026', title: 'Digital Transformation',
    desc: 'Launch of the ChemiCrown CDMS, revolutionizing how customers order and track chemical inventory.',
    color: '#22B27D',
  },
];

const STATS = [
  { value: '30', suffix: '+', label: 'Years Experience' },
  { value: '50', suffix: '+', label: 'Chemical Variants' },
  { value: '5', suffix: '', label: 'State Coverage' },
  { value: '500', suffix: '+', label: 'Active Clients' },
];

/* ── CountUp ── */
function CountUp({ target, suffix = '' }) {
  const ref = useRef(null);
  useGSAP(() => {
    if (!ref.current) return;
    const num = parseFloat(target);
    if (isNaN(num)) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: num, duration: 2.5, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(obj.v) + suffix; },
    });
  }, { scope: ref });
  return <span ref={ref} className="tabular-nums">0{suffix}</span>;
}

/* ═══════════════════════════════════════
   ABOUT PAGE
   ═══════════════════════════════════════ */
export default function About() {
  const mainContainerRef = useRef(null);
  const heroRef = useRef(null);
  const timelineSectionRef = useRef(null);
  const horizontalTrackRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef, offset: ['start start', 'end start'],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useGSAP(() => {
    // Only run on desktop (md+)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) return;

    const container = mainContainerRef.current;
    if (!container) return;

    const panels = gsap.utils.toArray('.about-panel');
    const track = horizontalTrackRef.current;
    
    // Set all panels except first to translation yPercent: 100
    gsap.set(panels.slice(1), { yPercent: 100 });

    const scrollWidth = track ? track.scrollWidth - window.innerWidth : 0;
    
    // Create combined master timeline with increased scroll distance to slow down scroll speed
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${scrollWidth + window.innerHeight * 5.5}`,
        invalidateOnRefresh: true,
      }
    });

    // 1. Slide Panel 2 (Timeline) up (Time: 0.0 -> 1.0)
    tl.to(panels[1], {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 1.0
    }, 0);
    tl.to(panels[0], {
      scale: 0.94,
      opacity: 0.3,
      ease: 'power1.inOut',
      duration: 1.0
    }, 0);

    // 2. Slide horizontal track of Panel 2 (Time: 1.0 -> 4.0)
    if (scrollWidth > 0) {
      tl.to(track, {
        x: -scrollWidth,
        ease: 'none',
        duration: 3.0
      }, 1.0);
      tl.fromTo('.timeline-progress-line',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, ease: 'none', duration: 3.0 },
        1.0
      );

      const milestones = gsap.utils.toArray('.timeline-milestone');
      const trackWidth = track.scrollWidth;

      milestones.forEach((milestone, idx) => {
        const card = milestone.querySelector('.timeline-card');
        const dot = milestone.querySelector('.timeline-dot');
        if (!card || !dot) return;

        // Calculate exact horizontal position of the dot relative to the track
        const d_i = milestone.offsetLeft + milestone.offsetWidth / 2;
        const fraction = d_i / trackWidth;
        const time_i = 1.0 + 3.0 * fraction;

        // Animate Dot: scale up, transition background color and add vibrant glowing box-shadow when reached
        tl.fromTo(dot,
          { scale: 0.6, opacity: 0.2, filter: 'blur(1.5px)', backgroundColor: '#0d162d' },
          { 
            scale: 1.4, 
            opacity: 1, 
            filter: 'blur(0px)', 
            backgroundColor: MILESTONES[idx].color,
            boxShadow: `0 0 24px ${MILESTONES[idx].color}`,
            duration: 0.25, 
            ease: 'power2.out' 
          },
          time_i
        );
        tl.to(dot, { 
          scale: 1.0, 
          boxShadow: `0 0 12px ${MILESTONES[idx].color}80`,
          duration: 0.2, 
          ease: 'power2.inOut' 
        }, time_i + 0.25);

        // Animate Card: slide in from edge (top down / bottom up) and pop out elegantly
        const yStart = idx % 2 === 0 ? -60 : 60;
        tl.fromTo(card,
          { opacity: 0, y: yStart, scale: 0.85, filter: 'blur(6px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'back.out(1.3)' },
          time_i
        );
      });
    }

    // 3. Slide Panel 3 (Purpose) up (Time: 4.0 -> 5.0)
    tl.to(panels[2], {
      yPercent: 0,
      ease: 'power1.inOut',
      duration: 1.0
    }, 4.0);
    tl.to(panels[1], {
      scale: 0.94,
      opacity: 0.3,
      ease: 'power1.inOut',
      duration: 1.0
    }, 4.0);

    // Stagger reveal title and cards inside Panel 3 DURING the transition (Time: 4.1 -> 4.8)
    tl.fromTo('.purpose-title',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
      4.1
    );
    tl.fromTo('.purpose-card',
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out' },
      4.3
    );

  }, { scope: mainContainerRef, dependencies: [] });

  return (
    <div ref={mainContainerRef} className="relative bg-ink overflow-hidden w-full min-h-screen">

      {/* ═══════ SLIDE 1: HERO & STATS ═══════ */}
      <div className="about-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-ink z-10 flex flex-col justify-between">
        <div ref={heroRef} className="relative flex-1 flex items-center justify-center overflow-hidden py-16 md:py-0">
          <motion.div className="absolute inset-0 z-0" style={{ y: heroImgY }}>
            <img src="/images/about-hero-bg.png" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ink/65" />
          </motion.div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-ink/30 via-transparent to-ink pointer-events-none" />

          <motion.div className="relative z-10 text-center px-6 max-w-4xl mx-auto" style={{ opacity: heroOpacity }}>
            <Reveal delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent-amber mb-6">
                <Award className="w-4 h-4" /> Established 1995
              </span>
            </Reveal>
            <Reveal delay={0.2}>
              <h1 className="text-headline text-4xl sm:text-6xl md:text-7xl text-white mb-6 leading-[1.05]">
                About ChemiCrown
              </h1>
            </Reveal>
            <Reveal delay={0.35}>
              <p className="text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
                Building the foundation of modern manufacturing through reliable,
                pure, and high-performance chemical solutions since 1995.
              </p>
            </Reveal>
          </motion.div>
        </div>

        {/* Stats bar */}
        <section className="relative py-12 bg-ink-2 border-t border-white/[0.05] z-10">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.1} className="text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-headline text-white mb-2">
                    <CountUp target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{s.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ═══════ SLIDE 2: JOURNEY TIMELINE ═══════ */}
      <div ref={timelineSectionRef} className="about-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-[#0d162d] z-20 flex flex-col justify-center border-y border-white/[0.04]">
        {/* Background glow & mesh */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(47,111,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(47,111,237,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-accent-cobalt/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[160px] pointer-events-none" />

        {/* Mobile View (Vertical Scrollable fallback) */}
        <div className="block md:hidden py-20 px-6">
          <div className="text-center mb-16">
            <Reveal>
              <h2 className="text-headline text-3xl text-white mb-4">Our Journey</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Three decades of growth, innovation, and unwavering commitment to quality.
              </p>
            </Reveal>
          </div>

          <div className="relative max-w-md mx-auto">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-brand via-accent-cobalt to-accent-emerald" />
            {MILESTONES.map((m, i) => (
              <Reveal key={m.year} delay={i * 0.1} direction="left">
                <div className="relative flex items-start gap-4 mb-12 last:mb-0">
                  <div className="absolute left-4 -translate-x-1/2 mt-1.5 z-10">
                    <div className="w-3.5 h-3.5 rounded-full border-[3px] border-ink" style={{ backgroundColor: m.color }} />
                  </div>
                  <div className="ml-10 bg-ink-2 border border-white/[0.06] rounded-2xl p-5 w-full">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white mb-2" style={{ backgroundColor: m.color }}>{m.year}</span>
                    <h3 className="text-base font-bold text-white mb-1.5">{m.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Desktop View (GSAP horizontal slider) */}
        <div className="hidden md:flex h-full flex-col justify-center relative py-6">
          <div className="container mx-auto px-12 max-w-7xl mb-4 relative z-20">
            <h2 className="text-headline text-5xl text-white mb-2">Our Journey</h2>
            <p className="text-slate-400 text-base max-w-xl leading-relaxed">
              Three decades of growth, innovation, and unwavering commitment to quality.
            </p>
          </div>

          <div className="relative w-full overflow-hidden flex-1 flex items-center">
            <div ref={horizontalTrackRef} className="flex items-center gap-24 relative pl-[10vw] pr-[25vw] h-[450px]">
              <div className="absolute left-0 right-0 h-[2px] bg-white/10 top-1/2 -translate-y-1/2 z-0" />
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-accent-cobalt to-accent-emerald top-1/2 -translate-y-1/2 z-0 timeline-progress-line origin-left" />

              {MILESTONES.map((m, i) => (
                <div key={m.year} className="relative flex flex-col items-center justify-between h-full w-[340px] shrink-0 timeline-milestone select-none">
                  {/* Top Slot */}
                  {i % 2 === 0 ? (
                    <div className="timeline-card bg-ink-2/95 border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-colors duration-300 w-full text-left relative z-20 shadow-2xl backdrop-blur-md">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3" style={{ backgroundColor: m.color }}>{m.year}</span>
                      <h3 className="text-lg font-bold text-white mb-2">{m.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  ) : (
                    <div className="h-[180px] w-full" />
                  )}

                  {/* Dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="timeline-dot w-6 h-6 rounded-full border-4 border-ink" style={{ backgroundColor: m.color }} />
                  </div>

                  {/* Bottom Slot */}
                  {i % 2 !== 0 ? (
                    <div className="timeline-card bg-ink-2/95 border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-colors duration-300 w-full text-left relative z-20 shadow-2xl backdrop-blur-md">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3" style={{ backgroundColor: m.color }}>{m.year}</span>
                      <h3 className="text-lg font-bold text-white mb-2">{m.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  ) : (
                    <div className="h-[180px] w-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ SLIDE 3: MISSION & VISION ═══════ */}
      <div className="about-panel relative md:absolute md:inset-0 min-h-screen md:h-screen w-full bg-paper z-30 flex flex-col justify-center">
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#0B1220 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-headline text-3xl sm:text-5xl text-ink mb-5 purpose-title">Our Purpose</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="purpose-card bg-white border border-slate-200/60 p-8 md:p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 h-full text-left">
              <div className="w-14 h-14 bg-accent-cobalt/10 rounded-2xl flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-accent-cobalt" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-ink">Our Mission</h3>
              <p className="text-slate-500 leading-relaxed">
                To empower industrial growth by delivering uncompromisingly pure
                chemicals, ensuring seamless supply chains, and maintaining the
                highest standards of environmental safety and corporate responsibility.
              </p>
            </div>

            <div className="purpose-card bg-white border border-slate-200/60 p-8 md:p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 h-full text-left">
              <div className="w-14 h-14 bg-accent-amber/10 rounded-2xl flex items-center justify-center mb-6">
                <Lightbulb className="h-7 w-7 text-accent-amber" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-ink">Our Vision</h3>
              <p className="text-slate-500 leading-relaxed">
                To be the most trusted name in chemical distribution globally,
                pioneering digital supply chain innovations to bring absolute
                transparency and efficiency to our partners.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
