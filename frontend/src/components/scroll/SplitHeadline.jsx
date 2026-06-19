import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * SplitHeadline — GSAP SplitText headline with per-line/per-word reveal on scroll.
 * Uses Space Grotesk display font. Falls back to simple opacity fade under reduced motion.
 *
 * @param {string} text - The headline text
 * @param {'lines'|'words'|'chars'} splitType - How to split the text
 * @param {string} tag - HTML tag to use (default 'h2')
 * @param {boolean} scrub - Whether to scrub with scroll (true) or trigger once
 * @param {string} className - Additional CSS classes
 */
export default function SplitHeadline({
  text,
  splitType = 'lines',
  tag: Tag = 'h2',
  scrub = true,
  className = '',
  start = 'top 80%',
  end = 'top 20%',
}) {
  const headlineRef = useRef(null);
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useGSAP(() => {
    if (prefersReducedMotion || !headlineRef.current) return;

    const split = SplitText.create(headlineRef.current, {
      type: splitType,
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
    });

    const targets = split[splitType] || split.lines;

    gsap.set(targets, {
      opacity: 0,
      y: 60,
      rotateX: -15,
    });

    gsap.to(targets, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: scrub ? undefined : 0.8,
      stagger: scrub ? undefined : 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: headlineRef.current,
        start,
        end,
        scrub: scrub ? 0.8 : false,
        toggleActions: scrub ? undefined : 'play none none none',
      },
    });

  }, { scope: headlineRef, dependencies: [text, splitType, scrub] });

  return (
    <Tag
      ref={headlineRef}
      className={`text-headline ${className}`}
      style={{
        perspective: '600px',
        // Prevent layout shifts from SplitText
        overflow: 'hidden',
      }}
    >
      {text}
    </Tag>
  );
}
