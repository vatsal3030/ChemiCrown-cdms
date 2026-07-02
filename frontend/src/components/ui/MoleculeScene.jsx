import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Float, MeshTransmissionMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────
   ATOM — Glowing sphere with emissive material
   ───────────────────────────────────────────────── */
function Atom({ position, radius = 0.18, color = '#ff8f78', emissiveIntensity = 0.8 }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.scale.lerp(
        new THREE.Vector3(hovered ? 1.3 : 1, hovered ? 1.3 : 1, hovered ? 1.3 : 1),
        delta * 6
      );
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.2}
        metalness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────
   BOND — Cylinder connecting two atoms
   ───────────────────────────────────────────────── */
function Bond({ start, end, color = '#414858' }) {
  const ref = useRef();

  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(e, s);
    const len = dir.length();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return { position: [mid.x, mid.y, mid.z], rotation: [euler.x, euler.y, euler.z], length: len };
  }, [start, end]);

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.03, 0.03, length, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────
   MOLECULE — Ball-and-stick molecular structure
   A simple benzene-inspired ring with side chains
   ───────────────────────────────────────────────── */
function Molecule({ mouse }) {
  const groupRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });

  // Benzene-like hexagonal ring + side chains
  const atoms = useMemo(() => [
    // Hexagonal ring (slightly 3D)
    { pos: [0, 1.2, 0], color: '#ff8f78', r: 0.2 },
    { pos: [1.04, 0.6, 0.15], color: '#729aff', r: 0.16 },
    { pos: [1.04, -0.6, -0.15], color: '#ff8f78', r: 0.2 },
    { pos: [0, -1.2, 0], color: '#cdffe2', r: 0.18 },
    { pos: [-1.04, -0.6, 0.15], color: '#729aff', r: 0.16 },
    { pos: [-1.04, 0.6, -0.15], color: '#ff8f78', r: 0.2 },
    // Side chain atoms
    { pos: [0, 2.2, 0.3], color: '#ff5c3e', r: 0.14 },
    { pos: [2.0, 1.0, -0.2], color: '#adc2ff', r: 0.12 },
    { pos: [0, -2.2, -0.3], color: '#ff5c3e', r: 0.14 },
    { pos: [-2.0, -1.0, 0.2], color: '#cdffe2', r: 0.12 },
  ], []);

  const bonds = useMemo(() => [
    // Ring bonds
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    // Side chains
    [0, 6], [1, 7], [3, 8], [4, 9],
  ], []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Mouse parallax (subtle tilt toward cursor)
    targetRotation.current.x = (mouse.y - 0.5) * 0.4;
    targetRotation.current.y = (mouse.x - 0.5) * 0.6;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotation.current.x,
      delta * 2
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation.current.y + performance.now() * 0.0001,
      delta * 2
    );

    // Gentle floating motion
    groupRef.current.position.y = Math.sin(performance.now() * 0.0005) * 0.15;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef} scale={1.2}>
        {atoms.map((a, i) => (
          <Atom key={`atom-${i}`} position={a.pos} radius={a.r} color={a.color} />
        ))}
        {bonds.map(([s, e], i) => (
          <Bond key={`bond-${i}`} start={atoms[s].pos} end={atoms[e].pos} />
        ))}
      </group>
    </Float>
  );
}

/* ─────────────────────────────────────────────────
   SCENE — Internal Three.js scene with lighting
   ───────────────────────────────────────────────── */
function Scene({ mouse }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ff8f78" />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color="#729aff" />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />

      <Molecule mouse={mouse} />

      <Sparkles
        count={80}
        scale={8}
        size={1.5}
        speed={0.3}
        opacity={0.4}
        color="#ff8f78"
      />
      <Sparkles
        count={40}
        scale={6}
        size={1}
        speed={0.2}
        opacity={0.3}
        color="#729aff"
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          intensity={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/* ─────────────────────────────────────────────────
   MOLECULE SCENE — Public component
   Auto-disabled on mobile / reduced-motion
   ───────────────────────────────────────────────── */
export default function MoleculeScene({ className = '', opacity = 0.7 }) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // Disable on mobile or reduced motion
    const isMobile = window.innerWidth < 768;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isMobile && !prefersReduced) {
      setCanRender(true);
    }

    const onMove = (e) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  if (!canRender) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ opacity }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene mouse={mouse} />
      </Canvas>
    </div>
  );
}
