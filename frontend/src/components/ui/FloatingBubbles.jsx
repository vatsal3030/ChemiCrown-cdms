import { useMemo, useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────
   FLOATING BUBBLES
   Chemistry-themed bubbles rising from bottom.
   Pure CSS animation — with interactive JS pop response,
   clickable popping, and premium screen-level shockwave ripples.
   ───────────────────────────────────────────────── */
export default function FloatingBubbles({ count = 20, className = '' }) {
  const containerRef = useRef(null);
  const [shockwaves, setShockwaves] = useState([]);

  const bubbles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 20 + 8;
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

      const rect = containerRef.current.getBoundingClientRect();
      const relX = x - rect.left;
      const relY = y - rect.top;

      // Spawn a visual screen shockwave ripple at the specific container-relative blast point
      const newShockwave = { id: Date.now() + Math.random(), x: relX, y: relY };
      setShockwaves(prev => [...prev, newShockwave]);
      setTimeout(() => {
        setShockwaves(prev => prev.filter(s => s.id !== newShockwave.id));
      }, 800);

      // Pop any bubbles within 220px of the blast area
      const bubbleElems = containerRef.current.querySelectorAll('.floating-bubble');
      bubbleElems.forEach(el => {
        const brect = el.getBoundingClientRect();
        const centerX = brect.left + brect.width / 2;
        const centerY = brect.top + brect.height / 2;
        
        // Calculate distance
        const dx = centerX - x;
        const dy = centerY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If bubble is within 220px of the burst point, trigger popping animation
        if (dist < 220) {
          if (!el.classList.contains('bubble-popped')) {
            el.classList.add('bubble-popped');
            setTimeout(() => {
              el.classList.remove('bubble-popped');
            }, 1200);
          }
        }
      });
    };

    window.addEventListener('chemicrown-burst', handleBurst);
    return () => window.removeEventListener('chemicrown-burst', handleBurst);
  }, []);

  const handleBubbleClick = (e) => {
    const el = e.currentTarget;
    if (el.classList.contains('bubble-popped')) return;

    el.classList.add('bubble-popped');
    setTimeout(() => {
      el.classList.remove('bubble-popped');
    }, 1200);
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <style>{`
        .floating-bubble {
          transition: border-color 0.2s, background 0.2s;
        }
        .floating-bubble:hover {
          border-color: rgba(255,255,255,0.4) !important;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.05)) !important;
        }
        .bubble-popped {
          animation: bubble-pop 0.3s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        @keyframes bubble-pop {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(1.35); opacity: 0.7; filter: saturate(1.8) brightness(1.2); }
          100% { transform: scale(0); opacity: 0; }
        }
        .screen-ripple {
          animation: screen-ripple-expand 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        @keyframes screen-ripple-expand {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 1;
            border-color: rgba(57, 255, 20, 0.8);
            box-shadow: 0 0 15px rgba(57, 255, 20, 0.4), inset 0 0 10px rgba(57, 255, 20, 0.2);
          }
          50% {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 25px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
            border-width: 0.5px;
          }
        }
      `}</style>

      {/* Screen-level shockwave ripples */}
      {shockwaves.map((sw) => (
        <div
          key={sw.id}
          className="screen-ripple absolute border-2 rounded-full pointer-events-none"
          style={{
            left: `${sw.x}px`,
            top: `${sw.y}px`,
            width: '320px',
            height: '320px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {bubbles.map((b) => (
        <div
          key={b.id}
          className="floating-bubble absolute rounded-full pointer-events-auto cursor-pointer"
          onClick={handleBubbleClick}
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            bottom: '-10%',
            background: `radial-gradient(circle at 30% 30%, ${b.color}45, ${b.color}12)`,
            border: `1px solid ${b.color}25`,
            opacity: b.opacity,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
