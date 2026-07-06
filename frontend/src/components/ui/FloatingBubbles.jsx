import { useMemo, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────
   FLOATING BUBBLES
   Chemistry-themed bubbles rising from bottom.
   Pure CSS animation — with interactive JS pop response.
   ───────────────────────────────────────────────── */
export default function FloatingBubbles({ count = 20, className = '' }) {
  const containerRef = useRef(null);

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

  useEffect(() => {
    const handleBurst = (e) => {
      if (!containerRef.current) return;
      const { x, y } = e.detail || {};
      if (typeof x !== 'number' || typeof y !== 'number') return;

      const bubbleElems = containerRef.current.querySelectorAll('.floating-bubble');
      bubbleElems.forEach(el => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance
        const dx = centerX - x;
        const dy = centerY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If bubble is within 220px of the burst point, trigger popping animation
        if (dist < 220) {
          el.classList.add('bubble-popped');
          // Remove class after animation is complete so it can float again next cycle
          setTimeout(() => {
            el.classList.remove('bubble-popped');
          }, 1500);
        }
      });
    };

    window.addEventListener('chemicrown-burst', handleBurst);
    return () => window.removeEventListener('chemicrown-burst', handleBurst);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <style>{`
        .bubble-popped {
          animation: bubble-pop 0.35s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        @keyframes bubble-pop {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(1.4); opacity: 0.7; filter: saturate(1.8) brightness(1.2); }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>

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
