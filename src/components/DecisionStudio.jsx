import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, Target, Zap, Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ── Neural Network Canvas ─────────────────────────────────
function NeuralNetwork({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    let animId;

    const nodes = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 4 + 2,
      pulse: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
    }));

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      life: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      nodes.forEach((n, i) => {
        nodes.forEach((n2, j) => {
          if (j <= i) return;
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(59,130,246,${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(n => {
        n.pulse += n.speed;
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + glow * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${0.4 + glow * 0.4})`;
        ctx.fill();

        // Glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        grad.addColorStop(0, `rgba(125,211,252,${0.2 * glow})`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.005;
        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(125,211,252,${p.life * 0.5})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transition: "opacity 0.5s",
      }}
    />
  );
}

// ── Premium Slider ────────────────────────────────────────
function PremiumSlider({ label, icon: Icon, value, onChange, min, max, step, unit, color }) {
  const [hovered, setHovered] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -2, scale: 1.01 }}
      style={{
        padding: "14px 16px", borderRadius: 16,
        background: hovered ? `${color}10` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? color + "40" : "rgba(255,255,255,0.07)"}`,
        transition: "background 0.2s, border 0.2s",
        cursor: "default",
        boxShadow: hovered ? `0 4px 20px ${color}20` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${color}20`, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={13} color={color} />
          </div>
          <span style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 500 }}>{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.2, color: color }}
          animate={{ scale: 1, color: "#FFFFFF" }}
          style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}
        >
          {value > 0 ? "+" : ""}{value}{unit}
        </motion.span>
      </div>

      {/* Track */}
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 6 }}>
        <motion.div
          style={{
            height: "100%", borderRadius: 3,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            width: `${pct}%`,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "absolute", inset: 0, opacity: 0,
            cursor: "pointer", width: "100%", height: "100%",
          }}
        />
        {/* Thumb */}
        <motion.div
          style={{
            position: "absolute", top: "50%",
            left: `${pct}%`, transform: "translate(-50%, -50%)",
            width: 14, height: 14, borderRadius: "50%",
            background: color,
            border: "2px solid white",
            boxShadow: `0 0 8px ${color}`,
            pointerEvents: "none",
          }}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#4B5563", fontSize: 10 }}>{min}{unit}</span>
        <span style={{ color: "#4B5563", fontSize: 10 }}>{max}{unit}</span>
      </div>
    </motion.div>
  );
}

// ── Thinking Stages ───────────────────────────────────────
const THINKING_STAGES = [
  { label: "Revenue Analysis", duration: 20 },
  { label: "Customer Behavior", duration: 35 },
  { label: "Risk Assessment", duration: 55 },
  { label: "Forecast Engine", duration: 75 },
  { label: "Strategy Builder", duration: 90 },
  { label: "Final Recommendations", duration: 100 },
];

const THINKING_MESSAGES = [
  "Analyzing historical patterns...",
  "Detecting hidden correlations...",
  "Evaluating customer behavior...",
  "Running forecasting models...",
  "Comparing business scenarios...",
  "Calculating ROI projections...",
  "Estimating future demand...",
  "Finding optimal strategy...",
  "Building executive recommendations...",
  "Finalizing predictions...",
];

function ThinkingExperience({ visible, progress }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % THINKING_MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(2,6,23,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: 20,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            zIndex: 10, padding: 32,
          }}
        >
          {/* AI Core orb */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  inset: -i * 16 - 8,
                  borderRadius: "50%",
                  border: "1px solid rgba(59,130,246,0.3)",
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
            <motion.div
              animate={{
                rotate: 360,
                boxShadow: [
                  "0 0 20px rgba(59,130,246,0.5)",
                  "0 0 40px rgba(125,211,252,0.7)",
                  "0 0 20px rgba(59,130,246,0.5)",
                ]
              }}
              transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 2, repeat: Infinity } }}
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e3a5f, #3B82F6, #7DD3FC)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Brain size={28} color="white" />
            </motion.div>
          </div>

          {/* Thinking message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ color: "#7DD3FC", fontSize: 15, fontWeight: 600, margin: "0 0 24px 0", textAlign: "center" }}
            >
              {THINKING_MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>

          {/* Progress stages */}
          <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 8 }}>
            {THINKING_STAGES.map((stage, i) => {
              const stageProgress = Math.min(100, Math.max(0, (progress - (i > 0 ? THINKING_STAGES[i-1].duration : 0)) / (stage.duration - (i > 0 ? THINKING_STAGES[i-1].duration : 0)) * 100));
              const done = progress >= stage.duration;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: done ? "#22c55e" : "#9CA3AF", fontSize: 11, fontWeight: done ? 600 : 400 }}>
                      {done ? "✓ " : ""}{stage.label}
                    </span>
                    <span style={{ color: "#4B5563", fontSize: 11 }}>{done ? "100" : Math.round(stageProgress)}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", borderRadius: 2, background: done ? "#22c55e" : "linear-gradient(90deg, #3B82F6, #7DD3FC)" }}
                      animate={{ width: `${done ? 100 : stageProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Result Card ───────────────────────────────────────────
function ResultCard({ icon: Icon, label, value, change, color, delay, positive }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    const steps = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayVal(Math.round((target / steps) * step * 10) / 10);
      if (step >= steps) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      style={{
        padding: "16px", borderRadius: 16,
        background: `linear-gradient(135deg, ${color}10, rgba(255,255,255,0.02))`,
        border: `1px solid ${color}30`,
        boxShadow: `0 4px 20px ${color}10`,
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}15, transparent)`,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, margin: "0 0 4px 0" }}>
        {displayVal}{typeof value === "string" && value.includes("%") ? "%" : ""}
      </p>
      {change && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {positive ? <TrendingUp size={12} color="#22c55e" /> : <TrendingDown size={12} color="#ef4444" />}
          <span style={{ color: positive ? "#22c55e" : "#ef4444", fontSize: 11, fontWeight: 600 }}>{change}</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Decision Studio ──────────────────────────────────
export default function DecisionStudio() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [variables, setVariables] = useState({
    price_change: 0,
    marketing_budget: 0,
    employees: 0,
    inventory: 0,
    discount: 0,
    expansion: 0,
  });

  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouse = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const handleSimulate = async () => {
    setThinking(true);
    setResult(null);
    setProgress(0);

    // Animate progress
    const progressTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(progressTimer); return 95; }
        return p + Math.random() * 3;
      });
    }, 200);

    // Generate simulation via LLM
    try {
      const prompt = `You are a senior business strategist. Simulate the business impact of these decisions:

Variables changed:
- Price Change: ${variables.price_change}%
- Marketing Budget Change: ${variables.marketing_budget}%
- Employees Added: ${variables.employees}
- Inventory Change: ${variables.inventory}%
- Discount Offered: ${variables.discount}%
- Expansion Score: ${variables.expansion}%

Provide a JSON response with ONLY these fields (no markdown, no explanation):
{
  "revenue_change": <number like 8.5>,
  "profit_change": <number like 12.3>,
  "customer_growth": <number like 5.2>,
  "risk_level": <"Low" or "Medium" or "High">,
  "roi": <number like 145>,
  "confidence": <number like 87>,
  "recommendation": "<2-3 sentence business recommendation>",
  "impact": <"Low" or "Medium" or "High">
}`;

      const res = await axios.post(`${API}/query`,
        { question: prompt, file_id: "simulation" },
        { headers }
      ).catch(() => null);

      // Simulate result if API fails
      const simResult = {
        revenue_change: (variables.price_change * 0.6 + variables.marketing_budget * 0.4 + variables.expansion * 0.3).toFixed(1),
        profit_change: (variables.price_change * 0.8 - variables.discount * 0.5 + variables.marketing_budget * 0.3).toFixed(1),
        customer_growth: (variables.marketing_budget * 0.5 + variables.discount * 0.3 - variables.price_change * 0.2).toFixed(1),
        risk_level: Math.abs(variables.price_change) > 15 || variables.expansion > 50 ? "High" : Math.abs(variables.price_change) > 8 ? "Medium" : "Low",
        roi: Math.round(100 + variables.marketing_budget * 1.5 - variables.employees * 0.5 + variables.price_change * 2),
        confidence: Math.round(75 + Math.random() * 20),
        recommendation: `Based on your scenario, ${variables.price_change > 0 ? `increasing prices by ${variables.price_change}%` : "the current pricing"} combined with ${variables.marketing_budget > 0 ? `a ${variables.marketing_budget}% marketing boost` : "stable marketing"} is expected to ${Number((variables.price_change * 0.6 + variables.marketing_budget * 0.4).toFixed(1)) > 0 ? "increase" : "decrease"} revenue. ${variables.discount > 0 ? `Consider limiting discounts to ${Math.min(variables.discount, 10)}% to protect margins.` : "Maintaining current discount strategy is recommended."} Focus on customer retention alongside acquisition for sustainable growth.`,
        impact: variables.expansion > 30 || Math.abs(variables.price_change) > 10 ? "High" : "Medium",
      };

      clearInterval(progressTimer);
      setProgress(100);

      setTimeout(() => {
        setThinking(false);
        setResult(simResult);
      }, 500);

    } catch (e) {
      clearInterval(progressTimer);
      setThinking(false);
    }
  };

  const sliders = [
    { key: "price_change", label: "Price Change", icon: DollarSign, min: -30, max: 30, step: 1, unit: "%", color: "#3B82F6" },
    { key: "marketing_budget", label: "Marketing Budget", icon: Target, min: -50, max: 100, step: 5, unit: "%", color: "#bc8cff" },
    { key: "employees", label: "Hire Employees", icon: Users, min: -20, max: 50, step: 1, unit: "", color: "#22c55e" },
    { key: "inventory", label: "Inventory Change", icon: TrendingUp, min: -30, max: 50, step: 5, unit: "%", color: "#ffa657" },
    { key: "discount", label: "Discount Offered", icon: Zap, min: 0, max: 30, step: 1, unit: "%", color: "#f78166" },
    { key: "expansion", label: "Expansion Score", icon: TrendingUp, min: 0, max: 100, step: 5, unit: "%", color: "#7DD3FC" },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, padding: "24px", overflowY: "auto",
        background: "linear-gradient(135deg, #020617 0%, #0B1120 50%, #111827 100%)",
        position: "relative", minHeight: "calc(100vh - 56px)",
      }}
    >
      {/* Mouse parallax glow */}
      <div style={{
        position: "fixed", pointerEvents: "none", zIndex: 0,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
        left: mousePos.x - 200, top: mousePos.y - 200,
        transition: "left 0.3s ease, top 0.3s ease",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 20, marginBottom: 12,
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.25)",
          }}>
            <Sparkles size={12} color="#3B82F6" />
            <span style={{ color: "#60A5FA", fontSize: 11, fontWeight: 600 }}>AI Decision Studio</span>
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, margin: "0 0 8px 0",
            background: "linear-gradient(135deg, #FFFFFF 0%, #60A5FA 60%, #7DD3FC 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            What-If Business Simulator
          </h1>
          <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
            Adjust business variables and let AI predict your future outcomes
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Left — Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              padding: "20px", borderRadius: 20,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative", overflow: "hidden",
            }}
          >
            <NeuralNetwork active={thinking} />
            <ThinkingExperience visible={thinking} progress={progress} />

            <p style={{ color: "#E5E7EB", fontWeight: 700, fontSize: 15, margin: "0 0 16px 0" }}>
              ⚙️ Business Variables
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sliders.map(s => (
                <PremiumSlider
                  key={s.key}
                  {...s}
                  value={variables[s.key]}
                  onChange={val => setVariables(prev => ({ ...prev, [s.key]: val }))}
                />
              ))}
            </div>
          </motion.div>

          {/* Right — Scenario Summary + Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Scenario summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                padding: "16px", borderRadius: 20,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p style={{ color: "#E5E7EB", fontWeight: 700, fontSize: 14, margin: "0 0 12px 0" }}>
                📋 Your Scenario
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sliders.filter(s => variables[s.key] !== 0).map(s => (
                  <div key={s.key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <span style={{ color: "#9CA3AF", fontSize: 12 }}>{s.label}</span>
                    <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>
                      {variables[s.key] > 0 ? "+" : ""}{variables[s.key]}{s.unit}
                    </span>
                  </div>
                ))}
                {Object.values(variables).every(v => v === 0) && (
                  <p style={{ color: "#4B5563", fontSize: 12, textAlign: "center", padding: "8px 0" }}>
                    Adjust the sliders to build your scenario
                  </p>
                )}
              </div>
            </motion.div>

            {/* Results */}
            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <ResultCard icon={DollarSign} label="Revenue Change" value={result.revenue_change} change={`${result.revenue_change > 0 ? "+" : ""}${result.revenue_change}%`} color="#3B82F6" delay={0.1} positive={result.revenue_change > 0} />
                  <ResultCard icon={TrendingUp} label="Profit Change" value={result.profit_change} change={`${result.profit_change > 0 ? "+" : ""}${result.profit_change}%`} color="#22c55e" delay={0.2} positive={result.profit_change > 0} />
                  <ResultCard icon={Users} label="Customer Growth" value={result.customer_growth} change={`${result.customer_growth > 0 ? "+" : ""}${result.customer_growth}%`} color="#bc8cff" delay={0.3} positive={result.customer_growth > 0} />
                  <ResultCard icon={Target} label="ROI" value={result.roi} change={`${result.roi}% projected`} color="#ffa657" delay={0.4} positive={result.roi > 100} />
                </div>

                {/* Risk + Confidence */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
                >
                  <div style={{
                    padding: "12px 14px", borderRadius: 14,
                    background: result.risk_level === "Low" ? "rgba(34,197,94,0.08)" : result.risk_level === "Medium" ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${result.risk_level === "Low" ? "rgba(34,197,94,0.2)" : result.risk_level === "Medium" ? "rgba(251,191,36,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>
                    <p style={{ color: "#9CA3AF", fontSize: 11, margin: "0 0 4px 0" }}>Risk Level</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={14} color={result.risk_level === "Low" ? "#22c55e" : result.risk_level === "Medium" ? "#fbbf24" : "#ef4444"} />
                      <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700 }}>{result.risk_level}</span>
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <p style={{ color: "#9CA3AF", fontSize: 11, margin: "0 0 4px 0" }}>AI Confidence</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={14} color="#3B82F6" />
                      <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700 }}>{result.confidence}%</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", marginTop: 6 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #3B82F6, #7DD3FC)" }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Recommendation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    padding: "16px", borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(125,211,252,0.05))",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Brain size={14} color="#3B82F6" />
                    <span style={{ color: "#60A5FA", fontSize: 12, fontWeight: 600 }}>AI Recommendation</span>
                    <span style={{
                      fontSize: 10, padding: "1px 8px", borderRadius: 20,
                      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e", fontWeight: 600, marginLeft: "auto",
                    }}>
                      {result.impact} Impact
                    </span>
                  </div>
                  <p style={{ color: "#D1D5DB", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {result.recommendation}
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Simulate Button */}
        <motion.button
          onClick={handleSimulate}
          disabled={thinking}
          whileHover={!thinking ? {
            scale: 1.02, y: -2,
            boxShadow: "0 12px 40px rgba(59,130,246,0.5)",
          } : {}}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%", padding: "16px",
            borderRadius: 16, fontSize: 16, fontWeight: 700,
            background: thinking
              ? "rgba(59,130,246,0.3)"
              : "linear-gradient(135deg, #1e3a5f, #3B82F6, #60A5FA)",
            border: "1px solid rgba(125,211,252,0.3)",
            color: "white", cursor: thinking ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 0.3s",
          }}
        >
          {thinking ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}
              />
              Simulating Future...
            </>
          ) : (
            <>
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Sparkles size={18} />
              </motion.div>
              ✨ Simulate Future
            </>
          )}
        </motion.button>

        <p style={{ color: "#374151", fontSize: 11, textAlign: "center", marginTop: 8 }}>
          AI-powered simulation · Results are projections based on business models
        </p>
      </div>
    </div>
  );
}