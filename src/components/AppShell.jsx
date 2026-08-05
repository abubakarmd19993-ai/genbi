import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Upload, LayoutDashboard, TrendingUp, History,
  FolderOpen, Brain, BarChart3, Sparkles, Sun, Moon,
  LogOut, ChevronLeft, ChevronRight, Zap, Search, Bell, FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "chat", icon: Bot, label: "AI Chat", desc: "Ask questions about your data", badge: null },
  { id: "upload", icon: Upload, label: "Upload Data", desc: "Import CSV or Excel files", badge: null },
  { id: "dashboard", icon: LayoutDashboard, label: "My Stats", desc: "View your activity", badge: null },
  { id: "youtube", icon: Brain, label: "YouTube Notes", desc: "YouTube → Study PDF", badge: "New" },
  { id: "autodashboard", icon: BarChart3, label: "Auto Dashboard", desc: "Generate dashboards instantly", badge: "New" },
  { id: "forecast", icon: TrendingUp, label: "Forecasting", desc: "Predict future trends", badge: "●" },
  { id: "pdfchat", icon: FileText, label: "PDF Chat", desc: "Chat with any PDF", badge: "New" },
  { id: "history", icon: History, label: "History", desc: "View past queries", badge: null },
  { id: "files", icon: FolderOpen, label: "My Files", desc: "Manage uploaded files", badge: null },
  { id: "embed", icon: Brain, label: "Embedder", desc: "Convert files to embeddings", badge: null },
];

