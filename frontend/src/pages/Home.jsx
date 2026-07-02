import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, ChevronDown,
} from 'lucide-react';
import useSWR from 'swr';
import NumberTicker from '@/components/ui/NumberTicker';

/* ══════════════════════════════════════════
   WebGL SHADER — Stitch aurora background
   Animated navy aurora with subtle warm glow.
   Mouse-interactive. Auto-disabled on
   prefers-reduced-motion or mobile < 768px.
   ══════════════════════════════════════════ */
function ShaderCanvas({ className = '' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [reduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    if (reduced || isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // Sync size
    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    // Shaders
    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    float t = u_time * 0.3;

    vec3 color1 = vec3(0.043, 0.071, 0.125);
    vec3 color2 = vec3(0.06, 0.1, 0.18);
    vec3 accent = vec3(1.0, 0.35, 0.235) * 0.15;

    float n1 = sin(uv.x * 2.0 + t) * cos(uv.y * 3.0 - t * 0.5);
    float n2 = sin(uv.y * 2.5 - t * 0.8) * cos(uv.x * 1.5 + t * 0.2);

    // Mouse interaction
    vec2 m = u_mouse / u_resolution;
    float md = distance(uv, m);
    float mi = smoothstep(0.4, 0.0, md) * 0.15;

    float mask = smoothstep(-1.0, 1.0, n1 + n2);
    vec3 finalColor = mix(color1, color2, mask);

    float glow = distance(uv, vec2(0.5, 0.2)) * 0.5;
    finalColor = mix(finalColor, accent, (1.0 - glow) * 0.1 + mi);

    gl_FragColor = vec4(finalColor, 1.0);
}`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        mouseRef.current.y = (1.0 - (e.clientY - rect.top) / rect.height) * canvas.height;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const render = (t) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
    };
  }, [reduced, isMobile]);

  if (reduced || isMobile) return null;
  return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

/* ── data ── */
const STATS = [
  { value: 30, suffix: '+', label: 'Years Experience', highlight: true },
  { value: 50, suffix: '+', label: 'Chemical Variants' },
  { value: 5, suffix: '', label: 'State Coverage' },
  { value: 500, suffix: '+', label: 'Active Clients' },
];

const SUPPLY_STEPS = [
  { icon: 'precision_manufacturing', label: 'Sourcing', desc: 'Premium raw materials procurement', color: '#ff8f78' },
  { icon: 'science', label: 'Quality Testing', desc: 'Rigorous lab validation', color: '#729aff' },
  { icon: 'warehouse', label: 'Storage', desc: 'Climate-controlled facilities', color: '#cdffe2' },
  { icon: 'local_shipping', label: 'Distribution', desc: 'Optimized logistics routing', color: '#adc2ff' },
  { icon: 'domain_verification', label: 'Delivery', desc: 'On-time site arrival', color: '#ff5c3e' },
];

/* ── animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

/* ── helpers ── */
const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) return [];
  return json.data.filter(p => p.isAvailable !== false).slice(0, 3);
};

/* ═══════════════════════════════════════
   HOME — Faithful to Stitch design
   ═══════════════════════════════════════ */
export default function Home() {
  const [activeStep, setActiveStep] = useState(null);
  const { data: products } = useSWR(
    `${import.meta.env.VITE_API_URL}/api/inventory?limit=3`, fetcher,
    { revalidateOnFocus: false },
  );

  return (
    <div className="bg-[#070e1c] overflow-hidden text-[#e2e8fc]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Shader background */}
        <div className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen">
          <ShaderCanvas className="w-full h-full" />
        </div>

        {/* Ambient glows */}
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#ff8f78]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#729aff]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              {/* Pill badge */}
              <motion.div variants={fadeUp} custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-[#1c263a]/40 border border-[#ff8f78]/30 mb-8"
              >
                <span className="material-symbols-outlined text-[#ff8f78] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-sm font-semibold text-[#ff775d] uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>Enterprise Grade Chemical Solutions</span>
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={fadeUp} custom={1}
                className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight mb-6"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                <span className="text-[#e2e8fc]">Precision Chemicals for</span><br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff8f78] to-[#ff5c3e]">Modern Industry</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p variants={fadeUp} custom={2}
                className="text-lg md:text-xl text-[#a4abbe] leading-relaxed mb-10 max-w-3xl"
              >
                ChemiCrown delivers premium thinners, solvents, and specialized
                industrial chemicals with uncompromising quality and reliable
                distribution networks across India.
              </motion.p>

              {/* Actions */}
              <motion.div variants={fadeUp} custom={3}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <Link
                  to="/catalog"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#ff8f78] text-[#610a00] rounded font-bold text-lg hover:bg-[#ff775d] transition-all shadow-[0_0_20px_rgba(255,143,120,0.4)] hover:shadow-[0_0_30px_rgba(255,143,120,0.6)] group"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Explore Products
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 border border-[#414858] text-[#e2e8fc] rounded font-bold text-lg hover:bg-[#1c263a] transition-colors"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Contact Sales
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-50"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <span className="text-xs uppercase tracking-widest text-[#a4abbe] mb-2" style={{ fontFamily: 'Space Grotesk' }}>Scroll</span>
          <ChevronDown className="w-5 h-5 text-[#a4abbe]" />
        </motion.div>
      </section>

      {/* ═══════ TRUST STATS BAR ═══════ */}
      <section className="py-12 bg-[#0b1323] border-y border-[#414858]/10 relative z-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-[#414858]/20">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center px-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`text-4xl md:text-5xl font-bold mb-2 flex justify-center items-baseline ${s.highlight ? 'text-[#ff8f78]' : 'text-[#e2e8fc]'}`}
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  <NumberTicker value={s.value} delay={0.3} />
                  {s.suffix && <span className="text-2xl ml-1">{s.suffix}</span>}
                </div>
                <div className="text-sm text-[#a4abbe] uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SUPPLY CHAIN PROCESS ═══════ */}
      <section className="py-32 relative bg-[#070e1c] overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-50"
          style={{ backgroundImage: 'radial-gradient(rgba(164,171,190,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-sm text-[#ff8f78] uppercase tracking-widest mb-4 font-bold" style={{ fontFamily: 'Space Grotesk' }}>Supply Chain Excellence</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>From Source to Site</h3>
          </motion.div>

          {/* Interactive Steps container */}
          <div className="relative max-w-5xl mx-auto"   
               onMouseLeave={() => setActiveStep(null)}
          >
            {/* Connecting line with interactive gradient pulse */}
            <div className="absolute top-[40px] left-0 w-full h-[3px] -translate-y-1/2 hidden md:block rounded-full bg-[#11192a] overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#ff8f78] via-[#729aff] to-[#cdffe2]"
                initial={{ left: '-100%' }}
                animate={activeStep !== null ? { left: `${activeStep * 25}%` } : { left: '0%' }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                style={{ width: '100%', position: 'absolute' }}
              />
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              {SUPPLY_STEPS.map((step, i) => {
                const isActive = activeStep === i;
                const isHoveredAny = activeStep !== null;
                return (
                  <motion.div 
                    key={step.label} 
                    variants={fadeUp} 
                    custom={i}
                    onMouseEnter={() => setActiveStep(i)}
                    onClick={() => setActiveStep(i)}
                    className="flex flex-col items-center text-center group cursor-pointer focus:outline-none"
                    role="button"
                    tabIndex={0}
                  >
                    {/* Circle icon container */}
                    <div 
                      className="w-20 h-20 rounded-full backdrop-blur-md border flex items-center justify-center mb-6 relative z-10 transition-all duration-500 bg-[#11192a] shadow-lg"
                      style={{ 
                        borderColor: isActive ? step.color : 'rgba(255, 255, 255, 0.05)',
                        transform: isActive ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                        boxShadow: isActive ? `0 0 25px ${step.color}40` : 'none'
                      }}
                    >
                      <span 
                        className="material-symbols-outlined text-3xl transition-transform duration-500 group-hover:rotate-12" 
                        style={{ 
                          color: step.color, 
                          fontVariationSettings: "'FILL' 1" 
                        }}
                      >
                        {step.icon}
                      </span>
                    </div>

                    {/* Step Name */}
                    <h4 
                      className="text-lg font-bold mb-2 transition-colors duration-300" 
                      style={{ 
                        fontFamily: 'Space Grotesk',
                        color: isActive ? step.color : '#e2e8fc'
                      }}
                    >
                      {step.label}
                    </h4>

                    {/* Description */}
                    <p 
                      className="text-sm transition-all duration-300 max-w-[200px]"
                      style={{ 
                        color: isActive ? '#e2e8fc' : '#a4abbe',
                        opacity: !isHoveredAny || isActive ? 1 : 0.4
                      }}
                    >
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE US — BENTO GRID ═══════ */}
      <section className="py-32 bg-black">
        <div className="container mx-auto px-6 max-w-screen-xl">
          <motion.div className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-sm text-[#ff8f78] uppercase tracking-widest mb-4" style={{ fontFamily: 'Space Grotesk' }}>The ChemiCrown Advantage</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>Built for Industrial Scale</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Bento 1: Purity — col-span-2 */}
            <motion.div
              className="md:col-span-2 rounded-xl p-8 relative overflow-hidden flex flex-col justify-end group backdrop-blur-md bg-[#1c263a]/40 border border-white/5 hover:bg-[#1c263a]/60 hover:border-[#ff775d]/20 hover:-translate-y-0.5 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff8f78]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-[#11192a] rounded-lg inline-flex">
                    <span className="material-symbols-outlined text-[#ff8f78] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  </div>
                  <span className="text-5xl font-black text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>
                    <NumberTicker value={99.9} suffix="%" decimals={1} />
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-[#e2e8fc] mb-2" style={{ fontFamily: 'Space Grotesk' }}>Unmatched Purity</h4>
                <p className="text-[#a4abbe] max-w-md">Our specialized filtration systems guarantee industrial-grade chemical purity, ensuring consistent results in your manufacturing processes.</p>
              </div>
            </motion.div>

            {/* Bento 2: Speed */}
            <motion.div
              className="rounded-xl p-8 relative overflow-hidden flex flex-col justify-between group backdrop-blur-md bg-[#1c263a]/40 border border-white/5 hover:bg-[#1c263a]/60 hover:border-[#ff775d]/20 hover:-translate-y-0.5 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-3 bg-[#11192a] rounded-lg inline-flex w-fit">
                <span className="material-symbols-outlined text-[#729aff] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              </div>
              <div>
                <div className="text-4xl font-black text-[#e2e8fc] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  <NumberTicker value={24} suffix="hr" />
                </div>
                <h4 className="text-xl font-bold text-[#e2e8fc] mb-2" style={{ fontFamily: 'Space Grotesk' }}>Express Delivery</h4>
                <p className="text-sm text-[#a4abbe]">Rapid dispatch across key industrial zones to prevent downtime.</p>
              </div>
            </motion.div>

            {/* Bento 3: ISO — col-span-3 (full width) */}
            <motion.div
              className="md:col-span-3 rounded-xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-[#1c263a] to-[#070e1c] backdrop-blur-md border border-white/5 hover:border-[#ff775d]/20 hover:-translate-y-0.5 transition-all duration-300 group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex-1">
                <div className="p-3 bg-[#11192a] rounded-lg inline-flex mb-6">
                  <span className="material-symbols-outlined text-[#cdffe2] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <h4 className="text-3xl font-bold text-[#e2e8fc] mb-4" style={{ fontFamily: 'Space Grotesk' }}>ISO 9001 Certified</h4>
                <p className="text-[#a4abbe] max-w-2xl text-lg">Internationally recognized quality management systems govern every step of our operation, from raw material procurement to final dispatch.</p>
              </div>
              <div className="w-48 h-48 rounded-full border-4 border-[#414858]/30 flex items-center justify-center relative shrink-0">
                <div className="absolute inset-0 border-4 border-[#ff8f78] border-t-transparent rounded-full" style={{ animation: 'spin 10s linear infinite' }} />
                <span className="text-2xl font-bold text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>ISO Standard</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED PRODUCTS ═══════ */}
      <section className="py-32 bg-[#070e1c]" id="products">
        <div className="container mx-auto px-6 max-w-screen-xl">
          <motion.div
            className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <h2 className="text-sm text-[#ff8f78] uppercase tracking-widest mb-4" style={{ fontFamily: 'Space Grotesk' }}>Catalog</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>Featured Chemicals</h3>
            </div>
            <Link to="/catalog" className="text-[#ff8f78] hover:text-[#ff775d] inline-flex items-center font-bold transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
              View Full Catalog <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {(products && products.length > 0 ? products : []).map((product, i) => {
              const colors = ['#ff5c3e', '#729aff', '#cdffe2'];
              const icons = ['water_drop', 'science', 'sanitizer'];
              const accent = colors[i % 3];
              return (
                <motion.div key={product.id} variants={fadeUp} custom={i}>
                  <Link
                    to={`/catalog/${product.id}`}
                    className="block rounded-xl overflow-hidden flex flex-col backdrop-blur-md bg-[#0b1323] border border-[#414858]/20 group hover:bg-[#1c263a]/60 hover:border-[#ff775d]/20 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Product visual */}
                    <div className="h-64 bg-[#161f32] relative overflow-hidden flex items-center justify-center p-8">
                      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at center, ${accent}, #070e1c, #070e1c)` }} />
                      {product.imageUrls?.length > 0 ? (
                        <img src={product.imageUrls[0]} alt={product.name} loading="lazy" className="relative z-10 max-h-40 object-contain group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="relative z-10 w-32 h-40 border-2 border-[#414858]/50 rounded-lg bg-[#11192a]/50 backdrop-blur flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-xl">
                          <span className="material-symbols-outlined text-4xl text-[#a4abbe] mb-2">{icons[i % 3]}</span>
                          <div className="w-16 h-1 mt-4 rounded" style={{ backgroundColor: `${accent}50` }} />
                        </div>
                      )}
                      {product.category?.name && (
                        <div className="absolute top-4 right-4 bg-[#070e1c]/80 backdrop-blur px-3 py-1 rounded text-xs text-[#e2e8fc] border border-[#414858]/30" style={{ fontFamily: 'Space Grotesk' }}>
                          {product.category.name}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      {product.casNumber && (
                        <div className="text-xs text-[#a4abbe] mb-2" style={{ fontFamily: 'Space Grotesk' }}>CAS: {product.casNumber}</div>
                      )}
                      <h4 className="text-xl font-bold text-[#e2e8fc] mb-2" style={{ fontFamily: 'Space Grotesk' }}>{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-[#a4abbe] mb-6 line-clamp-2">{product.description}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-lg font-bold text-[#ff8f78]" style={{ fontFamily: 'Space Grotesk' }}>
                          ₹{product.price?.toLocaleString('en-IN')}<span className="text-sm text-[#a4abbe] font-normal">/Ltr</span>
                        </div>
                        <span className="p-2 bg-[#11192a] hover:bg-[#ff8f78] hover:text-[#610a00] rounded transition-colors text-[#e2e8fc]">
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* Skeleton loading */}
            {(!products || products.length === 0) && [1,2,3].map(i => (
              <div key={i} className="rounded-xl overflow-hidden bg-[#0b1323] border border-[#414858]/20 animate-pulse">
                <div className="h-64 bg-[#161f32]" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-5 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-6 bg-white/5 rounded w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#ff8f78] to-[#a70138]">
        {/* Texture */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwbDhfOFpNOCAwTDBfOHoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=\")" }}
        />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.h2
            className="text-4xl md:text-6xl font-black text-[#610a00] mb-8 max-w-4xl mx-auto leading-tight"
            style={{ fontFamily: 'Space Grotesk' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Ready to streamline your supply chain?
          </motion.h2>
          <motion.p
            className="text-lg text-[#610a00]/80 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            Join hundreds of enterprise clients who trust ChemiCrown for their critical chemical requirements.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-10 py-5 bg-[#070e1c] text-[#e2e8fc] rounded font-bold text-lg hover:bg-[#212c42] transition-all shadow-xl group"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Create Customer Account
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform text-[#ff8f78]" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
