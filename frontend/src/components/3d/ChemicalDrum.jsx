import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * ChemicalDrum — procedural metal drum (industrial barrel).
 * Used in supply-chain and featured-product scenes.
 */
export default function ChemicalDrum({
  color = '#4a5568',
  labelColor = '#E8A33D',
  label = '',
  position = [0, 0, 0],
  scale = 1,
  rotate = true,
}) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current || !rotate) return;
    groupRef.current.rotation.y += delta * 0.3;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main barrel body */}
      <mesh>
        <cylinderGeometry args={[0.6, 0.6, 1.6, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Top lid */}
      <mesh position={[0, 0.81, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.04, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Bottom lid */}
      <mesh position={[0, -0.81, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.04, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Barrel ribs (rings) */}
      {[-0.6, -0.2, 0.2, 0.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.61, 0.015, 8, 32]} />
          <meshStandardMaterial
            color="#718096"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
      ))}

      {/* Label band */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.615, 0.615, 0.4, 32]} />
        <meshStandardMaterial
          color={labelColor}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Top cap detail (fill port) */}
      <mesh position={[0.2, 0.85, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial
          color="#a0aec0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
