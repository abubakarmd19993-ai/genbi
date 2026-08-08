import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function AnimatedGenBILogo({
  size = 48,
  showText = false,
  onClick = null,
  className = "",
}) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
    if (onClick) onClick();
  };

  return (
    <motion.div
      className={className}
      onClick={handleClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={clicked ? { scale: 0.92 } : hovered ? { scale: 1.06 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
      }}
    >
      {/* Logo image container */}
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>

        {/* Breathing glow */}
        <motion.div
          animate={{
            boxShadow: hovered
              ? ["0 0 20px rgba(59,130,246,0.8)", "0 0 40px rgba(125,211,252,0.9)", "0 0 20px rgba(59,130,246,0.8)"]
              : ["0 0 10px rgba(59,130,246,0.3)", "0 0 20px rgba(59,130,246,0.5)", "0 0 10px rgba(59,130,246,0.3)"],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: -3, borderRadius: "50%",
            background: "transparent",
          }}
        />

        {/* Rotating energy ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", inset: -4, borderRadius: "50%",
            background: `conic-gradient(from 0deg, #3B82F6, #7DD3FC, transparent, #3B82F6)`,
            opacity: hovered ? 0.9 : 0.4,
            transition: "opacity 0.3s",
          }}
        />

        {/* Inner ring mask */}
        <div style={{
          position: "absolute", inset: -2, borderRadius: "50%",
          background: "#0B1120",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
        }} />

        {/* Floating animation */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "relative", width: size, height: size }}
        >
          {/* Logo image */}
          <img
            src="/genbi-logo.jpg"
            alt="GenBI"
            style={{
              width: size, height: size,
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              position: "relative", zIndex: 1,
              filter: hovered
                ? "brightness(1.2) drop-shadow(0 0 8px rgba(59,130,246,0.8))"
                : "brightness(1) drop-shadow(0 0 4px rgba(59,130,246,0.4))",
              transition: "filter 0.3s ease",
            }}
          />

          {/* Metallic shine sweep on hover */}
          {hovered && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "200%", opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                pointerEvents: "none", zIndex: 2,
              }}
            />
          )}
        </motion.div>

        {/* Ripple effect */}
        {ripples.map(r => (
          <motion.div
            key={r.id}
            style={{
              position: "absolute", left: r.x, top: r.y,
              width: 8, height: 8, borderRadius: "50%",
              background: "rgba(125,211,252,0.6)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none", zIndex: 10,
            }}
            animate={{ scale: [0, 4], opacity: [0.6, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

        {/* Orbiting particles */}
        {[0, 120, 240].map((deg, i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", inset: 0,
              transformOrigin: "center",
              rotate: deg,
            }}
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              style={{
                position: "absolute",
                width: Math.max(4, size * 0.08),
                height: Math.max(4, size * 0.08),
                borderRadius: "50%",
                background: "#7DD3FC",
                boxShadow: "0 0 6px #7DD3FC",
                top: -Math.max(4, size * 0.08) / 2,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Optional text */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p style={{
            margin: 0, fontWeight: 800, fontSize: Math.max(12, size * 0.3),
            background: "linear-gradient(135deg, #FFFFFF 0%, #60A5FA 60%, #7DD3FC 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", letterSpacing: "-0.02em",
          }}>
            GenBI AI
          </p>
          <p style={{
            margin: 0, fontSize: Math.max(8, size * 0.16),
            color: "#374151", letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            AI Business Intelligence
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Page Load Intro Animation ─────────────────────────────
export function GenBIIntro({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(135deg, #020617 0%, #0B1120 50%, #111827 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Analytics bars */}
      <div style={{ display: "flex", alignItems: "end", gap: 4, marginBottom: 32, height: 40 }}>
        {[60, 85, 45, 95, 70, 80, 55].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: h * 0.4 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
            style={{
              width: 6, borderRadius: 3,
              background: `linear-gradient(to top, #3B82F6, #7DD3FC)`,
              boxShadow: "0 0 8px rgba(59,130,246,0.5)",
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <AnimatedGenBILogo size={120} />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{ textAlign: "center", marginTop: 24 }}
      >
        <p style={{
          fontSize: 28, fontWeight: 800, margin: "0 0 6px 0",
          background: "linear-gradient(135deg, #FFFFFF, #60A5FA, #7DD3FC)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          GenBI AI
        </p>
        <p style={{ color: "#4B5563", fontSize: 13, margin: 0, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          AI Powered · Data Driven · Business Intelligence
        </p>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ marginTop: 40, width: 200 }}
      >
        <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
            style={{ height: "100%", background: "linear-gradient(90deg, #3B82F6, #7DD3FC)", borderRadius: 1 }}
            onAnimationComplete={onComplete}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}