import { useEffect, useRef, useState } from 'react';

export default function ChemiCursor() {
  const wrapperRef = useRef(null);
  const outerRef = useRef(null);
  const liquidRef = useRef(null);

  const [isHover, setIsHover] = useState(false);
  const [isText, setIsText] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Position and velocity references
  const mousePos = useRef({ x: -100, y: -100 });
  const lastMousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  
  const vx = useRef(0);
  const rotate = useRef(0);
  const waveTime = useRef(0);

  useEffect(() => {
    // Disable custom cursor if OS-level prefers-reduced-motion is active
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Hide default system cursor
    document.body.classList.add('custom-cursor-active');

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);
    };

    const handleMouseDown = () => {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 450); // reset splash state
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Dynamic hover elements detection
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      
      const isClickable = target.closest('a, button, [role="button"], [onclick], .cursor-pointer, select, input[type="submit"], input[type="button"], label');
      const isTextInput = target.closest('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input[type="password"], textarea');
      
      if (isClickable) setIsHover(true);
      if (isTextInput) setIsText(true);
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (!target) return;
      
      const isClickable = target.closest('a, button, [role="button"], [onclick], .cursor-pointer, select, input[type="submit"], input[type="button"], label');
      const isTextInput = target.closest('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input[type="password"], textarea');
      
      if (isClickable) setIsHover(false);
      if (isTextInput) setIsText(false);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // 60fps physics/animation ticker
    let frameId;
    const tick = () => {
      const targetX = mousePos.current.x;
      const targetY = mousePos.current.y;

      // Handle text-mode vs flask-mode layout transformations
      if (isText) {
        // Immediate precise tracking for text I-beam
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        }
      } else {
        // Smooth physics-based tracking lag
        currentPos.current.x += (targetX - currentPos.current.x) * 0.15;
        currentPos.current.y += (targetY - currentPos.current.y) * 0.15;

        // Velocity computation for tilt/sloshing
        const dx = targetX - lastMousePos.current.x;
        lastMousePos.current.x = targetX;
        vx.current = vx.current * 0.85 + dx * 0.15;

        // Swing and rotation dynamics
        let targetRotate = vx.current * 0.65;
        targetRotate = Math.max(-35, Math.min(35, targetRotate)); // limit tilt angle

        waveTime.current += 0.08;
        if (isHover) {
          // Hover swinging animation over interactive spots
          targetRotate += Math.sin(waveTime.current * 2.5) * 5 + 10;
        }

        rotate.current += (targetRotate - rotate.current) * 0.12;

        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-12px, -2px)`;
        }

        if (outerRef.current) {
          outerRef.current.style.transform = `rotate(${rotate.current}deg)`;
        }

        // Direct DOM update for liquid path to bypass React state cycles
        if (liquidRef.current) {
          const waveAmp = isHover ? 1.6 : 0.8;
          const wave = Math.sin(waveTime.current) * waveAmp + (vx.current * 0.1);
          liquidRef.current.setAttribute('d', `M -2 ${14 + wave} Q 12 ${14 - wave} 26 ${14 + wave} L 26 24 L -2 24 Z`);
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
  }, [isText, isHover]);

  // Touch screen fallback detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
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
        /* Text I-Beam Cursor Mode */
        <div 
          className="w-[2px] h-[18px] bg-[#ff8f78] -translate-x-1/2 -translate-y-1/2"
          style={{ 
            boxShadow: '0 0 8px rgba(255, 143, 120, 0.8)',
            borderRadius: '1px' 
          }}
        />
      ) : (
        /* Chemistry Conical Flask Mode */
        <div 
          ref={outerRef} 
          style={{ transformOrigin: '12px 2px' }}
          className="transition-all duration-300"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" className="drop-shadow-[0_2px_6px_rgba(255,143,120,0.15)]">
            <defs>
              {/* Clip path inside flask geometry to keep liquid contained */}
              <clipPath id="flask-clip">
                <path d="M10.2 2v7.1L4.75 19.37A2 2 0 0 0 6.5 22h11a2 2 0 0 0 1.75-2.63L13.8 9.1V2z" />
              </clipPath>
            </defs>

            {/* Clipped liquid inside the flask */}
            <g clipPath="url(#flask-clip)">
              {/* Back background liquid shadow */}
              <rect x="0" y="0" width="24" height="24" fill="rgba(255, 143, 120, 0.05)" />
              {/* Liquid wave */}
              <path
                ref={liquidRef}
                d="M -2 14 Q 12 14 26 14 L 26 24 L -2 24 Z"
                fill={isHover ? '#ff7257' : '#ff8f78'}
                className="transition-colors duration-300"
              />
              
              {/* Mini chemical bubbles rising inside the liquid */}
              <circle cx="9" cy="18" r="0.8" fill="#ffffff" opacity="0.6" className="flask-bubble-1" />
              <circle cx="15" cy="19" r="0.6" fill="#ffffff" opacity="0.7" className="flask-bubble-2" />
              <circle cx="12" cy="16" r="0.9" fill="#ffffff" opacity="0.5" className="flask-bubble-3" />
            </g>

            {/* Outer Glass flask container outline */}
            <path 
              d="M10.2 2v7.1L4.75 19.37A2 2 0 0 0 6.5 22h11a2 2 0 0 0 1.75-2.63L13.8 9.1V2z" 
              stroke={isHover ? '#ff7257' : '#e2e8fc'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
              className="opacity-70 transition-colors duration-300" 
            />
            {/* Lip of the flask opening */}
            <line 
              x1="9" 
              y1="2" 
              x2="15" 
              y2="2" 
              stroke={isHover ? '#ff7257' : '#e2e8fc'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              className="opacity-70 transition-colors duration-300"
            />

            {/* Click Splash Droplet particles */}
            {isClicked && (
              <g>
                <circle cx="12" cy="2" r="1.2" fill="#ff7257" className="flask-splash-1" />
                <circle cx="12" cy="2" r="1" fill="#729aff" className="flask-splash-2" />
                <circle cx="12" cy="2" r="0.9" fill="#ff7257" className="flask-splash-3" />
                <circle cx="12" cy="2" r="1.1" fill="#729aff" className="flask-splash-4" />
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
