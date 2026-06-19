import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec2 uResolution;

  varying vec2 vUv;

  // Simplex-like noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.3;

    // Layered noise for liquid turbulence
    float turbulence = uProgress * 0.5 + 0.3;
    float n1 = snoise(vec3(uv * 3.0, time)) * turbulence;
    float n2 = snoise(vec3(uv * 6.0, time * 1.3)) * turbulence * 0.5;
    float n3 = snoise(vec3(uv * 12.0, time * 1.7)) * turbulence * 0.25;
    float noise = n1 + n2 + n3;

    // Bubble-like spots
    float bubbles = smoothstep(0.55, 0.6, snoise(vec3(uv * 8.0, time * 0.8)));
    bubbles += smoothstep(0.6, 0.65, snoise(vec3(uv * 15.0 + 3.0, time * 1.2))) * 0.5;

    // Color mixing
    vec3 baseColor = mix(uColor1, uColor2, uv.y + noise * 0.3);

    // Add refraction-like caustics
    float caustics = snoise(vec3(uv * 10.0 + noise, time * 0.5));
    caustics = pow(max(caustics, 0.0), 3.0) * 0.4;

    vec3 finalColor = baseColor + caustics + bubbles * 0.15;

    // Vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.4);
    vignette = smoothstep(0.0, 0.7, vignette);

    // Liquid fill level — rises with progress
    float fillLevel = mix(0.3, 0.85, uProgress);
    float fillMask = smoothstep(fillLevel - 0.05, fillLevel + 0.05, uv.y);
    float surfaceHighlight = smoothstep(fillLevel - 0.02, fillLevel, uv.y)
                           * smoothstep(fillLevel + 0.02, fillLevel, uv.y) * 2.0;

    finalColor += surfaceHighlight * vec3(0.3);
    float alpha = mix(0.9, 0.3, fillMask) * vignette;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * LiquidShader — full-screen chemical liquid simulation.
 * GLSL fragment shader with bubbles, refraction noise, and scroll-driven turbulence.
 * 
 * @param {'amber'|'cobalt'} theme - Color theme
 * @param {number} scrollProgress - 0-1 scroll progress
 */
export default function LiquidShader({ theme = 'amber', scrollProgress = 0 }) {
  const meshRef = useRef();
  const { viewport } = useThree();

  const colors = useMemo(() => {
    if (theme === 'cobalt') {
      return {
        color1: new THREE.Color('#1a3a6e'),
        color2: new THREE.Color('#2F6FED'),
      };
    }
    return {
      color1: new THREE.Color('#8a5a1a'),
      color2: new THREE.Color('#E8A33D'),
    };
  }, [theme]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor1: { value: colors.color1 },
    uColor2: { value: colors.color2 },
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
  }), [colors, viewport]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    meshRef.current.material.uniforms.uProgress.value = scrollProgress;
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
