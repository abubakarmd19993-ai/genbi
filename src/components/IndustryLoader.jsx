import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRY_THEMES = {
  retail: {
    icon: "🛒", label: "Retail Intelligence",
    color: "#bc8cff", glow: "rgba(188,140,255,0.3)",
    bg: "linear-gradient(135deg, #0d0520 0%, #1a0535 50%, #0a0118 100%)",
    particles: ["🛍️", "📦", "💳", "🏪", "🏷️", "🎁", "💰", "📊"],
    phrases: [
      "Tracking customer purchases...",
      "Finding best-selling products...",
      "Forecasting inventory levels...",
      "Analyzing customer behavior...",
      "Computing sales trends...",
      "Generating retail recommendations...",
    ],
    accent: "#bc8cff",
  },
  finance: {
    icon: "🏦", label: "Financial Intelligence",
    color: "#3B82F6", glow: "rgba(59,130,246,0.3)",
    bg: "linear-gradient(135deg, #020617 0%, #0B1120 50%, #0a0f1e 100%)",
    particles: ["💵", "📈", "🏦", "💳", "📊", "💎", "⚡", "🔐"],
    phrases: [
      "Analyzing financial transactions...",
      "Detecting anomalies in data...",
      "Forecasting revenue trends...",
      "Calculating financial risk...",
      "Evaluating portfolio performance...",
      "Generating banking insights...",
    ],
    accent: "#3B82F6",
  },
  healthcare: {
    icon: "🏥", label: "Healthcare Intelligence",
    color: "#22c55e", glow: "rgba(34,197,94,0.3)",
    bg: "linear-gradient(135deg, #021207 0%, #031a0a 50%, #010e05 100%)",
    particles: ["💊", "🩺", "❤️", "🧬", "🩻", "🔬", "💉", "🫀"],
    phrases: [
      "Analyzing patient admissions...",
      "Evaluating treatment outcomes...",
      "Predicting resource utilization...",
      "Detecting operational bottlenecks...",
      "Computing health trends...",
      "Generating healthcare insights...",
    ],
    accent: "#22c55e",
  },
  hr: {
    icon: "👥", label: "HR Intelligence",
    color: "#bc8cff", glow: "rgba(188,140,255,0.3)",
    bg: "linear-gradient(135deg, #0d0520 0%, #150830 50%, #0a0118 100%)",
    particles: ["👔", "📋", "🎯", "🏆", "💼", "📝", "🤝", "⭐"],
    phrases: [
      "Analyzing workforce data...",
      "Computing attrition risk...",
      "Evaluating performance metrics...",
      "Checking salary equity...",
      "Identifying retention gaps...",
      "Generating HR insights...",
    ],
    accent: "#bc8cff",
  },
  marketing: {
    icon: "📱", label: "Marketing Intelligence",
    color: "#ffa657", glow: "rgba(255,166,87,0.3)",
    bg: "linear-gradient(135deg, #120800 0%, #1a0e00 50%, #0d0500 100%)",
    particles: ["📣", "🎯", "📊", "💡", "🚀", "📱", "🎨", "✨"],
    phrases: [
      "Analyzing campaign performance...",
      "Computing ROI metrics...",
      "Evaluating channel efficiency...",
      "Checking conversion rates...",
      "Calculating customer CAC...",
      "Generating marketing insights...",
    ],
    accent: "#ffa657",
  },
  manufacturing: {
    icon: "🏭", label: "Manufacturing Intelligence",
    color: "#ff7b72", glow: "rgba(255,123,114,0.3)",
    bg: "linear-gradient(135deg, #120200 0%, #1a0500 50%, #0d0100 100%)",
    particles: ["⚙️", "🔧", "🏗️", "📐", "🔩", "⚡", "🔨", "🛠️"],
    phrases: [
      "Analyzing production efficiency...",
      "Evaluating machine performance...",
      "Predicting maintenance needs...",
      "Computing defect rates...",
      "Optimizing manufacturing flow...",
      "Generating factory insights...",
    ],
    accent: "#ff7b72",
  },
  ecommerce: {
    icon: "🛍️", label: "E-Commerce Intelligence",
    color: "#79c0ff", glow: "rgba(121,192,255,0.3)",
    bg: "linear-gradient(135deg, #020b12 0%, #051520 50%, #020b12 100%)",
    particles: ["📦", "🚚", "⭐", "💳", "🏪", "🔖", "📲", "🎁"],
    phrases: [
      "Analyzing order patterns...",
      "Computing return rates...",
      "Evaluating seller metrics...",
      "Checking fulfillment speed...",
      "Calculating customer LTV...",
      "Generating ecommerce insights...",
    ],
    accent: "#79c0ff",
  },
  hotel: {
    icon: "🏨", label: "Hospitality Intelligence",
    color: "#fbbf24", glow: "rgba(251,191,36,0.3)",
    bg: "linear-gradient(135deg, #120a00 0%, #1a1000 50%, #0d0800 100%)",
    particles: ["🏨", "🛏️", "🗝️", "🧳", "📅", "⭐", "🍽️", "🌟"],
    phrases: [
      "Checking occupancy trends...",
      "Analyzing guest satisfaction...",
      "Evaluating seasonal bookings...",
      "Forecasting room demand...",
      "Optimizing pricing strategy...",
      "Generating hospitality insights...",
    ],
    accent: "#fbbf24",
  },
  aviation: {
    icon: "✈️", label: "Aviation Intelligence",
    color: "#7DD3FC", glow: "rgba(125,211,252,0.3)",
    bg: "linear-gradient(135deg, #020b18 0%, #051525 50%, #020b18 100%)",
    particles: ["✈️", "🛫", "🛬", "🌍", "📡", "🗺️", "⛅", "🔭"],
    phrases: [
      "Analyzing passenger flow...",
      "Forecasting flight demand...",
      "Evaluating delay patterns...",
      "Optimizing scheduling...",
      "Computing route efficiency...",
      "Generating aviation insights...",
    ],
    accent: "#7DD3FC",
  },
  logistics: {
    icon: "🚚", label: "Logistics Intelligence",
    color: "#fbbf24", glow: "rgba(251,191,36,0.3)",
    bg: "linear-gradient(135deg, #0a0800 0%, #121000 50%, #0a0800 100%)",
    particles: ["🚚", "📦", "🏭", "🗺️", "⚡", "🔄", "📡", "🚛"],
    phrases: [
      "Optimizing delivery routes...",
      "Forecasting shipment volume...",
      "Tracking logistics efficiency...",
      "Analyzing warehouse operations...",
      "Computing fleet performance...",
      "Generating logistics insights...",
    ],
    accent: "#fbbf24",
  },
  realestate: {
    icon: "🏠", label: "Real Estate Intelligence",
    color: "#a78bfa", glow: "rgba(167,139,250,0.3)",
    bg: "linear-gradient(135deg, #0a0215 0%, #130520 50%, #0a0215 100%)",
    particles: ["🏠", "🏢", "📍", "💰", "📊", "🔑", "🏗️", "🌆"],
    phrases: [
      "Analyzing property trends...",
      "Forecasting market prices...",
      "Evaluating investment potential...",
      "Computing location scores...",
      "Checking market demand...",
      "Generating property insights...",
    ],
    accent: "#a78bfa",
  },
  education: {
    icon: "🎓", label: "Education Intelligence",
    color: "#34d399", glow: "rgba(52,211,153,0.3)",
    bg: "linear-gradient(135deg, #011208 0%, #021a0c 50%, #011208 100%)",
    particles: ["📚", "🎓", "✏️", "📝", "💡", "🔬", "🏫", "⭐"],
    phrases: [
      "Analyzing student performance...",
      "Evaluating attendance patterns...",
      "Forecasting learning outcomes...",
      "Computing engagement scores...",
      "Identifying at-risk students...",
      "Generating education insights...",
    ],
    accent: "#34d399",
  },
  general: {
    icon: "🔮", label: "Business Intelligence",
    color: "#3B82F6", glow: "rgba(59,130,246,0.3)",
    bg: "linear-gradient(135deg, #020617 0%, #0B1120 50%, #111827 100%)",
    particles: ["📊", "💡", "🎯", "📈", "🔍", "⚡", "🧠", "✨"],
    phrases: [
      "Analyzing business data...",
      "Computing key metrics...",
      "Identifying patterns...",
      "Evaluating performance...",
      "Generating AI insights...",
      "Preparing your analysis...",
    ],
    accent: "#3B82F6",
  },
};