// ── Tooltip ───────────────────────────────────────────────
function Tooltip({ text, desc, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -8, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute", left: "calc(100% + 12px)",
            top: "50%", transform: "translateY(-50%)",
            zIndex: 50, pointerEvents: "none", whiteSpace: "nowrap",
          }}
        >
          <div style={{
            background: "rgba(15,23,42,0.98)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 12, padding: "8px 12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}>
            <p style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, margin: 0 }}>{text}</p>
            {desc && <p style={{ color: "#9CA3AF", fontSize: 10, margin: "2px 0 0 0" }}>{desc}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Nav Button ────────────────────────────────────────────
function NavButton({ item, isActive, collapsed, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [ripples, setRipples] = useState([]);
  const Icon = item.icon;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick();
  };

  return (
    <div style={{ position: "relative", marginBottom: 2 }}>
      <motion.button
        onClick={handleClick}
        onHoverStart={() => { setHovered(true); if (collapsed) setShowTooltip(true); }}
        onHoverEnd={() => { setHovered(false); setShowTooltip(false); }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          width: "100%",
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px" : "9px 12px",
          borderRadius: 12, cursor: "pointer",
          position: "relative", overflow: "hidden",
          background: isActive
            ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(125,211,252,0.08))"
            : hovered ? "rgba(59,130,246,0.06)" : "transparent",
          border: isActive
            ? "1px solid rgba(59,130,246,0.35)"
            : "1px solid transparent",
          boxShadow: isActive ? "0 4px 20px rgba(59,130,246,0.15)" : "none",
        }}
      >
        {/* Active left bar */}
        {isActive && (
          <motion.div
            layoutId="active-bar"
            style={{
              position: "absolute", left: 0, top: "20%", bottom: "20%",
              width: 3, borderRadius: 3,
              background: "linear-gradient(180deg, #7DD3FC, #3B82F6)",
              boxShadow: "0 0 8px #3B82F6",
            }}
          />
        )}

        {/* Ripples */}
        {ripples.map(r => (
          <motion.div key={r.id}
            style={{
              position: "absolute", left: r.x, top: r.y,
              width: 4, height: 4, borderRadius: "50%",
              background: "rgba(125,211,252,0.5)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
            animate={{ scale: [0, 12], opacity: [0.5, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

        {/* Icon */}
        <Icon size={17} style={{
          color: isActive ? "#7DD3FC" : hovered ? "#60A5FA" : "#6B7280",
          transition: "color 0.2s", flexShrink: 0,
        }} />

        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                fontSize: 13, flex: 1, textAlign: "left",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#FFFFFF" : hovered ? "#E5E7EB" : "#9CA3AF",
                transition: "color 0.2s",
              }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {!collapsed && item.badge && (
          <motion.span
            animate={item.badge === "●" ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              fontSize: item.badge === "●" ? 8 : 9,
              padding: item.badge === "New" ? "1px 6px" : 0,
              borderRadius: 20,
              background: item.badge === "New" ? "rgba(59,130,246,0.2)" : "transparent",
              border: item.badge === "New" ? "1px solid rgba(59,130,246,0.4)" : "none",
              color: "#60A5FA", fontWeight: 600,
            }}
          >
            {item.badge}
          </motion.span>
        )}
      </motion.button>
      <Tooltip text={item.label} desc={item.desc} visible={showTooltip} />
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────
export default function AppShell({ children, activeTool, onNavigate }) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mouseY, setMouseY] = useState(50);
  const sidebarRef = useRef(null);

  const handleLogout = () => { logout(); navigate("/login"); };

  useEffect(() => {
    const handleMouse = (e) => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        setMouseY(((e.clientY - rect.top) / rect.height) * 100);
      }
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #020617 0%, #0B1120 45%, #111827 100%)",
    }}>
      {/* ── Sidebar ── */}
      <motion.aside
        ref={sidebarRef}
        animate={{ width: collapsed ? 70 : 240 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{
          minHeight: "100vh", flexShrink: 0,
          background: "rgba(15,23,42,0.8)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Mouse glow */}
        <div style={{
          position: "absolute", pointerEvents: "none", zIndex: 0,
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          top: `${mouseY - 15}%`, left: -80,
          transition: "top 0.6s ease",
        }} />

        {/* Aurora */}
        <motion.div
          animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)",
            top: -60, left: -60, pointerEvents: "none", zIndex: 0,
          }}
        />

        {/* Collapse button */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: "absolute", right: -12, top: 32,
            width: 24, height: 24, borderRadius: "50%",
            background: "#0B1120",
            border: "1px solid rgba(59,130,246,0.4)",
            color: "#3B82F6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 20, boxShadow: "0 0 12px rgba(59,130,246,0.25)",
          }}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </motion.button>

        {/* Logo */}
        <div style={{
          padding: "20px 14px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            {/* Spinning orb */}
            <div style={{ position: "relative", flexShrink: 0, width: 36, height: 36 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", inset: -2, borderRadius: "50%",
                  background: "conic-gradient(from 0deg, #3B82F6, #7DD3FC, transparent, #3B82F6)",
                }}
              />
              <div style={{
                position: "absolute", inset: 1, borderRadius: "50%",
                background: "#0B1120",
              }} />
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, zIndex: 1,
                }}
              >
                🔮
              </motion.div>
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                >
                  <p style={{
                    margin: 0, fontWeight: 800, fontSize: 15,
                    background: "linear-gradient(135deg, #FFFFFF 0%, #60A5FA 60%, #7DD3FC 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    GenBI AI
                  </p>
                  <p style={{
                    margin: 0, fontSize: 9, color: "#374151",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>
                    AI Business Intelligence
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Ready */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, paddingLeft: 2 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
                />
                <span style={{ color: "#22c55e", fontSize: 10, fontWeight: 600 }}>AI Ready</span>
                <span style={{ color: "#374151", fontSize: 10 }}>· llama3.2</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New Chat */}
          <motion.button
            onClick={() => onNavigate("chat")}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
              border: "1px solid rgba(125,211,252,0.25)",
              borderRadius: 12, padding: "9px 12px",
              color: "white", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
              boxShadow: "0 4px 20px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <Sparkles size={14} />
            {!collapsed && "New Chat"}
          </motion.button>
        </div>

        {/* Search */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", position: "relative", zIndex: 1 }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10, padding: "7px 12px",
              }}>
                <Search size={12} color="#4B5563" />
                <input placeholder="Search..." style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "#D1D5DB", fontSize: 12, width: "100%",
                  fontFamily: "Inter, sans-serif",
                }} />
                <kbd style={{
                  fontSize: 9, padding: "2px 5px", borderRadius: 4,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#374151",
                }}>⌘K</kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px", position: "relative", zIndex: 1 }}>
          {!collapsed && (
            <p style={{ color: "#374151", fontSize: 9, padding: "4px 8px 6px", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
              Navigation
            </p>
          )}
          {NAV_ITEMS.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <NavButton
                item={item}
                isActive={activeTool === item.id}
                collapsed={collapsed}
                onClick={() => onNavigate(item.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          position: "relative", zIndex: 1,
        }}>
          <motion.button
            onClick={() => setIsDark(!isDark)}
            whileHover={{ scale: 1.02 }}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: 8, padding: "7px 10px", borderRadius: 10,
              background: "transparent", border: "1px solid transparent",
              color: "#6B7280", fontSize: 12, cursor: "pointer",
              marginBottom: 8,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </motion.button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
            <motion.div
              animate={{ boxShadow: ["0 0 8px rgba(59,130,246,0.3)", "0 0 16px rgba(59,130,246,0.5)", "0 0 8px rgba(59,130,246,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 13,
                border: "1px solid rgba(125,211,252,0.25)",
              }}
            >
              {username?.[0]?.toUpperCase()}
            </motion.div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <p style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {username}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={9} color="#3B82F6" />
                    <p style={{ color: "#374151", fontSize: 10, margin: 0 }}>Free Plan</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: "none", border: "none",
                color: "#4B5563", cursor: "pointer",
                padding: 6, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#4B5563"; e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={14} />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 20px",
          background: "rgba(15,23,42,0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: "7px 14px",
            maxWidth: 360, flex: 1,
          }}>
            <Search size={13} color="#4B5563" />
            <input
              placeholder="Search datasets, chats, reports..."
              style={{
                background: "transparent", border: "none", outline: "none",
                color: "#D1D5DB", fontSize: 13, width: "100%",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              style={{
                position: "relative", padding: 8, borderRadius: 8,
                background: "transparent", border: "none", cursor: "pointer",
                color: "#6B7280",
              }}
            >
              <Bell size={16} />
              <div style={{
                position: "absolute", top: 6, right: 6,
                width: 6, height: 6, borderRadius: "50%",
                background: "#3B82F6",
                boxShadow: "0 0 6px #3B82F6",
              }} />
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ height: "100%" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating AI button */}
      <motion.button
        onClick={() => onNavigate("chat")}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ["0 8px 30px rgba(59,130,246,0.3)", "0 8px 40px rgba(59,130,246,0.5)", "0 8px 30px rgba(59,130,246,0.3)"] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: 16,
          background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
          border: "1px solid rgba(125,211,252,0.3)",
          cursor: "pointer", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Sparkles size={20} color="white" />
      </motion.button>
    </div>
  );
}
