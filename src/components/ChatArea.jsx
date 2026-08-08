import InvoiceReaderTool from "./InvoiceReaderTool";
import PDFTranslatorTool from "./PDFTranslatorTool";
import DecisionStudio from "./DecisionStudio";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, MessageSquare, TrendingUp, Settings, FolderOpen,
  History, Briefcase, Send, Paperclip, Mic, Sparkles,
  Search, BarChart3, FileText, Zap, ArrowRight, Brain
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AILoading from "./AILoading";
import ChartDashboard from "./Dashboard";
import IndustryLoader from "./IndustryLoader";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ── Floating Particles ────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: "rgba(125,211,252,0.4)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Quick Action Card ─────────────────────────────────────
function QuickCard({ icon: Icon, text, color, onClick, delay }) {
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick();
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      style={{
        position: "relative", overflow: "hidden",
        padding: "12px 16px", borderRadius: 14,
        background: hovered
          ? "rgba(59,130,246,0.1)"
          : "rgba(255,255,255,0.03)",
        border: hovered
          ? "1px solid rgba(59,130,246,0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        cursor: "pointer",
        boxShadow: hovered ? "0 8px 30px rgba(59,130,246,0.15)" : "none",
        transition: "background 0.2s, border 0.2s, box-shadow 0.2s",
        display: "flex", alignItems: "center", gap: 10,
        backdropFilter: "blur(10px)",
      }}
    >
      {ripples.map(r => (
        <motion.div key={r.id}
          style={{ position: "absolute", left: r.x, top: r.y, width: 4, height: 4, borderRadius: "50%", background: "rgba(125,211,252,0.5)", transform: "translate(-50%,-50%)", pointerEvents: "none" }}
          animate={{ scale: [0, 10], opacity: [0.5, 0] }}
          transition={{ duration: 0.6 }}
        />
      ))}
      <motion.div
        animate={hovered ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ color: hovered ? "#60A5FA" : "#6B7280", transition: "color 0.2s" }}
      >
        <Icon size={16} />
      </motion.div>
      <span style={{
        fontSize: 13, fontWeight: 500,
        color: hovered ? "#E5E7EB" : "#9CA3AF",
        transition: "color 0.2s",
      }}>
        {text}
      </span>
    </motion.button>
  );
}

// ── Feature Card ──────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, id, onClick, delay, featured }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 250 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(id)}
      style={{
        position: "relative", overflow: "hidden",
        padding: featured ? "20px" : "16px",
        borderRadius: 18, cursor: "pointer", textAlign: "left",
        background: featured
          ? "linear-gradient(135deg, rgba(30,58,95,0.6), rgba(37,99,235,0.2))"
          : hovered
          ? "rgba(59,130,246,0.08)"
          : "rgba(255,255,255,0.02)",
        border: featured
          ? "1px solid rgba(59,130,246,0.4)"
          : hovered
          ? "1px solid rgba(59,130,246,0.3)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: hovered
          ? featured
            ? "0 12px 40px rgba(59,130,246,0.3)"
            : "0 8px 25px rgba(59,130,246,0.15)"
          : featured
          ? "0 4px 20px rgba(59,130,246,0.15)"
          : "none",
        backdropFilter: "blur(10px)",
        transition: "background 0.2s, border 0.2s, box-shadow 0.2s",
      }}
    >
      {featured && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          fontSize: 10, padding: "2px 8px", borderRadius: 20,
          background: "rgba(59,130,246,0.2)",
          border: "1px solid rgba(59,130,246,0.4)",
          color: "#60A5FA", fontWeight: 600,
        }}>
          ⭐ Recommended
        </div>
      )}
      <motion.div
        animate={hovered ? { rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          width: featured ? 44 : 36, height: featured ? 44 : 36,
          borderRadius: 12, marginBottom: 10,
          background: hovered || featured
            ? "rgba(59,130,246,0.15)"
            : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(59,130,246,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: hovered || featured ? "#60A5FA" : "#6B7280",
          transition: "all 0.2s",
        }}
      >
        <Icon size={featured ? 20 : 17} />
      </motion.div>

      <p style={{
        color: hovered || featured ? "#FFFFFF" : "#E5E7EB",
        fontSize: featured ? 15 : 13, fontWeight: 600,
        margin: "0 0 4px 0", transition: "color 0.2s",
      }}>
        {title}
      </p>
      <p style={{
        color: "#6B7280", fontSize: 11,
        margin: 0, lineHeight: 1.5,
      }}>
        {desc}
      </p>

      <motion.div
        animate={hovered ? { x: 4 } : { x: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ marginTop: 10, color: hovered ? "#3B82F6" : "#374151" }}
      >
        <ArrowRight size={13} />
      </motion.div>
    </motion.button>
  );
}

