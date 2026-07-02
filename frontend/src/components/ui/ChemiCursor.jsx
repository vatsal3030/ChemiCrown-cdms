import { useEffect, useRef, useState } from 'react';

/**
 * ChemiCursor — Custom chemistry-themed cursor for public marketing pages.
 * Shows a molecular/chemical ring cursor that follows the mouse with smooth lerp.
 * Inner dot = primary color, outer ring = glass with chemistry symbol.
 * Reacts to hoverable elements (links, buttons) with scale + color change.
 * Hidden on mobile / touch devices. Respects reduced motion.
 */
export default function ChemiCursor() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const trailRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const [hidden, setHidden] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Skip on touch devices or reduced motion
    if ('ontouchstart' in window) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (hidden) setHidden(false);
    };

    const onEnter = () => setHidden(false);
    const onLeave = () => setHidden(true);

    // Detect hoverable elements
    const onOver = (e) => {
      const el = e.target.closest('a, button, [role="button"], input, select, textarea, .cursor-hover');
      setHovering(!!el);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseover', onOver);

    // Animation loop with lerp
    let raf;
    const lerp = (a, b, t) => a + (b - a) * t;
    const animate = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.15);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.15);

      if (outerRef.current) {
        outerRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px) scale(${hovering ? 1.5 : 1})`;
      }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`;
      }
      if (trailRef.current) {
        const trailX = lerp(pos.current.x, target.current.x, 0.05);
        const trailY = lerp(pos.current.y, target.current.y, 0.05);
        trailRef.current.style.transform = `translate(${trailX - 3}px, ${trailY - 3}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // Hide default cursor on body by adding helper class
    document.body.classList.add('custom-cursor-active');

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [hidden, hovering]);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden mix-blend-difference" aria-hidden="true">
      {/* Trail particle */}
      <div
        ref={trailRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: 'rgba(255, 143, 120, 0.3)',
          opacity: hidden ? 0 : 0.6,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Outer ring — molecular orbital */}
      <div
        ref={outerRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border-2 transition-[border-color,opacity] duration-300"
        style={{
          borderColor: hovering ? '#ff8f78' : 'rgba(255, 255, 255, 0.5)',
          opacity: hidden ? 0 : 1,
          willChange: 'transform',
        }}
      >
        {/* Orbiting electron dots */}
        <div className="orbiting-dot-1" />
        <div className="orbiting-dot-2" />
      </div>

      {/* Inner dot — nucleus */}
      <div
        ref={innerRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full transition-[background-color,opacity] duration-200"
        style={{
          background: hovering ? '#ff8f78' : '#fff',
          opacity: hidden ? 0 : 1,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
