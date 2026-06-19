import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * ChemicalBeaker — procedural glass beaker using LatheGeometry.
 * Auto-rotates on idle, with scroll-responsive spin speed.
 */
export default function ChemicalBeaker({ scrollProgress = 0, color = '#88ccff' }) {
  const meshRef = useRef();
  const liquidRef = useRef();

  // Generate beaker profile (lathe cross-section)
  const beakerPoints = [
    new THREE.Vector2(0, -1.8),     // center bottom
    new THREE.Vector2(0.7, -1.8),   // bottom edge
    new THREE.Vector2(0.7, -1.75),  // bottom thickness
    new THREE.Vector2(0.65, -1.75), // inner bottom
    new THREE.Vector2(0.65, 1.2),   // inner wall
    new THREE.Vector2(0.8, 1.5),    // spout flare inner
    new THREE.Vector2(0.85, 1.5),   // spout top
    new THREE.Vector2(0.75, 1.2),   // outer wall top
    new THREE.Vector2(0.75, -1.8),  // outer wall bottom
    new THREE.Vector2(0.7, -1.8),   // close bottom
  ];

  // Liquid fill profile
  const liquidPoints = [
    new THREE.Vector2(0, -1.74),
    new THREE.Vector2(0.63, -1.74),
    new THREE.Vector2(0.63, 0.4),
    new THREE.Vector2(0, 0.4),
  ];

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Base idle rotation + scroll-accelerated spin
    const baseSpeed = 0.15;
    const scrollBoost = scrollProgress * 2.0;
    meshRef.current.rotation.y += delta * (baseSpeed + scrollBoost);

    // Gentle idle bob
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;

    // Liquid subtle wobble
    if (liquidRef.current) {
      liquidRef.current.rotation.y = meshRef.current.rotation.y;
      liquidRef.current.position.y = meshRef.current.position.y;
    }
  });

  return (
    <group>
      {/* Glass beaker */}
      <mesh ref={meshRef}>
        <latheGeometry args={[beakerPoints, 64]} />
        <MeshTransmissionMaterial
          backside
          samples={6}
          resolution={256}
          transmission={0.95}
          roughness={0.05}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.1}
          distortion={0.0}
          distortionScale={0.3}
          temporalDistortion={0.0}
          color="#ffffff"
        />
      </mesh>

      {/* Liquid fill */}
      <mesh ref={liquidRef}>
        <latheGeometry args={[liquidPoints, 64]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.0}
          transmission={0.4}
          thickness={0.5}
        />
      </mesh>

      {/* Rim highlight (emissive ring at top) */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.02, 8, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#aaddff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Measurement lines (simple cylinders) */}
      {[-1.0, -0.2, 0.6].map((y, i) => (
        <mesh key={i} position={[0.66, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.003, 0.003, 0.08, 4]} />
          <meshStandardMaterial color="#ffffff" opacity={0.4} transparent />
        </mesh>
      ))}
    </group>
  );
}