// ── Animated Placeholder ──────────────────────────────────
function AnimatedPlaceholder({ focused }) {
  const phrases = [
    "Ask GenBI anything...",
    "Analyze my sales data...",
    "Find hidden insights...",
    "Generate a dashboard...",
    "Predict next quarter...",
    "Create executive report...",
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (focused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % phrases.length), 3000);
    return () => clearInterval(t);
  }, [focused]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute", left: 16, top: "50%",
          transform: "translateY(-50%)",
          color: "#374151", fontSize: 14,
          pointerEvents: "none",
        }}
      >
        {phrases[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

// ── Home Screen ───────────────────────────────────────────
function HomeScreen({ username, setActiveTool, setInput, fileId }) {
  const quickActions = [
    { icon: BarChart3, text: "Analyze my data", action: () => setInput("Analyze my data") },
    { icon: TrendingUp, text: "Forecast sales", action: () => setInput("Forecast sales") },
    { icon: Search, text: "Find anomalies", action: () => setInput("Find anomalies") },
    { icon: FileText, text: "Generate report", action: () => setActiveTool("upload") },
  ];

  const features = [
    { icon: Upload, title: "Upload & Analyze", desc: "Upload CSV or Excel and get instant AI insights", id: "upload" },
    { icon: MessageSquare, title: "Ask Questions", desc: "Chat with your data in plain English", id: "chat" },
    { icon: TrendingUp, title: "Forecasting", desc: "Predict future values with Prophet AI", id: "forecast" },
    { icon: FolderOpen, title: "My Files", desc: "Manage all your uploaded datasets", id: "files" },
    { icon: History, title: "History", desc: "Review past queries and forecasts", id: "history" },
    { icon: Settings, title: "Embedder", desc: "Convert any file to AI embeddings", id: "embed" },
    { icon: Briefcase, title: "AI Consultant", desc: "Full SWOT, KPIs, strategic roadmap & growth plan", id: "upload", featured: true },
  ];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: "24px 24px 16px",
      position: "relative",
      overflowY: "auto",
      maxHeight: "calc(100vh - 56px - 120px)",
    }}>
      <FloatingParticles />

      {/* Aurora blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
            top: "10%", left: "50%", transform: "translateX(-50%)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 720 }}>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginBottom: 16, padding: "4px 12px", borderRadius: 20,
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
            />
            <span style={{ color: "#60A5FA", fontSize: 11, fontWeight: 600 }}>AI Ready · GenBI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 28, fontWeight: 800, margin: "0 0 8px 0",
              background: "linear-gradient(135deg, #FFFFFF 0%, #60A5FA 60%, #7DD3FC 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Hello, {username}! 👋
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: "#9CA3AF", fontSize: 15, margin: "0 0 4px 0" }}
          >
            Welcome back to GenBI AI
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: "#4B5563", fontSize: 13, margin: 0 }}
          >
            Transform your business data into intelligent decisions powered by AI.
          </motion.p>

          {fileId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                marginTop: 12, padding: "6px 14px", borderRadius: 20,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ color: "#22c55e", fontSize: 11 }}>
                File loaded: {fileId.slice(0, 16)}...
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6, marginBottom: 16,
        }}>
          {quickActions.map((a, i) => (
            <QuickCard
              key={i} icon={a.icon} text={a.text}
              delay={0.5 + i * 0.08}
              onClick={a.action}
            />
          ))}
        </div>

       {/* Feature Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 8,
        }}>
          {features.slice(0, 6).map((f, i) => (
            <FeatureCard
              key={f.id + i} {...f}
              onClick={setActiveTool}
              delay={0.7 + i * 0.07}
            />
          ))}
        </div>

        {/* Featured AI Consultant Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, type: "spring" }}
          onClick={() => setActiveTool("upload")}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{
            width: "100%", textAlign: "left",
            padding: "20px 24px", borderRadius: 18,
            background: "linear-gradient(135deg, rgba(30,58,95,0.7), rgba(37,99,235,0.25))",
            border: "1px solid rgba(59,130,246,0.35)",
            cursor: "pointer", position: "relative", overflow: "hidden",
            boxShadow: "0 4px 24px rgba(59,130,246,0.15)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", gap: 20,
          }}
        >
          {/* Glow blob */}
          <div style={{
            position: "absolute", right: -40, top: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(125,211,252,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>
            👔
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700, margin: 0 }}>
                AI Business Consultant
              </p>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#60A5FA", fontWeight: 600,
              }}>⭐ Recommended</span>
            </div>
            <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>
              Full SWOT analysis · KPIs · Strategic roadmap · Growth plan · Industry intelligence
            </p>
          </div>

          {/* Arrow */}
          <div style={{ color: "#3B82F6", flexShrink: 0 }}>
            <ArrowRight size={20} />
          </div>
        </motion.button>
      </div>
    </div>
  );
}

