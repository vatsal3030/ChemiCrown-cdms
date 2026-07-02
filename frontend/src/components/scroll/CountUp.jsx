import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * CountUp — GSAP-powered number count-up on scroll.
 * Fires once when element enters viewport.
 * Respects prefers-reduced-motion (shows final value immediately).
 */
export default function CountUp({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
  decimals,
  className = '',
}) {
  const ref = useRef(null);
  const [reduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useGSAP(() => {
    if (!ref.current) return;
    const num = parseFloat(target);
    if (isNaN(num)) {
      ref.current.textContent = prefix + target + suffix;
      return;
    }

    // Reduced motion: show final value immediately
    if (reduced) {
      const display = decimals != null
        ? num.toFixed(decimals)
        : (num % 1 !== 0 ? num.toFixed(1) : String(Math.round(num)));
      ref.current.textContent = prefix + display + suffix;
      return;
    }

    const obj = { v: 0 };
    gsap.to(obj, {
      v: num,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        if (!ref.current) return;
        const display = decimals != null
          ? obj.v.toFixed(decimals)
          : (num % 1 !== 0 ? obj.v.toFixed(1) : String(Math.round(obj.v)));
        ref.current.textContent = prefix + display + suffix;
      },
    });
  }, { scope: ref });

  const initial = prefix + '0' + suffix;

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {reduced ? prefix + target + suffix : initial}
    </span>
  );
}
