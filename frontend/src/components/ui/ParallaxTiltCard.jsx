import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ─────────────────────────────────────────────────
   PARALLAX TILT CARD
   Cards that tilt in 3D based on mouse position
   with a glare overlay that follows the cursor.
   ───────────────────────────────────────────────── */
export default function ParallaxTiltCard({
  children,
  className = '',
  tiltMax = 10,
  glare = true,
  scale = 1.02,
  perspective = 1000,
  ...props
}) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(my, [0, 1], [tiltMax, -tiltMax]), {
    stiffness: 200, damping: 25,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-tiltMax, tiltMax]), {
    stiffness: 200, damping: 25,
  });

  const glareX = useTransform(mx, [0, 1], ['0%', '100%']);
  const glareY = useTransform(my, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <div style={{ perspective }} className="w-full h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative w-full h-full ${className}`}
        {...props}
      >
        {children}

        {/* Glare overlay */}
        {glare && (
          <motion.div
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-20"
            style={{
              background: useTransform(
                mx,
                [0, 1],
                [
                  'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.12), transparent 60%)',
                  'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.12), transparent 60%)',
                ]
              ),
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
