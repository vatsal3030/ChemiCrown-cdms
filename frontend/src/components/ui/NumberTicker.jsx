import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

/**
 * NumberTicker — Framer Motion powered count-up number animation.
 * Inspired by Magic UI's NumberTicker component.
 * Triggers when the element enters the viewport.
 * Respects prefers-reduced-motion.
 */
export default function NumberTicker({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2,
  className = '',
  delay = 0,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [reduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (reduced) return;
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(parseFloat(value));
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, motionValue, value, reduced, delay]);

  useEffect(() => {
    if (reduced) return;
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent =
          prefix +
          Intl.NumberFormat('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(latest) +
          suffix;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix, decimals, reduced]);

  const finalDisplay =
    prefix +
    Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) +
    suffix;

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {reduced ? finalDisplay : prefix + '0' + suffix}
    </span>
  );
}
