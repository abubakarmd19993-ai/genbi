import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Typing Dots ──────────────────────────────────────────
export function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f78166] to-[#bc8cff]"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Thinking Orb ─────────────────────────────────────────
export function ThinkingOrb() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Ripple */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-[#f78166]/30"
          style={{ width: 64 + i * 20, height: 64 + i * 20 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Rotating gradient ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #f78166, #bc8cff, #58a6ff, #3fb950, #f78166)",
          padding: "2px",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-[#161b22]" />
      </motion.div>

      {/* Inner glow orb */}
      <motion.div
        className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 35% 35%, #bc8cff, #58a6ff, #0d1117)",
          boxShadow: "0 0 20px rgba(188,140,255,0.5), 0 0 40px rgba(88,166,255,0.3)",
        }}
        animate={{
          boxShadow: [
            "0 0 20px rgba(188,140,255,0.5), 0 0 40px rgba(88,166,255,0.3)",
            "0 0 30px rgba(247,129,102,0.6), 0 0 60px rgba(188,140,255,0.4)",
            "0 0 20px rgba(188,140,255,0.5), 0 0 40px rgba(88,166,255,0.3)",
          ],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-lg">🔮</span>
      </motion.div>
    </div>
  );
}

// ── Thinking Text ─────────────────────────────────────────
export function ThinkingText() {
  const phrases = [
    "Analyzing your request...",
    "Understanding context...",
    "Connecting knowledge...",
    "Reasoning through data...",
    "Generating insights...",
    "Almost ready...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="text-gray-400 text-sm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4 }}
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
      {/* Cursor blink */}
      <motion.span
        className="text-[#f78166] font-bold text-sm"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        |
      </motion.span>
    </div>
  );
}

// ── Wave Animation ────────────────────────────────────────
export function WaveAnimation() {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{
            background: `linear-gradient(to top, #f78166, #bc8cff)`,
            minHeight: 4,
          }}
          animate={{ height: [4, Math.random() * 20 + 4, 4] }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Skeleton Message ──────────────────────────────────────
export function SkeletonMessage() {
  return (
    <div className="space-y-2 w-full max-w-md">
      {[90, 75, 85, 60].map((width, i) => (
        <motion.div
          key={i}
          className="h-3 rounded-full relative overflow-hidden"
          style={{ width: `${width}%`, backgroundColor: "#30363d" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(188,140,255,0.2), transparent)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Particle Background ───────────────────────────────────
export function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(188,140,255,0.15)";
        ctx.fill();

        particles.forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(88,166,255,${0.05 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}

// ── Main AILoading Component ──────────────────────────────
export default function AILoading() {
  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="relative rounded-2xl p-4 max-w-sm overflow-hidden"
        style={{
          background: "rgba(22, 27, 34, 0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid transparent",
          backgroundClip: "padding-box",
          boxShadow: "0 0 0 1px rgba(188,140,255,0.2), 0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, #f78166, #bc8cff, #58a6ff, #f78166)",
            padding: "1px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Particle background */}
        <ParticleBackground />

        {/* Content */}
        <div className="relative z-10">
          {/* Top row — orb + text */}
          <div className="flex items-center gap-4 mb-4">
            <ThinkingOrb />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#f78166] text-xs font-semibold">GenBI</span>
                <TypingDots />
              </div>
              <ThinkingText />
            </div>
          </div>

          {/* Wave */}
          <div className="mb-4">
            <WaveAnimation />
          </div>

          {/* Skeleton */}
          <SkeletonMessage />
        </div>
      </div>
    </motion.div>
  );
}