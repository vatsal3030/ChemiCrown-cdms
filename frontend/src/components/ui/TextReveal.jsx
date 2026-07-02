import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ─────────────────────────────────────────────────
   TEXT REVEAL
   Words fade in sequentially as user scrolls.
   Each word transitions from dim to bright.
   ───────────────────────────────────────────────── */
function Word({ children, range, progress }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [4, 0]);

  return (
    <motion.span
      style={{ opacity, y, display: 'inline-block' }}
      className="mr-[0.3em] whitespace-nowrap"
    >
      {children}
    </motion.span>
  );
}

export default function TextReveal({
  text,
  className = '',
  as: Tag = 'h3',
  ...props
}) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'start 0.3'],
  });

  const words = text.split(' ');

  return (
    <Tag ref={containerRef} className={`flex flex-wrap ${className}`} {...props}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={`${word}-${i}`} range={[start, end]} progress={scrollYProgress}>
            {word}
          </Word>
        );
      })}
    </Tag>
  );
}
