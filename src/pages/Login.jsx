import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ── Floating Icons ───────────────────────────────────────
const FLOATING_ICONS = [
  { icon: "🎥", label: "YouTube", x: 8, y: 15, delay: 0, size: 28 },
  { icon: "📄", label: "PDF", x: 85, y: 10, delay: 0.5, size: 24 },
  { icon: "🧠", label: "Deep Learning", x: 5, y: 45, delay: 1, size: 32 },
  { icon: "📊", label: "Analytics", x: 90, y: 40, delay: 1.5, size: 26 },
  { icon: "🤖", label: "AI", x: 15, y: 75, delay: 2, size: 30 },
  { icon: "💹", label: "Finance", x: 80, y: 70, delay: 2.5, size: 24 },
  { icon: "🔬", label: "NLP", x: 50, y: 5, delay: 0.8, size: 26 },
  { icon: "📈", label: "ML", x: 92, y: 20, delay: 1.2, size: 22 },
  { icon: "🏭", label: "Manufacturing", x: 3, y: 30, delay: 1.8, size: 24 },
  { icon: "🛒", label: "Retail", x: 88, y: 55, delay: 0.3, size: 22 },
  { icon: "💊", label: "Healthcare", x: 10, y: 60, delay: 2.2, size: 24 },
  { icon: "📦", label: "Data", x: 75, y: 85, delay: 0.7, size: 26 },
  { icon: "🔮", label: "GenBI", x: 45, y: 88, delay: 1.5, size: 30 },
  { icon: "⚙️", label: "AutoML", x: 20, y: 88, delay: 0.4, size: 22 },
  { icon: "🌐", label: "Web", x: 65, y: 8, delay: 1.9, size: 22 },
  { icon: "💡", label: "Insights", x: 30, y: 5, delay: 0.6, size: 24 },
  { icon: "🎯", label: "KPI", x: 95, y: 80, delay: 2.8, size: 22 },
  { icon: "📱", label: "Marketing", x: 2, y: 85, delay: 3.0, size: 22 },
  { icon: "🔗", label: "Integration", x: 55, y: 92, delay: 1.1, size: 20 },
  { icon: "💰", label: "Revenue", x: 70, y: 25, delay: 2.4, size: 24 },
];

