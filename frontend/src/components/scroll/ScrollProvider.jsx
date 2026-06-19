import { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollContext = createContext(null);
export function useScrollCtx() { return useContext(ScrollContext); }

/**
 * ScrollProvider — lightweight Lenis smooth-scroll synced to GSAP.
 * Uses Lenis's own rAF loop (no double-ticker) for best performance.
 */
export default function ScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Skip on reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.08,            // lower = smoother, less floaty
      wheelMultiplier: 0.9,  // dampen scroll speed slightly
      touchMultiplier: 1.5,
      infinite: false,
      autoRaf: false,        // Disable Lenis internal rAF loop
    });
    lenisRef.current = lenis;

    // Sync lenis → GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP ticker for perfect synchronization
    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Recalculate scroll limits after ScrollTrigger updates page height (using setTimeout to avoid loops)
    const handleRefresh = () => {
      setTimeout(() => {
        lenis.resize();
      }, 0);
    };
    ScrollTrigger.addEventListener('refresh', handleRefresh);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
      ScrollTrigger.removeEventListener('refresh', handleRefresh);
      lenisRef.current = null;
    };
  }, []);

  // Refresh ScrollTrigger pins on route change
  useEffect(() => {
    const id = setTimeout(() => {
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
      lenisRef.current?.scrollTo(0, { immediate: true });
    }, 150);
    return () => clearTimeout(id);
  }, [location.pathname]);

  return (
    <ScrollContext.Provider value={lenisRef}>
      {children}
    </ScrollContext.Provider>
  );
}
