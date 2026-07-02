import { useMemo } from 'react';

/* ─────────────────────────────────────────────────
   FLOATING BUBBLES
   Chemistry-themed bubbles rising from bottom.
   Pure CSS animation — zero JS overhead.
   ───────────────────────────────────────────────── */
export default function FloatingBubbles({ count = 20, className = '' }) {
  const bubbles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 20 + 6;
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = Math.random() * 12 + 10;
      const opacity = Math.random() * 0.15 + 0.05;
      // Chemistry accent colors
      const colors = ['#ff8f78', '#729aff', '#cdffe2', '#ff5c3e', '#adc2ff'];
      const color = colors[i % colors.length];

      return { id: i, size, left, delay, duration, opacity, color };
    });
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="floating-bubble absolute rounded-full"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            bottom: '-5%',
            background: `radial-gradient(circle at 30% 30%, ${b.color}40, ${b.color}10)`,
            border: `1px solid ${b.color}20`,
            opacity: b.opacity,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