// ── Particle Canvas ───────────────────────────────────────
function ParticleCanvas({ color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    let animId;

    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(p.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x; const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${color}${Math.floor(0.08 * (1 - dist / 80) * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [color]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ── Floating Icons ────────────────────────────────────────
function FloatingIcons({ particles, color }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((icon, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: `${10 + (i * 11) % 80}%`,
            top: `${5 + (i * 17) % 80}%`,
            fontSize: 20,
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
          animate={{
            y: [0, -15, 0],
            x: [0, Math.sin(i) * 8, 0],
            opacity: [0.2, 0.6, 0.2],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        >
          {icon}
        </motion.div>
      ))}
    </div>
  );
}

// ── Wave Bars ─────────────────────────────────────────────
function WaveBars({ color }) {
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 3, height: 32, justifyContent: "center" }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            width: 3, borderRadius: 3, minHeight: 3,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
          }}
          animate={{ height: [3, Math.random() * 28 + 4, 3] }}
          transition={{
            duration: 0.5 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.06,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Skeleton Lines ────────────────────────────────────────
function SkeletonLines({ color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {[85, 70, 90, 60].map((w, i) => (
        <div key={i} style={{
          height: 8, borderRadius: 4, overflow: "hidden",
          background: "rgba(255,255,255,0.05)",
          width: `${w}%`,
        }}>
          <motion.div
            style={{
              height: "100%", borderRadius: 4,
              background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main IndustryLoader ───────────────────────────────────
export default function IndustryLoader({ industry = "general" }) {
  const theme = INDUSTRY_THEMES[industry] || INDUSTRY_THEMES.general;
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex(i => (i + 1) % theme.phrases.length);
    }, 2000);
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);
    return () => { clearInterval(phraseTimer); clearInterval(dotTimer); };
  }, [theme.phrases.length]);

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", margin: "12px 0" }}>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "relative", borderRadius: 20,
          padding: "20px", width: "100%", maxWidth: 420,
          overflow: "hidden",
          background: theme.bg,
          border: `1px solid ${theme.accent}30`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${theme.accent}10`,
        }}
      >
        {/* Particle canvas */}
        <ParticleCanvas color={theme.accent} />

        {/* Floating icons */}
        <FloatingIcons particles={theme.particles} color={theme.accent} />

        {/* Animated border glow */}
        <motion.div
          style={{
            position: "absolute", inset: 0, borderRadius: 20,
            background: `conic-gradient(from 0deg, ${theme.accent}40, transparent, ${theme.accent}40)`,
            padding: 1,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {/* Spinning orb */}
            <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", inset: -2, borderRadius: "50%",
                  background: `conic-gradient(from 0deg, ${theme.accent}, transparent, ${theme.accent})`,
                }}
              />
              <div style={{
                position: "absolute", inset: 1, borderRadius: "50%",
                background: "#0B1120",
              }} />
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    `0 0 15px ${theme.glow}`,
                    `0 0 30px ${theme.glow}`,
                    `0 0 15px ${theme.glow}`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: "absolute", inset: 4, borderRadius: "50%",
                  background: `radial-gradient(circle, ${theme.accent}30, #0B1120)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, zIndex: 1,
                }}
              >
                {theme.icon}
              </motion.div>
              {/* Ripples */}
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: -i * 8 - 4,
                    borderRadius: "50%",
                    border: `1px solid ${theme.accent}`,
                  }}
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{
                    duration: 2, repeat: Infinity,
                    delay: i * 0.6, ease: "easeOut",
                  }}
                />
              ))}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                color: "#FFFFFF", fontWeight: 700, fontSize: 14,
                margin: "0 0 2px 0",
              }}>
                {theme.label}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, boxShadow: `0 0 6px ${theme.accent}`, flexShrink: 0 }}
                />
                <span style={{ color: theme.accent, fontSize: 11, fontWeight: 600 }}>
                  AI Analyzing
                </span>
              </div>
            </div>
          </div>

          {/* Animated phrase */}
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              style={{
                color: "#9CA3AF", fontSize: 13, margin: "0 0 14px 0",
                fontStyle: "italic",
              }}
            >
              {theme.phrases[phraseIndex]}<span style={{ color: theme.accent }}>{dots}</span>
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div style={{
            width: "100%", height: 3, borderRadius: 3,
            background: "rgba(255,255,255,0.05)",
            overflow: "hidden", marginBottom: 14,
          }}>
            <motion.div
              style={{
                height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg, ${theme.accent}88, ${theme.accent})`,
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Wave */}
          <div style={{ marginBottom: 14 }}>
            <WaveBars color={theme.accent} />
          </div>

          {/* Skeleton */}
          <SkeletonLines color={theme.accent} />
        </div>
      </motion.div>
    </div>
  );
}