// ── Main ChatArea ─────────────────────────────────────────
export default function ChatArea({ activeTool, setActiveTool, setChats }) {
  const { username, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [fileIdFocused, setFileIdFocused] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!fileId) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Please paste a File ID below to chat with your data. Upload a file first from the Upload tool."
      }]);
      return;
    }
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/query`, { question: input, file_id: fileId }, { headers });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }]);
      if (setChats) setChats(prev => [...prev, {
        question: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  if (activeTool === "upload") return <UploadTool headers={headers} setFileId={setFileId} setActiveTool={setActiveTool} />;
  if (activeTool === "forecast") return <ForecastTool headers={headers} />;
  if (activeTool === "files") return <FilesTool headers={headers} setFileId={setFileId} setActiveTool={setActiveTool} />;
  if (activeTool === "history") return <HistoryTool headers={headers} />;
  if (activeTool === "autodashboard") return <ChartDashboard headers={headers} />;
  if (activeTool === "youtube") return <YouTubeTool headers={headers} />;
  if (activeTool === "pdfchat") return <PDFChatTool />;
  if (activeTool === "simulator") return <DecisionStudio />;
  if (activeTool === "ocr") return <OCRTool />;
  if (activeTool === "translator") return <PDFTranslatorTool />;
  if (activeTool === "invoice") return <InvoiceReaderTool />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {messages.length === 0 ? (
          <HomeScreen
            username={username}
            setActiveTool={setActiveTool}
            setInput={setInput}
            fileId={fileId}
          />
        ) : (
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
                >
                  <div style={{
                    maxWidth: 640, borderRadius: 18,
                    padding: "12px 16px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #1e3a5f, #3B82F6)"
                      : "rgba(255,255,255,0.04)",
                    border: msg.role === "user"
                      ? "1px solid rgba(125,211,252,0.3)"
                      : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: msg.role === "user"
                      ? "0 4px 20px rgba(59,130,246,0.2)"
                      : "none",
                  }}>
                    {msg.role === "assistant" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Sparkles size={12} color="#3B82F6" />
                        <span style={{ color: "#3B82F6", fontSize: 11, fontWeight: 600 }}>GenBI AI</span>
                      </div>
                    )}
                    <p style={{ color: "#E5E7EB", fontSize: 14, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && <AILoading />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - always at bottom */}
      <div style={{
        padding: "12px 20px 16px",
        background: "rgba(15,23,42,0.8)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        {/* File ID */}
        <div style={{ marginBottom: 8, position: "relative" }}>
          <input
            value={fileId}
            onChange={e => setFileId(e.target.value)}
            onFocus={() => setFileIdFocused(true)}
            onBlur={() => setFileIdFocused(false)}
            placeholder="Paste File ID to chat with your data..."
            style={{
              width: "100%", padding: "7px 14px",
              borderRadius: 10, fontSize: 12, outline: "none",
              background: fileIdFocused ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${fileIdFocused ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)"}`,
              color: fileId ? "#22c55e" : "#6B7280",
              fontFamily: fileId ? "monospace" : "Inter, sans-serif",
              transition: "all 0.2s", boxSizing: "border-box",
            }}
          />
          {fileId && (
            <div style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)",
              width: 6, height: 6, borderRadius: "50%",
              background: "#22c55e", boxShadow: "0 0 6px #22c55e",
            }} />
          )}
        </div>

        {/* Main input */}
        <motion.div
          animate={inputFocused ? {
            boxShadow: "0 0 0 1px rgba(59,130,246,0.4), 0 4px 20px rgba(59,130,246,0.12)"
          } : {
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06)"
          }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: inputFocused ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.03)",
            borderRadius: 14, padding: "8px 12px",
            border: `1px solid ${inputFocused ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)"}`,
            backdropFilter: "blur(10px)",
            transition: "background 0.2s, border 0.2s",
            position: "relative",
          }}
        >
          <motion.button
            onClick={() => setActiveTool("upload")}
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, display: "flex", alignItems: "center" }}
          >
            <Paperclip size={16} />
          </motion.button>

          <div style={{ flex: 1, position: "relative", height: 24 }}>
            {!input && !inputFocused && <AnimatedPlaceholder focused={inputFocused} />}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                width: "100%", background: "transparent",
                border: "none", outline: "none",
                color: "#FFFFFF", fontSize: 14,
                fontFamily: "Inter, sans-serif",
                position: "absolute", top: 0, left: 0,
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, display: "flex", alignItems: "center" }}
          >
            <Mic size={16} />
          </motion.button>

          <motion.button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            whileHover={!loading && input.trim() ? { scale: 1.05, y: -1 } : {}}
            whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: input.trim()
                ? "linear-gradient(135deg, #1e3a5f, #3B82F6)"
                : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(125,211,252,0.2)",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading ? 0.6 : 1,
              boxShadow: input.trim() ? "0 4px 15px rgba(59,130,246,0.3)" : "none",
              transition: "all 0.2s", flexShrink: 0,
            }}
          >
            {loading
              ? <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}
                />
              : <Send size={13} color={input.trim() ? "white" : "#374151"} />
            }
          </motion.button>
        </motion.div>

        <p style={{ color: "#374151", fontSize: 10, textAlign: "center", marginTop: 6, marginBottom: 0 }}>
          GenBI AI · Local LLM · Your data stays private
        </p>
      </div>
    </div>
  );
}

