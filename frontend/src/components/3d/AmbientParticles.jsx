import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * AmbientParticles — low-density particle system with slow molecular drift.
 * Used behind CTA section. Lightweight (30-50 particles max).
 */
export default function AmbientParticles({
  count = 40,
  color = '#ffffff',
  size = 0.03,
  spread = 5,
  speed = 0.2,
}) {
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5;
    }
    return pos;
  }, [count, spread]);

  const velocities = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * speed * 0.01,
      y: (Math.random() - 0.5) * speed * 0.01,
      z: (Math.random() - 0.5) * speed * 0.005,
    }));
  }, [count, speed]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const halfSpread = spread / 2;

    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      // Wrap around edges
      if (Math.abs(pos[i * 3]) > halfSpread) pos[i * 3] *= -0.95;
      if (Math.abs(pos[i * 3 + 1]) > halfSpread) pos[i * 3 + 1] *= -0.95;
      if (Math.abs(pos[i * 3 + 2]) > halfSpread * 0.5) pos[i * 3 + 2] *= -0.95;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
