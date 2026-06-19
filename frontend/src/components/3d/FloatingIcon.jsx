import { useRef } from 'react';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * FloatingIcon — drei Float wrapper around simple 3D icon shapes.
 * Used in "Why Choose ChemiCrown" section.
 */

function DropletShape({ color }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.0}
          transmission={0.3}
          thickness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.22, 0.4, 32]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.8}
          roughness={0.1}
          transmission={0.3}
        />
      </mesh>
    </group>
  );
}

function TruckShape({ color }) {
  return (
    <group>
      {/* Cab */}
      <mesh position={[0.3, 0.1, 0]}>
        <boxGeometry args={[0.4, 0.35, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Trailer */}
      <mesh position={[-0.2, 0.15, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.55]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.25} />
      </mesh>
      {/* Wheels */}
      {[[-0.45, -0.15, 0.28], [-0.45, -0.15, -0.28], [0.3, -0.15, 0.28], [0.3, -0.15, -0.28]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

function ShieldShape({ color }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.quadraticCurveTo(0.5, -0.3, 0.45, 0.15);
  shape.quadraticCurveTo(0.35, 0.45, 0, 0.6);
  shape.quadraticCurveTo(-0.35, 0.45, -0.45, 0.15);
  shape.quadraticCurveTo(-0.5, -0.3, 0, -0.5);

  return (
    <group>
      <mesh>
        <extrudeGeometry
          args={[shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }]}
        />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* Check mark */}
      <mesh position={[0, 0.05, 0.14]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

const ICON_MAP = {
  droplet: DropletShape,
  truck: TruckShape,
  shield: ShieldShape,
};

export default function FloatingIcon({
  icon = 'droplet',
  color = '#2F6FED',
  speed = 2,
  floatIntensity = 1,
  rotationIntensity = 0.5,
  scale = 1,
}) {
  const IconComp = ICON_MAP[icon] || DropletShape;

  return (
    <Float
      speed={speed}
      floatIntensity={floatIntensity}
      rotationIntensity={rotationIntensity}
    >
      <group scale={scale}>
        <IconComp color={color} />
      </group>
    </Float>
  );
}