// ── Upload Tool ──────────────────────────────────────────
function UploadTool({ headers, setFileId, setActiveTool }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [dataQuality, setDataQuality] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rootCause, setRootCause] = useState(null);
  const [rootCauseLoading, setRootCauseLoading] = useState(false);
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlQuestion, setSqlQuestion] = useState("What is the total sales by category?");
  const [consultant, setConsultant] = useState(null);
  const [consultantLoading, setConsultantLoading] = useState(false);
  const [industry, setIndustry] = useState(null);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [detectedIndustry, setDetectedIndustry] = useState("general");
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError("");

    // Auto-detect industry from filename + column names
    const filename = file.name.toLowerCase();
    let autoIndustry = "general";
    if (filename.includes("hotel") || filename.includes("hospitality") || filename.includes("room") || filename.includes("booking")) autoIndustry = "hotel";
    else if (filename.includes("hospital") || filename.includes("patient") || filename.includes("health") || filename.includes("medical")) autoIndustry = "healthcare";
    else if (filename.includes("loan") || filename.includes("bank") || filename.includes("finance") || filename.includes("credit")) autoIndustry = "finance";
    else if (filename.includes("retail") || filename.includes("sales") || filename.includes("product") || filename.includes("store")) autoIndustry = "retail";
    else if (filename.includes("employee") || filename.includes("hr") || filename.includes("salary") || filename.includes("attrition")) autoIndustry = "hr";
    else if (filename.includes("marketing") || filename.includes("campaign") || filename.includes("ads") || filename.includes("click")) autoIndustry = "marketing";
    else if (filename.includes("manufacturing") || filename.includes("production") || filename.includes("factory")) autoIndustry = "manufacturing";
    else if (filename.includes("logistics") || filename.includes("delivery") || filename.includes("shipment")) autoIndustry = "logistics";
    else if (filename.includes("real") || filename.includes("property") || filename.includes("estate")) autoIndustry = "realestate";
    else if (filename.includes("flight") || filename.includes("aviation") || filename.includes("airline")) autoIndustry = "aviation";
    else if (filename.includes("student") || filename.includes("education") || filename.includes("school")) autoIndustry = "education";
    else if (filename.includes("order") || filename.includes("ecommerce") || filename.includes("cart")) autoIndustry = "ecommerce";

    setDetectedIndustry(autoIndustry);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload`, formData, { headers });
      setResult(res.data); setFileId(res.data.file_id);

      // Also detect from columns
      const columns = res.data.columns?.join(" ").toLowerCase() || "";
      if (columns.includes("patient") || columns.includes("diagnosis")) setDetectedIndustry("healthcare");
      else if (columns.includes("loan") || columns.includes("interest") || columns.includes("credit")) setDetectedIndustry("finance");
      else if (columns.includes("employee") || columns.includes("salary") || columns.includes("attrition")) setDetectedIndustry("hr");
      else if (columns.includes("room") || columns.includes("occupancy") || columns.includes("checkin")) setDetectedIndustry("hotel");
      else if (columns.includes("product") || columns.includes("category") || columns.includes("sales")) setDetectedIndustry("retail");
      else if (columns.includes("campaign") || columns.includes("clicks") || columns.includes("impressions")) setDetectedIndustry("marketing");
      else if (columns.includes("flight") || columns.includes("airline") || columns.includes("departure")) setDetectedIndustry("aviation");

      showToast(`✅ ${res.data.filename} uploaded!`, "success");
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed");
      showToast("❌ Upload failed.", "error");
    }
    setLoading(false);
  };

  const handleInsights = async () => {
    if (!file) return; setInsightsLoading(true);
    const f = new FormData(); f.append("file", file);
    try { const res = await axios.post(`${API}/insights`, f, { headers }); setInsights(res.data); showToast("🔮 Insights generated!", "success"); }
    catch { showToast("❌ Insights failed.", "error"); }
    setInsightsLoading(false);
  };

  const handleRecommendations = async () => {
    if (!file) return; setRecsLoading(true);
    const f = new FormData(); f.append("file", file);
    try { const res = await axios.post(`${API}/recommendations`, f, { headers }); setRecommendations(res.data); showToast("💡 Recommendations ready!", "success"); }
    catch { showToast("❌ Failed.", "error"); }
    setRecsLoading(false);
  };

  const handleDataQuality = async () => {
    if (!file) return; setQualityLoading(true);
    const f = new FormData(); f.append("file", file);
    try { const res = await axios.post(`${API}/data-quality`, f, { headers }); setDataQuality(res.data); showToast("🧹 Quality analysis done!", "success"); }
    catch { showToast("❌ Failed.", "error"); }
    setQualityLoading(false);
  };

  const handlePDFReport = async () => {
    if (!file) return; setPdfLoading(true);
    const f = new FormData(); f.append("file", file);
    try {
      const res = await axios.post(`${API}/generate-report`, f, { headers: { ...headers }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a"); link.href = url;
      link.setAttribute("download", `GenBI_Report_${file.name}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      showToast("📄 PDF downloaded!", "success");
    } catch { showToast("❌ PDF failed.", "error"); }
    setPdfLoading(false);
  };

  const handleRootCause = async () => {
    if (!file) return; setRootCauseLoading(true);
    const f = new FormData(); f.append("file", file);
    try { const res = await axios.post(`${API}/root-cause`, f, { headers }); setRootCause(res.data); showToast("🔍 Root cause done!", "success"); }
    catch { showToast("❌ Failed.", "error"); }
    setRootCauseLoading(false);
  };

  const handleSQL = async () => {
    if (!file) return; setSqlLoading(true);
    const f = new FormData(); f.append("file", file); f.append("question", sqlQuestion);
    try { const res = await axios.post(`${API}/generate-sql`, f, { headers }); setSqlResult(res.data); showToast("🔷 SQL generated!", "success"); }
    catch { showToast("❌ Failed.", "error"); }
    setSqlLoading(false);
  };

  const handleConsultant = async () => {
    if (!file) return; setConsultantLoading(true);
    const f = new FormData(); f.append("file", file);
    try { const res = await axios.post(`${API}/business-consultant`, f, { headers }); setConsultant(res.data); showToast("👔 Consultation complete!", "success"); }
    catch { showToast("❌ Failed.", "error"); }
    setConsultantLoading(false);
  };

  const handleIndustry = async () => {
    if (!file) return; setIndustryLoading(true);
    const f = new FormData(); f.append("file", file);
    try {
      const res = await axios.post(`${API}/industry-intelligence`, f, { headers });
      setIndustry(res.data); setDetectedIndustry(res.data.detected_industry);
      showToast(`🏭 ${res.data.industry_display} intel ready!`, "success");
    } catch { showToast("❌ Failed.", "error"); }
    setIndustryLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx"))) {
      setFile(f); showToast(`📎 ${f.name} selected!`, "info");
    } else showToast("❌ CSV or Excel only.", "error");
  };

  const btnStyle = (color) => ({
    flex: 1, padding: "8px 10px", borderRadius: 10, fontSize: 12,
    fontWeight: 500, cursor: "pointer", border: `1px solid ${color}30`,
    background: `${color}15`, color: color, transition: "all 0.2s",
  });

  const cardStyle = (borderColor) => ({
    background: "rgba(255,255,255,0.02)",
    border: `1px solid ${borderColor || "rgba(255,255,255,0.07)"}`,
    borderRadius: 18, padding: 20, marginBottom: 12,
  });

  return (
    <div style={{
      flex: 1, padding: "24px", maxWidth: 720,
      margin: "0 auto", width: "100%", overflowY: "auto",
    }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>📁 Upload File</h2>
        <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 16px 0" }}>Upload your CSV or Excel to start analyzing</p>

        {/* Privacy */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
          borderRadius: 12, padding: "8px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 12 }}>🔒</span>
          <span style={{ color: "#22c55e", fontSize: 12 }}>Your data is encrypted and private — we never share or sell your files</span>
        </div>

        {/* Drop Zone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          animate={isDragging ? { scale: 1.01, borderColor: "#3B82F6" } : {}}
          style={{
            border: `2px dashed ${isDragging ? "#3B82F6" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 18, padding: "32px 20px", textAlign: "center",
            background: isDragging ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
            marginBottom: 12, cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>{isDragging ? "📂" : "📁"}</div>
          <p style={{ color: "#9CA3AF", fontSize: 14, margin: "0 0 4px 0" }}>
            {isDragging ? "Drop your file here!" : "Drag & drop or click to browse"}
          </p>
          <p style={{ color: "#4B5563", fontSize: 12, margin: "0 0 16px 0" }}>Supports CSV and Excel files</p>
          <input type="file" accept=".csv,.xlsx"
            onChange={(e) => { setFile(e.target.files[0]); showToast(`📎 ${e.target.files[0].name} selected!`, "info"); }}
            className="hidden" id="fileInput" />
          <label htmlFor="fileInput" style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "8px 18px", cursor: "pointer",
            color: "#9CA3AF", fontSize: 13, transition: "all 0.2s",
          }}>
            Choose File
          </label>
          {file && <p style={{ color: "#3B82F6", marginTop: 12, fontSize: 13 }}>✅ {file.name}</p>}
        </motion.div>

       {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 12, overflow: "hidden" }}
            >
              <IndustryLoader industry={detectedIndustry} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleUpload}
          disabled={!file || loading}
          whileHover={file && !loading ? { y: -2, boxShadow: "0 8px 30px rgba(59,130,246,0.4)" } : {}}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%", padding: "13px", borderRadius: 14,
            background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
            border: "1px solid rgba(125,211,252,0.25)",
            color: "white", fontSize: 14, fontWeight: 600,
            cursor: file && !loading ? "pointer" : "not-allowed",
            opacity: !file || loading ? 0.5 : 1,
            boxShadow: "0 4px 20px rgba(59,130,246,0.25)",
            transition: "all 0.2s", marginBottom: 20,
          }}
        >
          {loading ? "Uploading & Indexing..." : "Upload & Index 🚀"}
        </motion.button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* File Info */}
            <div style={cardStyle("rgba(34,197,94,0.2)")}>
              <p style={{ color: "#22c55e", fontWeight: 600, margin: "0 0 12px 0" }}>✅ File uploaded successfully!</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  ["📄 File", result.filename],
                  ["📊 Rows", result.rows],
                  ["🗂️ Columns", result.columns?.join(", ")],
                  ["🧩 Chunks", result.chunks_indexed],
                ].map(([label, value], i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 12px" }}>
                    <p style={{ color: "#6B7280", fontSize: 11, margin: "0 0 2px 0" }}>{label}</p>
                    <p style={{ color: "#E5E7EB", fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <p style={{ color: "#6B7280", fontSize: 10, margin: "0 0 4px 0" }}>File ID</p>
                <p style={{ color: "#3B82F6", fontSize: 11, fontFamily: "monospace", margin: 0, wordBreak: "break-all" }}>{result.file_id}</p>
              </div>

              {/* Action Buttons Row 1 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button onClick={() => setActiveTool("chat")} style={btnStyle("#f78166")}>💬 Chat</button>
                <button onClick={handleInsights} disabled={insightsLoading} style={btnStyle("#bc8cff")}>{insightsLoading ? "..." : "🔮 Insights"}</button>
                <button onClick={handleRecommendations} disabled={recsLoading} style={btnStyle("#58a6ff")}>{recsLoading ? "..." : "💡 Recs"}</button>
              </div>
              {/* Action Buttons Row 2 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button onClick={handleDataQuality} disabled={qualityLoading} style={btnStyle("#3fb950")}>{qualityLoading ? "..." : "🧹 Quality"}</button>
                <button onClick={handlePDFReport} disabled={pdfLoading} style={btnStyle("#ffa657")}>{pdfLoading ? "..." : "📄 PDF"}</button>
                <button onClick={handleRootCause} disabled={rootCauseLoading} style={btnStyle("#ff7b72")}>{rootCauseLoading ? "..." : "🔍 Root Cause"}</button>
              </div>
              {/* Action Buttons Row 3 */}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleConsultant} disabled={consultantLoading} style={btnStyle("#ffa657")}>{consultantLoading ? "..." : "👔 Consultant"}</button>
                <button onClick={handleIndustry} disabled={industryLoading} style={btnStyle("#bc8cff")}>{industryLoading ? "..." : "🏭 Industry"}</button>
                <button onClick={() => setActiveTool("autodashboard")} style={btnStyle("#58a6ff")}>📊 Dashboard</button>
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={cardStyle()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ color: "#E5E7EB", fontWeight: 600, margin: 0 }}>🔮 AI Data Summary</p>
                  <span style={{
                    fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
                    background: result.summary.quality_score >= 90 ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)",
                    border: `1px solid ${result.summary.quality_score >= 90 ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}`,
                    color: result.summary.quality_score >= 90 ? "#22c55e" : "#fbbf24",
                  }}>
                    Quality: {result.summary.quality_score}%
                  </span>
                </div>
                {result.summary.insights?.map((insight, i) => (
                  <p key={i} style={{ color: "#9CA3AF", fontSize: 13, background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "8px 12px", margin: "0 0 6px 0" }}>{insight}</p>
                ))}
                <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                  {Object.entries(result.summary.column_info || {}).map(([col, info]) => (
                    <div key={col} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "8px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#E5E7EB", fontSize: 12, fontWeight: 600 }}>{col}</span>
                        <span style={{ color: "#4B5563", fontSize: 11 }}>{info.type}</span>
                      </div>
                      {info.min !== undefined
                        ? <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>Min: <span style={{ color: "#3B82F6" }}>{info.min}</span> · Max: <span style={{ color: "#3B82F6" }}>{info.max}</span> · Avg: <span style={{ color: "#3B82F6" }}>{info.mean}</span></p>
                        : <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>Top: {Object.keys(info.top_values || {}).join(", ")}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights && (
              <div style={cardStyle("rgba(188,140,255,0.2)")}>
                <p style={{ color: "#bc8cff", fontWeight: 600, margin: "0 0 10px 0" }}>🔮 Executive Insights</p>
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{insights.executive_summary}</p>
              </div>
            )}

            {recommendations && (
              <div style={cardStyle("rgba(88,166,255,0.2)")}>
                <p style={{ color: "#58a6ff", fontWeight: 600, margin: "0 0 10px 0" }}>💡 AI Recommendations</p>
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{recommendations.recommendations}</p>
              </div>
            )}

            {dataQuality && (
              <div style={cardStyle("rgba(63,185,80,0.2)")}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ color: "#3fb950", fontWeight: 600, margin: 0 }}>🧹 Data Quality</p>
                  <span style={{ color: "#3fb950", fontSize: 12 }}>Score: {dataQuality.quality_score}%</span>
                </div>
                {dataQuality.issues?.map((issue, i) => (
                  <p key={i} style={{ color: "#9CA3AF", fontSize: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px", margin: "0 0 4px 0" }}>{issue}</p>
                ))}
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.6, margin: "10px 0 0 0", whiteSpace: "pre-wrap" }}>{dataQuality.ai_summary}</p>
              </div>
            )}

            {rootCause && (
              <div style={cardStyle("rgba(255,123,114,0.2)")}>
                <p style={{ color: "#ff7b72", fontWeight: 600, margin: "0 0 10px 0" }}>🔍 Root Cause Analysis</p>
                {rootCause.findings?.map((f, i) => (
                  <p key={i} style={{ color: "#9CA3AF", fontSize: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px", margin: "0 0 4px 0" }}>{f}</p>
                ))}
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.6, margin: "10px 0 0 0", whiteSpace: "pre-wrap" }}>{rootCause.ai_root_cause_analysis}</p>
              </div>
            )}

            {/* SQL Generator */}
            <div style={cardStyle("rgba(88,166,255,0.2)")}>
              <p style={{ color: "#58a6ff", fontWeight: 600, margin: "0 0 10px 0" }}>🔷 AI SQL Generator</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={sqlQuestion}
                  onChange={e => setSqlQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 13,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#E5E7EB", outline: "none", fontFamily: "Inter, sans-serif",
                  }}
                />
                <button onClick={handleSQL} disabled={sqlLoading}
                  style={{ ...btnStyle("#58a6ff"), flex: "none", padding: "8px 16px" }}>
                  {sqlLoading ? "..." : "Generate"}
                </button>
              </div>
              {sqlResult && (
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{sqlResult.ai_response}</p>
                  {sqlResult.executed_result && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ color: "#58a6ff", fontSize: 11, fontWeight: 600, margin: "0 0 4px 0" }}>⚡ Result:</p>
                      <p style={{ color: "#9CA3AF", fontSize: 11, fontFamily: "monospace", margin: 0 }}>{JSON.stringify(sqlResult.executed_result, null, 2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {consultant && (
              <div style={cardStyle("rgba(255,166,87,0.2)")}>
                <p style={{ color: "#ffa657", fontWeight: 600, margin: "0 0 10px 0" }}>👔 AI Business Consultant</p>
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{consultant.consultation}</p>
              </div>
            )}

            {industryLoading && <IndustryLoader industry={detectedIndustry} />}
            {industry && !industryLoading && (
              <div style={cardStyle("rgba(188,140,255,0.2)")}>
                <p style={{ color: "#bc8cff", fontWeight: 600, margin: "0 0 10px 0" }}>
                  🏭 {industry.industry_display} Intelligence
                  <span style={{ color: "#6B7280", fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
                    · {industry.records_analyzed} records
                  </span>
                </p>
                <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{industry.intelligence}</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── Forecast Tool ────────────────────────────────────────
function ForecastTool({ headers }) {
  const [file, setFile] = useState(null);
  const [dateCol, setDateCol] = useState("date");
  const [valueCol, setValueCol] = useState("sales");
  const [periods, setPeriods] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleForecast = async () => {
    if (!file) return; setLoading(true); setError("");
    const f = new FormData();
    f.append("file", file); f.append("date_col", dateCol);
    f.append("value_col", valueCol); f.append("periods", periods);
    try {
      const res = await axios.post(`${API}/forecast`, f, { headers });
      setResult(res.data); showToast("📈 Forecast complete!", "success");
    } catch (e) { setError(e.response?.data?.detail || "Forecast failed"); }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, padding: 24, maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <h2 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>📈 Forecasting</h2>
      <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 20px 0" }}>Predict future values with Prophet AI</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <input type="file" accept=".csv,.xlsx" onChange={e => setFile(e.target.files[0])}
          style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF", fontSize: 13 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["Date Column", dateCol, setDateCol], ["Value Column", valueCol, setValueCol]].map(([label, val, setter]) => (
            <div key={label}>
              <p style={{ color: "#6B7280", fontSize: 11, margin: "0 0 4px 0" }}>{label}</p>
              <input value={val} onChange={e => setter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#E5E7EB", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <p style={{ color: "#6B7280", fontSize: 11, margin: "0 0 4px 0" }}>Periods</p>
            <input type="number" value={periods} onChange={e => setPeriods(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#E5E7EB", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleForecast} disabled={!file || loading}
        style={{ width: "100%", padding: "13px", borderRadius: 14, background: "linear-gradient(135deg, #1e3a5f, #3B82F6)", border: "1px solid rgba(125,211,252,0.25)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 20, opacity: !file || loading ? 0.5 : 1 }}>
        {loading ? "Running Forecast..." : "Run Forecast 📈"}
      </button>
      {result && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 20 }}>
          <p style={{ color: "#22c55e", fontWeight: 600, margin: "0 0 14px 0" }}>✅ {result.periods_forecasted} periods predicted</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Date", "Predicted", "Lower", "Upper"].map(h => (
                  <th key={h} style={{ color: "#6B7280", textAlign: "left", padding: "6px 10px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.forecast?.slice(0, 10).map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ color: "#9CA3AF", padding: "7px 10px" }}>{row.ds}</td>
                  <td style={{ color: "#3B82F6", padding: "7px 10px", fontWeight: 600 }}>{Math.round(row.yhat).toLocaleString()}</td>
                  <td style={{ color: "#4B5563", padding: "7px 10px" }}>{Math.round(row.yhat_lower).toLocaleString()}</td>
                  <td style={{ color: "#4B5563", padding: "7px 10px" }}>{Math.round(row.yhat_upper).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Files Tool ───────────────────────────────────────────
function FilesTool({ headers, setFileId, setActiveTool }) {
  const [files, setFiles] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { showToast } = useToast();

  const loadFiles = async () => {
    try { const res = await axios.get(`${API}/files`, { headers }); setFiles(res.data); setLoaded(true); }
    catch { setLoaded(true); }
  };

  if (!loaded) loadFiles();

  return (
    <div style={{ flex: 1, padding: 24, maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <h2 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>🗂️ My Files</h2>
      <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 20px 0" }}>All your uploaded datasets</p>
      {files.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
          <p style={{ color: "#6B7280" }}>No files uploaded yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ color: "#E5E7EB", fontWeight: 600, fontSize: 13, margin: 0 }}>📄 {f.filename}</p>
                <button onClick={() => { setFileId(f._id); setActiveTool("chat"); showToast(`💬 Chatting with ${f.filename}`, "info"); }}
                  style={{ background: "none", border: "none", color: "#3B82F6", fontSize: 12, cursor: "pointer" }}>
                  Chat with this →
                </button>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#6B7280", fontSize: 11 }}>📊 {f.rows} rows</span>
                <span style={{ color: "#6B7280", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🗂️ {f.columns?.join(", ")}</span>
              </div>
              <p style={{ color: "#374151", fontSize: 10, fontFamily: "monospace", margin: "6px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ID: {f._id}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Tool ─────────────────────────────────────────
function HistoryTool({ headers }) {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = async () => {
    try { const res = await axios.get(`${API}/query-history`, { headers }); setHistory(res.data); setLoaded(true); }
    catch { setLoaded(true); }
  };

  if (!loaded) loadHistory();

  return (
    <div style={{ flex: 1, padding: 24, maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <h2 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>📜 Query History</h2>
      <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 20px 0" }}>Your past questions and answers</p>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
          <p style={{ color: "#6B7280" }}>No queries yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ color: "#3B82F6", fontSize: 13, fontWeight: 600, margin: "0 0 8px 0" }}>❓ {h.question}</p>
              <p style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 1.5, margin: 0,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {h.answer}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── YouTube Notes Tool ───────────────────────────────────
function YouTubeTool({ headers }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await axios.post(
        `${API}/youtube-notes?video_url=${encodeURIComponent(url)}`,
        {},
        { headers, responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", "GenBI_StudyNotes.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(true);
      showToast("🎥 Study notes PDF downloaded!", "success");
    } catch (e) {
      setError("Failed to generate notes. Make sure the video has captions enabled.");
      showToast("❌ Failed to generate notes.", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, padding: 24, maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
          🎥 YouTube → Study Notes
        </h2>
        <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 24px 0" }}>
          Paste any YouTube lecture URL and get structured PDF notes with Q&A
        </p>

        {/* Features */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8, marginBottom: 24,
        }}>
          {[
            { icon: "📚", label: "Key Concepts", desc: "Auto-extracted" },
            { icon: "❓", label: "15 Q&A", desc: "Important questions" },
            { icon: "⚡", label: "Quick Notes", desc: "Revision ready" },
          ].map((f, i) => (
            <div key={i} style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 12, padding: "12px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
              <p style={{ color: "#E5E7EB", fontSize: 12, fontWeight: 600, margin: "0 0 2px 0" }}>{f.label}</p>
              <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* URL Input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 6 }}>
            YouTube URL
          </label>
          <div style={{
            display: "flex", gap: 10, alignItems: "center",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 14, padding: "4px 4px 4px 14px",
          }}>
            <span style={{ fontSize: 18 }}>🎥</span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", color: "#E5E7EB", fontSize: 13,
                fontFamily: "Inter, sans-serif",
              }}
            />
            <motion.button
              onClick={handleGenerate}
              disabled={!url.trim() || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "10px 20px", borderRadius: 10,
                background: url.trim() ? "linear-gradient(135deg, #1e3a5f, #3B82F6)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(125,211,252,0.2)",
                color: "white", fontSize: 13, fontWeight: 600,
                cursor: url.trim() && !loading ? "pointer" : "not-allowed",
                opacity: loading ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Generating..." : "Generate PDF 📄"}
            </motion.button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 14, padding: "20px",
              textAlign: "center", marginBottom: 12,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "3px solid rgba(59,130,246,0.2)",
                borderTopColor: "#3B82F6",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "#60A5FA", fontWeight: 600, margin: "0 0 4px 0" }}>
              Generating Study Notes...
            </p>
            <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
              Fetching transcript → AI analyzing → Creating PDF (30-60 seconds)
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 12,
          }}>
            <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 12, padding: "16px",
              textAlign: "center", marginBottom: 12,
            }}
          >
            <p style={{ color: "#22c55e", fontSize: 16, fontWeight: 700, margin: "0 0 4px 0" }}>
              ✅ Study Notes Generated!
            </p>
            <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
              PDF downloaded to your computer. Check your Downloads folder!
            </p>
          </motion.div>
        )}

        {/* Tips */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "14px 16px",
        }}>
          <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600, margin: "0 0 8px 0" }}>
            💡 TIPS FOR BEST RESULTS
          </p>
          {[
            "Use videos with auto-generated or manual captions",
            "Lecture videos, tutorials, and educational content work best",
            "Videos 5-30 minutes give the most detailed notes",
            "Works with most YouTube educational channels",
          ].map((tip, i) => (
            <p key={i} style={{ color: "#6B7280", fontSize: 11, margin: "0 0 4px 0" }}>
              • {tip}
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── PDF Chat Tool ────────────────────────────────────────
function PDFChatTool() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const { showToast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload-pdf`, formData, { headers });
      setFileId(res.data.file_id);
      setSummary(res.data.summary);
      showToast("📄 PDF uploaded and indexed!", "success");
    } catch (e) {
      showToast("❌ PDF upload failed.", "error");
    }
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!question.trim() || !fileId) return;
    const userMsg = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await axios.post(`${API}/query-pdf`,
        { question: userMsg.content, file_id: fileId },
        { headers }
      );
      setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, could not query the PDF." }]);
    }
    setAsking(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700, margin: "0 0 4px 0" }}>📄 PDF Chat</h2>
        <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>Upload any PDF and ask questions about it</p>
      </div>

      {!fileId ? (
        /* Upload Section */
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                border: "2px dashed rgba(59,130,246,0.3)",
                borderRadius: 18, padding: "40px 24px",
                textAlign: "center",
                background: "rgba(59,130,246,0.04)",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <p style={{ color: "#E5E7EB", fontSize: 16, fontWeight: 600, margin: "0 0 6px 0" }}>
                Upload your PDF
              </p>
              <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 20px 0" }}>
                Research papers, reports, manuals, books — any PDF!
              </p>
              <input type="file" accept=".pdf"
                onChange={e => setFile(e.target.files[0])}
                className="hidden" id="pdfInput" />
              <label htmlFor="pdfInput" style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "8px 20px",
                cursor: "pointer", color: "#9CA3AF", fontSize: 13,
              }}>
                Choose PDF
              </label>
              {file && <p style={{ color: "#3B82F6", marginTop: 12, fontSize: 13 }}>✅ {file.name}</p>}
            </motion.div>

            <motion.button
              onClick={handleUpload}
              disabled={!file || loading}
              whileHover={file && !loading ? { y: -2 } : {}}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", padding: "13px", borderRadius: 14,
                background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
                border: "1px solid rgba(125,211,252,0.25)",
                color: "white", fontSize: 14, fontWeight: 600,
                cursor: file && !loading ? "pointer" : "not-allowed",
                opacity: !file || loading ? 0.5 : 1,
                boxShadow: "0 4px 20px rgba(59,130,246,0.25)",
              }}
            >
              {loading ? "Uploading & Indexing..." : "Upload & Start Chatting 🚀"}
            </motion.button>
          </div>
        </div>
      ) : (
        /* Chat Section */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Summary */}
          {summary && (
            <div style={{
              margin: "12px 20px", padding: "12px 16px", borderRadius: 14,
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ color: "#60A5FA", fontWeight: 600, fontSize: 13, margin: 0 }}>
                  📄 {summary.filename}
                </p>
                <span style={{ color: "#6B7280", fontSize: 11 }}>
                  {summary.pages} pages · {summary.words} words
                </span>
              </div>
              <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0, lineHeight: 1.5,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {summary.summary?.split("\n")[0]}
              </p>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "#6B7280", fontSize: 14 }}>
                  PDF indexed! Ask anything about it below 👇
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                  {[
                    "Summarize this document",
                    "What are the key findings?",
                    "List the main recommendations",
                    "What is the total revenue?",
                  ].map((q, i) => (
                    <button key={i} onClick={() => setQuestion(q)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12,
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "#60A5FA", cursor: "pointer",
                      }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}
                >
                  <div style={{
                    maxWidth: "75%", padding: "10px 14px", borderRadius: 16,
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #1e3a5f, #3B82F6)"
                      : "rgba(255,255,255,0.04)",
                    border: msg.role === "user"
                      ? "1px solid rgba(125,211,252,0.3)"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}>
                    {msg.role === "assistant" && (
                      <p style={{ color: "#3B82F6", fontSize: 11, fontWeight: 600, margin: "0 0 6px 0" }}>
                        🔮 GenBI PDF
                      </p>
                    )}
                    <p style={{ color: "#E5E7EB", fontSize: 13, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {asking && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", animation: "pulse 1s infinite" }} />
                <span style={{ color: "#6B7280", fontSize: 12 }}>Searching PDF...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(15,23,42,0.6)",
          }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 14, padding: "8px 8px 8px 16px",
            }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder="Ask anything about your PDF..."
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: "#E5E7EB", fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <motion.button
                onClick={handleAsk}
                disabled={asking || !question.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: question.trim() ? "linear-gradient(135deg, #1e3a5f, #3B82F6)" : "rgba(255,255,255,0.05)",
                  border: "none", cursor: question.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: asking ? 0.6 : 1,
                }}
              >
                <Send size={14} color={question.trim() ? "white" : "#374151"} />
              </motion.button>
            </div>
            <button
              onClick={() => { setFileId(""); setSummary(null); setMessages([]); setFile(null); }}
              style={{
                background: "none", border: "none", color: "#4B5563",
                fontSize: 11, cursor: "pointer", marginTop: 8,
              }}
            >
              ← Upload a different PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