function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {FLOATING_ICONS.map((item, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center gap-1"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            animation: `float-icon ${4 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${item.delay}s`,
            opacity: 0.35,
            transition: "opacity 0.3s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.35"}
        >
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: item.size + 16,
              height: item.size + 16,
              fontSize: item.size,
              background: "rgba(88,166,255,0.08)",
              border: "1px solid rgba(88,166,255,0.15)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            }}
          >
            {item.icon}
          </div>
          <span style={{
            fontSize: "8px",
            color: "rgba(88,166,255,0.6)",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Particle Canvas ──────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    const stars = Array.from({ length: 4 }, () => ({
      x: 0, y: 0, len: Math.random() * 120 + 60,
      speed: Math.random() * 6 + 3,
      opacity: 0, active: false,
      delay: Math.random() * 200, timer: 0,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(125,211,252,${p.opacity})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x; const dy = p.y - p2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59,130,246,${0.08*(1-dist/100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      stars.forEach(s => {
        s.timer++;
        if (s.timer < s.delay) return;
        if (!s.active) {
          s.active = true;
          s.x = Math.random() * canvas.width;
          s.y = Math.random() * canvas.height * 0.5;
          s.opacity = 1;
        }
        s.x += s.speed; s.y += s.speed * 0.3;
        s.opacity -= 0.012;
        if (s.opacity <= 0) {
          s.active = false; s.timer = 0;
          s.delay = Math.random() * 250 + 100;
        }
        if (s.active && s.opacity > 0) {
          const grad = ctx.createLinearGradient(s.x, s.y, s.x-s.len, s.y-s.len*0.3);
          grad.addColorStop(0, `rgba(188,140,255,${s.opacity})`);
          grad.addColorStop(1, "rgba(88,166,255,0)");
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x-s.len, s.y-s.len*0.3);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

// ── Features List ─────────────────────────────────────────
const FEATURES = [
  { icon: "🧠", title: "12 AI Analytics Features", desc: "Insights, forecasting, root cause, SQL, consultant & more" },
  { icon: "🎥", title: "YouTube → Study Notes", desc: "Paste any lecture URL and get a structured PDF" },
  { icon: "📄", title: "Document Intelligence", desc: "Chat with PDFs, Word, PowerPoint files" },
  { icon: "🤖", title: "Local AI (Privacy First)", desc: "llama3.2 runs on your machine — data never leaves" },
  { icon: "📊", title: "Auto Dashboard", desc: "Bar, pie, line, scatter, heatmap — generated instantly" },
  { icon: "💰", title: "Business Consultant", desc: "SWOT, KPIs, growth roadmap, strategic recommendations" },
  { icon: "🔬", title: "NLP & ML Pipeline", desc: "Sentiment, clustering, churn prediction (coming soon)" },
  { icon: "🏭", title: "Industry Intelligence", desc: "Retail, Finance, Healthcare, HR, Marketing, Manufacturing" },
];

// ── Main Login ───────────────────────────────────────────
export default function Login() {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      if (tab === "login") {
        const f = new FormData();
        f.append("username", username); f.append("password", password);
        const res = await axios.post(`${API}/auth/login`, f);
        login(res.data.access_token, username); navigate("/");
      } else {
        await axios.post(`${API}/auth/signup`, { username, password });
        const f = new FormData();
        f.append("username", username); f.append("password", password);
        const res = await axios.post(`${API}/auth/login`, f);
        login(res.data.access_token, username); navigate("/");
      }
    } catch (e) { setError(e.response?.data?.detail || "Something went wrong"); }
    setLoading(false);
  };

  const metalBtn = (active) => ({
    background: active
      ? "linear-gradient(135deg, #1e3a5f, #2563eb, #1e40af)"
      : "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,58,138,0.3))",
    border: `1px solid rgba(88,166,255,${active ? 0.5 : 0.15})`,
    boxShadow: active
      ? "0 4px 20px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
      : "inset 0 1px 0 rgba(255,255,255,0.05)",
    color: active ? "white" : "#6b7280",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ background: "linear-gradient(135deg, #020617 0%, #0B1120 45%, #111827 100%)", minHeight: "100vh", overflowY: "auto" }}
      className="relative">

      <ParticleCanvas />
      <FloatingIcons />

      {/* Aurora */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute rounded-full" style={{ width: 900, height: 900, background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)", top: -400, left: -400, animation: "blob1 18s ease-in-out infinite alternate" }} />
        <div className="absolute rounded-full" style={{ width: 700, height: 700, background: "radial-gradient(circle, rgba(188,140,255,0.08) 0%, transparent 70%)", bottom: -300, right: -300, animation: "blob2 22s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", width: "100%", height: "1px", top: "50%", background: "linear-gradient(90deg, transparent, rgba(88,166,255,0.1), rgba(188,140,255,0.08), transparent)", animation: "glow-line 5s ease-in-out infinite" }} />
      </div>

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, backgroundImage: "linear-gradient(rgba(88,166,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(88,166,255,0.025) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-8 py-4" style={{ zIndex: 10 }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          <span className="font-bold text-white text-lg">GenBI</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(88,166,255,0.3)", color: "#58a6ff" }}>AI</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowAbout(!showAbout)}
            className="text-sm transition-colors"
            style={{ color: showAbout ? "#58a6ff" : "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
            About
          </button>
          <a href="https://github.com/abubakarmd19993-ai/genbi" target="_blank" rel="noreferrer"
            className="text-sm transition-colors" style={{ color: "#6b7280", textDecoration: "none" }}>
            GitHub
          </a>
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.3)", color: "#3fb950" }}>
            🟢 Live
          </span>
        </div>
      </nav>

      <div className="relative flex flex-col items-center justify-center min-h-screen py-16 px-4" style={{ zIndex: 10 }}>

        {/* About Section */}
        {showAbout && (
          <div className="w-full max-w-4xl mb-12 rounded-2xl p-8"
            style={{ background: "rgba(8,8,20,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(88,166,255,0.15)", animation: "fadeIn 0.3s ease" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">About GenBI</h2>
              <button onClick={() => setShowAbout(false)}
                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "#8b949e" }}>
              GenBI is a full-stack AI-powered Business Intelligence platform built to democratize data analysis.
              Upload any CSV or Excel file and get instant insights, forecasts, dashboards, and executive reports —
              all powered by a local LLM (llama3.2) that runs entirely on your machine for complete data privacy.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Features", value: "12+" },
                { label: "Phases", value: "17" },
                { label: "Planned", value: "246" },
                { label: "Privacy", value: "100%" },
              ].map((stat, i) => (
                <div key={i} className="text-center rounded-xl p-4"
                  style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(88,166,255,0.15)" }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#58a6ff" }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xl shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white mb-0.5">{f.title}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "#6b7280" }}>TECH STACK</p>
              <div className="flex flex-wrap gap-2">
                {["FastAPI", "MongoDB Atlas", "LangChain", "ChromaDB", "Ollama", "llama3.2", "Prophet", "ReportLab", "React", "Framer Motion", "Recharts", "Docker"].map(tech => (
                  <span key={tech} className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(88,166,255,0.2)", color: "#58a6ff" }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero Text */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(125,211,252,0.2))", border: "1px solid rgba(88,166,255,0.4)", boxShadow: "0 0 50px rgba(37,99,235,0.3)", animation: "pulse-orb 3s ease-in-out infinite" }}>
            <span className="text-4xl" style={{ filter: "drop-shadow(0 0 10px rgba(88,166,255,0.6))" }}>🔮</span>
          </div>
          <h1 className="text-5xl font-bold mb-3"
            style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #60A5FA 50%, #7DD3FC 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 20px rgba(125,211,252,0.5))" }}>
            GenBI AI
          </h1>
          <p className="text-base mb-2" style={{ color: "#D1D5DB" }}>
            The World's Most Complete AI Business Intelligence Platform
          </p>
          <p className="text-sm" style={{ color: "#4b5563" }}>
            12 Analytics Features · Local AI · Privacy First · $9.99/month
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8"
            style={{ background: "rgba(8,8,20,0.9)", backdropFilter: "blur(24px)", border: "1px solid rgba(88,166,255,0.15)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}>

            {/* Tabs */}
            <div className="flex rounded-xl p-1 mb-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {["login", "signup"].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(""); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={tab === t ? {
                    background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(125,211,252,0.2))",
                    border: "1px solid rgba(88,166,255,0.3)",
                    color: "#58a6ff",
                    boxShadow: "0 4px 15px rgba(37,99,235,0.2)",
                  } : { background: "transparent", border: "1px solid transparent", color: "#4b5563" }}>
                  {t === "login" ? "🔑 Sign In" : "✨ Create Account"}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="space-y-4 mb-6">
              {[
                { label: "Username", value: username, setter: setUsername, type: "text", placeholder: "Enter your username", field: "username" },
                { label: "Password", value: password, setter: setPassword, type: "password", placeholder: "Enter your password", field: "password" },
              ].map(({ label, value, setter, type, placeholder, field }) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#6b7280" }}>{label}</label>
                  <input
                    type={type} value={value}
                    onChange={(e) => setter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: focusedField === field ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid rgba(88,166,255,${focusedField === field ? 0.5 : 0.08})`,
                      color: "white",
                      boxShadow: focusedField === field ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-xs"
                style={{ background: "rgba(255,123,114,0.08)", border: "1px solid rgba(255,123,114,0.2)", color: "#ff7b72" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm mb-5"
              style={{
                background: "linear-gradient(135deg, #1e3a5f, #3B82F6, #2563eb)",
                border: "1px solid rgba(125,211,252,0.4)",
                boxShadow: "0 4px 20px rgba(59,130,246,0.35), 0 0 20px rgba(125,211,252,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                color: "white", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1, transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = "0 8px 30px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.35), 0 0 20px rgba(125,211,252,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 rounded-full" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
                  Processing...
                </span>
              ) : tab === "login" ? "Sign In to GenBI →" : "Create Account →"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-xs" style={{ color: "#374151" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>

            {/* Social */}
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: "G", label: "Google" }, { icon: "⌥", label: "GitHub" }, { icon: "M", label: "Microsoft" }].map(s => (
                <button key={s.label}
                  className="py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={metalBtn(false)}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, metalBtn(true))}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, metalBtn(false))}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-xs" style={{ color: "#374151" }}>
              By continuing you agree to our{" "}
              <span className="cursor-pointer" style={{ color: "#4b5563" }}
                onMouseEnter={e => e.target.style.color = "#58a6ff"}
                onMouseLeave={e => e.target.style.color = "#4b5563"}>Terms</span>
              {" "}and{" "}
              <span className="cursor-pointer" style={{ color: "#4b5563" }}
                onMouseEnter={e => e.target.style.color = "#58a6ff"}
                onMouseLeave={e => e.target.style.color = "#4b5563"}>Privacy Policy</span>
            </p>
            <div className="flex items-center justify-center gap-2">
              <span style={{ color: "#22c55e", fontSize: "10px" }}>🔒</span>
              <span className="text-xs" style={{ color: "#374151" }}>Local AI — your data never leaves your machine</span>
            </div>
          </div>
        </div>

        {/* Features Strip */}
        <div className="w-full max-w-4xl mt-16">
          <p className="text-center text-xs mb-6 tracking-widest uppercase" style={{ color: "#374151" }}>
            Everything you need to analyze your business data
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.slice(0, 8).map((f, i) => (
              <div key={i}
                className="rounded-xl p-4 text-center transition-all cursor-default"
                style={{ background: "rgba(8,8,20,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(88,166,255,0.08)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(88,166,255,0.3)"; e.currentTarget.style.background = "rgba(37,99,235,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(88,166,255,0.08)"; e.currentTarget.style.background = "rgba(8,8,20,0.6)"; }}>
                <span className="text-2xl block mb-2">{f.icon}</span>
                <p className="text-xs font-medium text-white mb-1">{f.title}</p>
                <p className="text-xs" style={{ color: "#4b5563" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(2deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes blob1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(80px,60px) scale(1.2); }
        }
        @keyframes blob2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-60px,-40px) scale(1.15); }
        }
        @keyframes pulse-orb {
          0%,100% { box-shadow: 0 0 50px rgba(37,99,235,0.3); }
          50% { box-shadow: 0 0 80px rgba(37,99,235,0.6), 0 0 120px rgba(88,166,255,0.2); }
        }
        @keyframes glow-line {
          0%,100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
