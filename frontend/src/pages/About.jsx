import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import NumberTicker from '@/components/ui/NumberTicker';

/* ══════════════════════════════════════════
   WebGL SHADER — Stitch About aurora
   Darker variant with different colour mix
   ══════════════════════════════════════════ */
function ShaderCanvas({ className = '' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [skip] = useState(() =>
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    (typeof window !== 'undefined' && window.innerWidth < 768)
  );

  useEffect(() => {
    if (skip) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() { v_texCoord = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;
    const fs = `precision highp float;
uniform float u_time; uniform vec2 u_resolution; varying vec2 v_texCoord;
void main() {
  vec2 uv = v_texCoord; float t = u_time * 0.2;
  vec3 base = vec3(0.02, 0.03, 0.05);
  vec3 accent = vec3(1.0, 0.35, 0.24) * 0.15;
  vec3 mid = vec3(0.08, 0.12, 0.2);
  float n1 = sin(uv.x*3.0+t)*cos(uv.y*2.0-t*0.5);
  float n2 = sin(uv.y*4.0-t*0.8)*cos(uv.x*2.5+t*0.3);
  float mask = smoothstep(-0.8,0.8,n1+n2);
  vec3 c = mix(base,mid,mask);
  float d = distance(uv,vec2(0.5,0.3));
  float glow = smoothstep(1.0,0.0,d);
  c = mix(c,accent,glow*0.2);
  gl_FragColor = vec4(c,1.0);
}`;
    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    const render = (t) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [skip]);

  if (skip) return null;
  return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

/* ── data ── */
const STATS = [
  { value: 30, suffix: '+', label: 'Years Experience' },
  { value: 50, suffix: '+', label: 'Chemical Variants' },
  { value: 5, suffix: '', label: 'States Coverage' },
  { value: 500, suffix: '+', label: 'Active Clients' },
];

const MILESTONES = [
  { year: '1995', title: 'Foundation', desc: 'Established in Bhavnagar, Gujarat, focusing on high-quality GP Thinner distribution.', side: 'left', fill: false },
  { year: '2010', title: 'National Expansion', desc: 'Expanded portfolio to 50+ chemical variants and scaled distribution networks across 5 states.', side: 'right', fill: false },
  { year: '2026', title: 'Digital Transformation', desc: 'Launch of the proprietary ChemiCrown CDMS platform to revolutionize supply chain transparency.', side: 'left', fill: true },
];

/* ── animation ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ═══════════════════════════════════════
   ABOUT — Faithful to Stitch design
   ═══════════════════════════════════════ */
export default function About() {
  return (
    <div className="bg-[#070e1c] text-[#e2e8fc] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Shader */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <ShaderCanvas className="w-full h-full" />
        </div>
        {/* Parallax image */}
        <div className="absolute inset-0 z-10 bg-cover bg-center bg-no-repeat bg-fixed opacity-50 mix-blend-overlay"
          style={{ backgroundImage: "url('/images/about-hero-bg.png')" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#070e1c]/80 via-[#070e1c]/60 to-[#070e1c]" />

        <div className="relative z-30 max-w-7xl mx-auto px-6 text-center mt-16">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}>
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block border border-[#ff8f78]/30 text-[#ff7257] text-sm uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 bg-[#11192a]/30 backdrop-blur-sm"
                style={{ fontFamily: 'Space Grotesk' }}>
                Established 1995
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              About <span className="text-[#ff8f78]">ChemiCrown</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-xl text-[#a4abbe] max-w-3xl mx-auto font-light leading-relaxed"
            >
              Building the foundation of modern manufacturing through reliable, pure, and high-performance chemical solutions since 1995.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STATS BAR — floating glass card ═══════ */}
      <section className="relative z-30 -mt-20 px-6 max-w-7xl mx-auto mb-32">
        <motion.div
          className="rounded-xl p-8 md:p-12 backdrop-blur-[12px] bg-[#161f32]/40 border border-[#6f7587]/20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 md:divide-x divide-[#414858]/30">
            {STATS.map((s, i) => (
              <div key={s.label} className="text-center px-4">
                <div className="text-4xl font-bold text-[#ff8f78] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  <NumberTicker value={s.value} suffix={s.suffix} delay={0.3 + i * 0.1} />
                </div>
                <div className="text-sm text-[#a4abbe] uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ TIMELINE — Vertical center-line zigzag ═══════ */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative">
        <motion.div className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>Our Journey</h2>
          <div className="h-1 w-20 bg-[#ff8f78] mx-auto mt-6 rounded-full" />
        </motion.div>

        <div className="relative">
          {/* Center line (desktop) */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 h-full w-px bg-[#414858]/40" />

          {/* Mobile left line */}
          <div className="md:hidden absolute left-8 top-0 bottom-0 w-px bg-[#414858]/40" />

          <div className="space-y-16 md:space-y-0">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={m.year}
                className={`relative flex flex-col md:flex-row items-center w-full ${i > 0 ? 'md:mt-24' : ''} mb-8 group`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Left content (for left-side cards) */}
                {m.side === 'left' ? (
                  <div className="md:w-1/2 flex justify-start md:justify-end pr-8 w-full text-left md:text-right ml-20 md:ml-0">
                    <div className="backdrop-blur-[12px] bg-[#161f32]/40 border border-[#6f7587]/20 p-8 rounded-xl max-w-md w-full transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="text-2xl font-bold text-[#e2e8fc] mb-3" style={{ fontFamily: 'Space Grotesk' }}>{m.title}</h3>
                      <p className="text-[#a4abbe]">{m.desc}</p>
                    </div>
                  </div>
                ) : (
                  <div className="md:w-1/2 pr-8 hidden md:block" />
                )}

                {/* Year dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    m.fill
                      ? 'bg-[#ff8f78] border-4 border-[#070e1c] shadow-[0_0_20px_rgba(255,143,120,0.5)]'
                      : 'bg-[#11192a] border-2 border-[#ff8f78] shadow-[0_0_15px_rgba(255,143,120,0.3)]'
                  }`}>
                    <span className={`font-bold ${m.fill ? 'text-[#610a00]' : 'text-[#ff8f78]'}`}
                      style={{ fontFamily: 'Space Grotesk' }}>
                      {m.year}
                    </span>
                  </div>
                </div>

                {/* Right content (for right-side cards) */}
                {m.side === 'right' ? (
                  <div className="md:w-1/2 flex justify-start pl-8 w-full ml-20 md:ml-0">
                    <div className="backdrop-blur-[12px] bg-[#161f32]/40 border border-[#6f7587]/20 p-8 rounded-xl max-w-md w-full transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="text-2xl font-bold text-[#e2e8fc] mb-3" style={{ fontFamily: 'Space Grotesk' }}>{m.title}</h3>
                      <p className="text-[#a4abbe]">{m.desc}</p>
                    </div>
                  </div>
                ) : (
                  <div className="md:w-1/2 pl-8 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ MISSION & VISION ═══════ */}
      <section className="py-24 px-6 max-w-7xl mx-auto mb-32">
        <div className="bg-[#0b1323]/50 rounded-3xl border border-[#414858]/10 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Mission */}
            <motion.div
              className="backdrop-blur-[12px] bg-[#161f32]/40 border border-[#6f7587]/20 p-10 rounded-2xl relative overflow-hidden group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#ff8f78]/10 rounded-full blur-[48px] group-hover:bg-[#ff8f78]/20 transition-colors duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#1c263a] rounded-xl flex items-center justify-center mb-8 border border-[#414858]/30">
                  <span className="material-symbols-outlined text-3xl text-[#ff8f78]">my_location</span>
                </div>
                <h3 className="text-3xl font-bold text-[#e2e8fc] mb-4" style={{ fontFamily: 'Space Grotesk' }}>Mission</h3>
                <p className="text-[#a4abbe] text-lg leading-relaxed">
                  To empower industrial growth by delivering uncompromisingly pure chemicals with a commitment to reliability and environmental stewardship.
                </p>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              className="backdrop-blur-[12px] bg-[#161f32]/40 border border-[#6f7587]/20 p-10 rounded-2xl relative overflow-hidden group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-48 h-48 bg-[#729aff]/10 rounded-full blur-[48px] group-hover:bg-[#729aff]/20 transition-colors duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#1c263a] rounded-xl flex items-center justify-center mb-8 border border-[#414858]/30">
                  <span className="material-symbols-outlined text-3xl text-[#729aff]">lightbulb</span>
                </div>
                <h3 className="text-3xl font-bold text-[#e2e8fc] mb-4" style={{ fontFamily: 'Space Grotesk' }}>Vision</h3>
                <p className="text-[#a4abbe] text-lg leading-relaxed">
                  To be the most trusted name in chemical distribution globally, recognized for precision, innovation, and ethical partnership.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
