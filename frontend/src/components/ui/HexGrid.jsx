/* ─────────────────────────────────────────────────
   HEX GRID
   Animated hexagonal honeycomb background pattern.
   Uses SVG pattern + CSS glow animation on scroll.
   ───────────────────────────────────────────────── */
export default function HexGrid({ className = '', opacity = 0.08 }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexPattern" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
            <path
              d="M28 0 L56 16.66 L56 50 L28 66.66 L0 50 L0 16.66 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-[#ff8f78]"
            />
            <path
              d="M28 33.33 L56 50 L56 83.33 L28 100 L0 83.33 L0 50 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-[#729aff]"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexPattern)" />
      </svg>
      {/* Radial fade from center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, #070e1c 80%)',
        }}
      />
    </div>
  );
}
