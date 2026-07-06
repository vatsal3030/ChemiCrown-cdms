import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ChemiCursor — Interactive chemistry Erlenmeyer flask cursor.
 *
 * Micro-interactions:
 *  • Move      → flask tilts with velocity, liquid sloshes
 *  • Hover     → flask tilts ~15°, liquid heats up, bubbles intensify, precision target dot appears
 *  • Click     → liquid droplets splash outward, level drops then refills
 *  • Shake     → agitation: flask grows, wilder waves, intense bubble speed
 *  • Intense   → exothermic overflow: foam erupts, shockwave shock, pops background bubbles, color shift
 *  • Text      → clean orange I-beam cursor
 */
export default function ChemiCursor() {
  const wrapperRef = useRef(null);
  const outerRef = useRef(null);
  const liquidRef = useRef(null);
  const liquidColorRef = useRef(null);

  const [isHover, setIsHover] = useState(false);
  const [isText, setIsText] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // ── Physics refs ──
  const mousePos = useRef({ x: -100, y: -100 });
  const lastMousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const vx = useRef(0);
  const rotate = useRef(0);
  const waveTime = useRef(0);

  // ── Shake detection ──
  const shakeIntensity = useRef(0);        // 0..1+
  const directionHistory = useRef([]);     // {dir: 1|-1, time: ms}
  const lastDir = useRef(0);

  // ── Liquid level ──
  const liquidLevel = useRef(0.58);        // 0..1 (fraction filled)
  const targetLiquidLevel = useRef(0.58);

  // ── Click splash particles ──
  const splashParticles = useRef([]);      // {x,y,vx,vy,life,radius,color,opacity}
  const splashSvgRef = useRef(null);

  // ── Overflow foam particles ──
  const foamParticles = useRef([]);
  const isOverflowing = useRef(false);
  const overflowCooldown = useRef(0);

  // ── Shockwave ring ──
  const shockwaveRef = useRef(null);
  const shockwaveScale = useRef(0);
  const shockwaveOpacity = useRef(0);

  // ── Bubble animation refs ──
  const bubble1Ref = useRef(null);
  const bubble2Ref = useRef(null);
  const bubble3Ref = useRef(null);
  const extraBubblesRef = useRef(null);

  // ── Flask scale ──
  const flaskScale = useRef(1);

  // ── Color interpolation helper ──
  const lerpColor = useCallback((a, b, t) => {
    const ah = parseInt(a.slice(1), 16);
    const bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr},${rg},${rb})`;
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.body.classList.add('custom-cursor-active');

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);
    };

    const handleMouseDown = () => {
      // ── Click: spawn splash droplets + drop liquid level ──
      const numDroplets = 6 + Math.floor(Math.random() * 4);
      const newParticles = [];
      for (let i = 0; i < numDroplets; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 2 + Math.random() * 3.5;
        const colors = ['#ff7257', '#ff8f78', '#729aff', '#ffb347'];
        newParticles.push({
          x: 12, y: 2,                               // flask mouth position
          vx: Math.cos(angle) * speed + vx.current * 0.3,
          vy: Math.sin(angle) * speed - 2.0,
          life: 1,
          radius: 1 + Math.random() * 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
        });
      }
      splashParticles.current = [...splashParticles.current, ...newParticles];

      // Drop liquid level
      targetLiquidLevel.current = Math.max(0.25, liquidLevel.current - 0.18);
      // Refill after delay
      setTimeout(() => { targetLiquidLevel.current = 0.58; }, 600);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // ── Hover detection ──
    const handleMouseOver = (e) => {
      const t = e.target;
      if (!t) return;
      
      // Checking computed style cursor is pointer captures checkboxes, buttons, custom cards, etc.
      const computedCursor = window.getComputedStyle(t).cursor;
      const isClickable = computedCursor === 'pointer' || t.closest('a, button, [role="button"], [onclick], .cursor-pointer, select, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], label');
      const isTextInput = t.closest('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input[type="password"], textarea');
      
      if (isClickable) setIsHover(true);
      if (isTextInput) setIsText(true);
    };
    
    const handleMouseOut = (e) => {
      const t = e.target;
      if (!t) return;
      
      const computedCursor = window.getComputedStyle(t).cursor;
      const isClickable = computedCursor === 'pointer' || t.closest('a, button, [role="button"], [onclick], .cursor-pointer, select, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], label');
      const isTextInput = t.closest('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input[type="password"], textarea');
      
      if (!isClickable) setIsHover(false);
      if (!isTextInput) setIsText(false);
    };
    
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // ═══ 60fps physics/animation tick ═══
    let frameId;
    const tick = () => {
      const targetX = mousePos.current.x;
      const targetY = mousePos.current.y;

      if (isText) {
        // Immediate I-beam tracking
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        }
      } else {
        // ── Snappier physics (lerps faster on hover for high precision) ──
        const lerpFactor = isHover ? 0.85 : 0.32;
        currentPos.current.x += (targetX - currentPos.current.x) * lerpFactor;
        currentPos.current.y += (targetY - currentPos.current.y) * lerpFactor;

        // ── Velocity (clamped to prevent accumulation bug) ──
        const dx = targetX - lastMousePos.current.x;
        lastMousePos.current.x = targetX;
        vx.current = Math.max(-25, Math.min(25, vx.current * 0.82 + dx * 0.18));

        // ── Shake detection ──
        const now = Date.now();
        const currentDir = dx > 1.5 ? 1 : dx < -1.5 ? -1 : 0;
        if (currentDir !== 0 && currentDir !== lastDir.current) {
          directionHistory.current.push({ dir: currentDir, time: now });
          lastDir.current = currentDir;
        }
        // Keep only last 600ms of direction changes
        directionHistory.current = directionHistory.current.filter(d => now - d.time < 600);
        const reversals = directionHistory.current.length;
        const absVx = Math.abs(vx.current);

        // Shake intensity: builds up from direction reversals + velocity
        if (reversals >= 3 && absVx > 5) {
          const gain = reversals >= 6 ? 0.05 : 0.03;
          shakeIntensity.current = Math.min(1.2, shakeIntensity.current + gain);
        }
        // Natural decay
        shakeIntensity.current *= 0.97;
        if (shakeIntensity.current < 0.01) shakeIntensity.current = 0;

        // ── Overflow trigger ──
        if (shakeIntensity.current > 0.85 && overflowCooldown.current <= 0) {
          isOverflowing.current = true;
          overflowCooldown.current = 120; // ~2 seconds at 60fps
          
          // Reset shake intensity immediately so it pops back to normal scale
          shakeIntensity.current = 0;
          
          // Trigger shockwave ring
          shockwaveScale.current = 0.5;
          shockwaveOpacity.current = 0.9;
          
          // Spawn foam particles
          const numFoam = 12 + Math.floor(Math.random() * 6);
          for (let i = 0; i < numFoam; i++) {
            foamParticles.current.push({
              x: 9 + Math.random() * 6,
              y: 2,
              vx: (Math.random() - 0.5) * 4.5,
              vy: -(2.2 + Math.random() * 3.8),
              life: 1,
              radius: 1.2 + Math.random() * 2.2,
              opacity: 0.9,
            });
          }
          
          // Dispatch bubble pop event
          window.dispatchEvent(new CustomEvent('chemicrown-burst', {
            detail: { x: currentPos.current.x, y: currentPos.current.y }
          }));
        }
        
        if (overflowCooldown.current > 0) overflowCooldown.current--;
        if (overflowCooldown.current <= 60) isOverflowing.current = false;

        // Animate shockwave
        if (shockwaveOpacity.current > 0) {
          shockwaveScale.current += 0.12;
          shockwaveOpacity.current -= 0.025;
          if (shockwaveRef.current) {
            shockwaveRef.current.setAttribute('r', String(20 + shockwaveScale.current * 40));
            shockwaveRef.current.setAttribute('opacity', String(Math.max(0, shockwaveOpacity.current)));
          }
        } else if (shockwaveRef.current) {
          shockwaveRef.current.setAttribute('opacity', '0');
        }

        // ── Liquid level interpolation ──
        liquidLevel.current += (targetLiquidLevel.current - liquidLevel.current) * 0.05;

        // ── Rotation (clamped, with hover sway) ──
        const shake = shakeIntensity.current;
        let targetRotate = vx.current * 0.5;
        targetRotate = Math.max(-30, Math.min(30, targetRotate));

        waveTime.current += 0.08;
        if (isHover) {
          targetRotate += Math.sin(waveTime.current * 2.5) * 5 + 12;
        }
        // Add shake vibration
        if (shake > 0.3) {
          targetRotate += Math.sin(waveTime.current * 12) * shake * 8;
        }

        rotate.current += (targetRotate - rotate.current) * 0.12;
        // Hard clamp rotation to prevent structural distortion
        rotate.current = Math.max(-40, Math.min(40, rotate.current));

        // ── Flask scale (grows bigger on shake up to 4x for swelling blast effect) ──
        const targetScale = 1 + Math.min(3, (shakeIntensity.current / 0.85) * 3);
        flaskScale.current += (targetScale - flaskScale.current) * 0.1;

        // ── Apply transforms ──
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-12px, -2px)`;
        }
        if (outerRef.current) {
          outerRef.current.style.transform = `rotate(${rotate.current}deg) scale(${flaskScale.current})`;
        }

        // ── Liquid wave (amplitude driven by shake + velocity) ──
        if (liquidRef.current) {
          const baseAmp = isHover ? 1.6 : 0.8;
          const shakeAmp = shake * 3;
          const wave = Math.sin(waveTime.current) * (baseAmp + shakeAmp) + (vx.current * 0.08);
          // Liquid Y position based on level
          const liqY = 24 - liquidLevel.current * 22; 
          liquidRef.current.setAttribute('d',
            `M -2 ${liqY + wave} Q 12 ${liqY - wave} 26 ${liqY + wave} L 26 26 L -2 26 Z`
          );
        }

        // ── Liquid color: calm → agitated → overflow ──
        if (liquidColorRef.current) {
          let color;
          if (isOverflowing.current) {
            color = lerpColor('#ff5533', '#7eff66', Math.min(1, shake));
          } else if (isHover) {
            color = lerpColor('#ff7257', '#ff5533', Math.min(1, shake * 2));
          } else {
            color = lerpColor('#ff8f78', '#ff5533', Math.min(1, shake * 2));
          }
          liquidColorRef.current.setAttribute('fill', color);
        }

        // ── Bubble intensity (more bubbles on shake/hover) ──
        const bubbleSpeedFactor = 1 + shake * 3;
        if (bubble1Ref.current) {
          bubble1Ref.current.style.animationDuration = `${2.2 / bubbleSpeedFactor}s`;
          bubble1Ref.current.setAttribute('r', String(0.8 + shake * 0.8));
        }
        if (bubble2Ref.current) {
          bubble2Ref.current.style.animationDuration = `${1.6 / bubbleSpeedFactor}s`;
          bubble2Ref.current.setAttribute('r', String(0.6 + shake * 0.6));
        }
        if (bubble3Ref.current) {
          bubble3Ref.current.style.animationDuration = `${2.8 / bubbleSpeedFactor}s`;
          bubble3Ref.current.setAttribute('r', String(0.9 + shake * 0.7));
        }

        // ── Extra agitation bubbles when shaking ──
        if (extraBubblesRef.current) {
          extraBubblesRef.current.style.opacity = shake > 0.2 ? String(Math.min(1, shake * 2)) : '0';
        }

        // ── Splash particle physics ──
        splashParticles.current = splashParticles.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // gravity
          p.life -= 0.03;
          p.opacity = Math.max(0, p.life);
          return p.life > 0;
        });

        // ── Foam particle physics ──
        foamParticles.current = foamParticles.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy -= 0.02; // slight float up
          p.vx *= 0.98;
          p.life -= 0.015;
          p.opacity = Math.max(0, p.life * 0.8);
          p.radius += 0.03; // expand
          return p.life > 0;
        });

        // ── Render particles to SVG ──
        if (splashSvgRef.current) {
          const allParticles = [...splashParticles.current, ...foamParticles.current];
          if (allParticles.length > 0) {
            splashSvgRef.current.innerHTML = allParticles.map(p =>
              `<circle cx="${p.x}" cy="${p.y}" r="${p.radius}" fill="${p.color || '#7eff66'}" opacity="${p.opacity}" />`
            ).join('');
          } else {
            splashSvgRef.current.innerHTML = '';
          }
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(frameId);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isText, isHover, lerpColor]);

  // ── Touch screen fallback ──
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div
      ref={wrapperRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform"
      style={{
        transform: `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`
      }}
    >
      {isText ? (
        /* ── Text I-Beam Cursor ── */
        <div
          className="w-[2px] h-[18px] bg-[#ff8f78] -translate-x-1/2 -translate-y-1/2"
          style={{
            boxShadow: '0 0 8px rgba(255, 143, 120, 0.8)',
            borderRadius: '1px'
          }}
        />
      ) : (
        /* ── Chemistry Flask Cursor ── */
        <div
          ref={outerRef}
          style={{ transformOrigin: '12px 2px' }}
        >
          <svg viewBox="-12 -12 48 54" width="48" height="54" className="overflow-visible drop-shadow-[0_2px_8px_rgba(255,143,120,0.2)]">
            <defs>
              {/* Clip path inside flask geometry */}
              <clipPath id="flask-clip">
                <path d="M10.2 2v7.1L4.75 19.37A2 2 0 0 0 6.5 22h11a2 2 0 0 0 1.75-2.63L13.8 9.1V2z" />
              </clipPath>
              {/* Glow filter for overflow */}
              <filter id="flask-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Shockwave circle for explosions */}
            <circle ref={shockwaveRef} cx="12" cy="2" r="0" fill="none" stroke="#7eff66" strokeWidth="1.5" opacity="0" />

            {/* Clipped liquid inside the flask */}
            <g clipPath="url(#flask-clip)">
              {/* Background liquid tint */}
              <rect x="0" y="0" width="24" height="24" fill="rgba(255, 143, 120, 0.05)" />

              {/* Liquid wave surface — color updated by tick */}
              <path
                ref={(el) => { liquidRef.current = el; liquidColorRef.current = el; }}
                d="M -2 14 Q 12 14 26 14 L 26 26 L -2 26 Z"
                fill="#ff8f78"
              />

              {/* Regular bubbles — speed controlled by tick */}
              <circle ref={bubble1Ref} cx="9" cy="18" r="0.8" fill="#ffffff" opacity="0.6" className="flask-bubble-1" />
              <circle ref={bubble2Ref} cx="15" cy="19" r="0.6" fill="#ffffff" opacity="0.7" className="flask-bubble-2" />
              <circle ref={bubble3Ref} cx="12" cy="16" r="0.9" fill="#ffffff" opacity="0.5" className="flask-bubble-3" />

              {/* Extra agitation bubbles (only visible on shake) */}
              <g ref={extraBubblesRef} style={{ opacity: 0 }}>
                <circle cx="7" cy="20" r="0.5" fill="#ffffff" opacity="0.5" className="flask-bubble-extra-1" />
                <circle cx="17" cy="17" r="0.7" fill="#ffffff" opacity="0.4" className="flask-bubble-extra-2" />
                <circle cx="11" cy="20" r="0.4" fill="#ffffff" opacity="0.6" className="flask-bubble-extra-3" />
                <circle cx="14" cy="18" r="0.55" fill="#ffffff" opacity="0.5" className="flask-bubble-extra-4" />
              </g>
            </g>

            {/* Flask glass outline */}
            <path
              d="M10.2 2v7.1L4.75 19.37A2 2 0 0 0 6.5 22h11a2 2 0 0 0 1.75-2.63L13.8 9.1V2z"
              stroke="#e2e8fc"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="opacity-70 transition-colors duration-300"
            />

            {/* Flask lip */}
            <line
              x1="9" y1="2" x2="15" y2="2"
              stroke="#e2e8fc"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-70 transition-colors duration-300"
            />

            {/* Precision target dot (placed at exact click point: x=12, y=2) */}
            <circle cx="12" cy="2" r="1.8" fill="#ff4d2c" opacity={isHover ? 0.95 : 0} style={{ transition: 'opacity 0.15s ease' }} />
            <circle cx="12" cy="2" r="4" fill="none" stroke="#ff4d2c" strokeWidth="0.8" opacity={isHover ? 0.7 : 0} style={{ transition: 'opacity 0.15s ease' }} />

            {/* Dynamic splash + foam particles (rendered by tick loop) */}
            <g ref={splashSvgRef} filter="url(#flask-glow)" />
          </svg>
        </div>
      )}
    </div>
  );
}
