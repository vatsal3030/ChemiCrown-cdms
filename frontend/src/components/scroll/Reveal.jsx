import { motion } from 'framer-motion';
import { useState } from 'react';

const OFFSETS = {
  up:    { hidden: { opacity: 0, y: 50 },  visible: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: 50 },  visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } },
  none:  { hidden: { opacity: 0 },          visible: { opacity: 1 } },
};

/**
 * Reveal — scroll-triggered entrance animation.
 * Uses framer-motion whileInView for GPU-accelerated animations.
 * Falls back to instant visibility under prefers-reduced-motion.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.65,
  once = true,
  amount = 0.2,
  className = '',
  as = 'div',
  ...rest
}) {
  const [reduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const variants = OFFSETS[direction] || OFFSETS.up;
  const Tag = motion[as] || motion.div;

  if (reduced) return <Tag className={className} {...rest}>{children}</Tag>;

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // smooth ease-out-quint
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
