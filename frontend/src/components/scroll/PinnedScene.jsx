import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * PinnedScene — GSAP ScrollTrigger pin wrapper for full-bleed scroll-scrubbed scenes.
 * Pins the container while vertical scroll drives animations via the `onProgress` callback.
 *
 * @param {string} pinDuration - How much scroll distance to hold the pin, e.g. '150%' (of viewport)
 * @param {function} onProgress - Called with progress (0-1) as user scrolls through pinned range
 * @param {boolean} disabled - Force disable pinning (e.g. for mobile)
 * @param {ReactNode} children
 */
export default function PinnedScene({
  children,
  className = '',
  pinDuration = '100%',
  onProgress,
  disabled = false,
  id,
}) {
  const containerRef = useRef(null);
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const shouldPin = !prefersReducedMotion && !disabled;

  useGSAP(() => {
    if (!shouldPin || !containerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: `+=${pinDuration}`,
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        onProgress?.(self.progress);
      },
    });

    return () => trigger.kill();
  }, { scope: containerRef, dependencies: [shouldPin, pinDuration] });

  return (
    <section
      ref={containerRef}
      id={id}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </section>
  );
}
