import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';

/**
 * SceneCanvas — lazy-mounting R3F Canvas wrapper.
 * Only mounts the Canvas when scrolled near viewport (IntersectionObserver).
 * Caps DPR, uses demand frameloop, and provides sensible default lighting.
 */
export default function SceneCanvas({
  children,
  className = '',
  style = {},
  camera,
  rootMargin = '200px',
  fallback = null,
  ...canvasProps
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, prefersReducedMotion]);

  // Under reduced motion, show the fallback or nothing
  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={className} style={style}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={style}>
      {isVisible && (
        <Suspense
          fallback={
            <div className="w-full h-full bg-gradient-to-b from-ink/50 to-ink-2/50" />
          }
        >
          <Canvas
            dpr={[1, 1.5]}
            camera={camera || { position: [0, 0, 5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            {...canvasProps}
          >
            {/* Default cinematic lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4488ff" />
            {children}
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
