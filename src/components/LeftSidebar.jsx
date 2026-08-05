import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Upload, LayoutDashboard, TrendingUp, History,
  FolderOpen, Brain, BarChart3, MessageSquare, Sparkles,
  Sun, Moon, LogOut, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { id: "chat", icon: Bot, label: "AI Chat", desc: "Ask questions about your data", badge: null },
  { id: "upload", icon: Upload, label: "Upload Data", desc: "Import CSV or Excel files", badge: null },
  { id: "dashboard", icon: LayoutDashboard, label: "My Stats", desc: "View your activity stats", badge: null },
  { id: "autodashboard", icon: BarChart3, label: "Auto Dashboard", desc: "Generate dashboards instantly", badge: "New" },
  { id: "forecast", icon: TrendingUp, label: "Forecasting", desc: "Predict future trends", badge: "●" },
  { id: "history", icon: History, label: "History", desc: "View past queries", badge: null },
  { id: "files", icon: FolderOpen, label: "My Files", desc: "Manage uploaded files", badge: null },
  { id: "embed", icon: Brain, label: "Embedder", desc: "Convert files to embeddings", badge: null },
];

// ── Floating Particles near logo ──────────────────────────
function LogoParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * 60 - 30,
    delay: i * 0.4,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: "#7DD3FC",
            left: "50%", top: "50%",
            x: p.x, y: p.y,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
            x: [p.x, p.x + (Math.random() * 20 - 10)],
            y: [p.y, p.y - 20],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

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
          className="absolute left-full ml-3 z-50 pointer-events-none"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          <div style={{
            background: "rgba(15,23,42,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 12,
            padding: "8px 12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(125,211,252,0.1)",
            whiteSpace: "nowrap",
          }}>
            <p style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, margin: 0 }}>{text}</p>
            {desc && <p style={{ color: "#9CA3AF", fontSize: 10, margin: "2px 0 0 0" }}>{desc}</p>}
            {/* Arrow */}
            <div style={{
              position: "absolute", left: -5, top: "50%",
              transform: "translateY(-50%)",
              width: 8, height: 8,
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRight: "none", borderTop: "none",
              rotate: "45deg",
            }} />
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
    <div className="relative" style={{ marginBottom: 2 }}>
      <motion.button
        onClick={handleClick}
        onHoverStart={() => { setHovered(true); if (collapsed) setShowTooltip(true); }}
        onHoverEnd={() => { setHovered(false); setShowTooltip(false); }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px" : "9px 12px",
          borderRadius: 12,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          background: isActive
            ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(125,211,252,0.1))"
            : hovered
            ? "rgba(59,130,246,0.08)"
            : "transparent",
          border: isActive
            ? "1px solid rgba(59,130,246,0.4)"
            : "1px solid transparent",
          boxShadow: isActive
            ? "0 4px 20px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "none",
          transition: "background 0.2s, border 0.2s, box-shadow 0.2s",
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

        {/* Ripple */}
        {ripples.map(r => (
          <motion.div
            key={r.id}
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
        <motion.div
          animate={isActive ? { rotate: [0, 5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Icon
            size={17}
            style={{
              color: isActive ? "#7DD3FC" : hovered ? "#60A5FA" : "#9CA3AF",
              transition: "color 0.2s",
              flexShrink: 0,
            }}
          />
        </motion.div>

        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#FFFFFF" : hovered ? "#E5E7EB" : "#9CA3AF",
                transition: "color 0.2s",
                flex: 1,
                textAlign: "left",
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
              fontSize: item.badge === "●" ? 8 : 10,
              padding: item.badge === "●" ? 0 : "1px 6px",
              borderRadius: 20,
              background: item.badge === "New"
                ? "rgba(59,130,246,0.2)"
                : "transparent",
              border: item.badge === "New"
                ? "1px solid rgba(59,130,246,0.4)"
                : "none",
              color: item.badge === "●" ? "#3B82F6" : "#60A5FA",
              fontWeight: 600,
            }}
          >
            {item.badge}
          </motion.span>
        )}
      </motion.button>

      {/* Tooltip */}
      <Tooltip text={item.label} desc={item.desc} visible={showTooltip} />
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────
export default function LeftSidebar({ chats, activeChat, setActiveChat, activeTool, setActiveTool }) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mouseY, setMouseY] = useState(0);
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
    <motion.div
      ref={sidebarRef}
      animate={{ width: collapsed ? 70 : 240 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{
        minHeight: "100vh",
        background: "rgba(15,23,42,0.75)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Dynamic mouse glow */}
      <div style={{
        position: "absolute", pointerEvents: "none", zIndex: 0,
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        top: `${mouseY - 15}%`, left: -100,
        transition: "top 0.5s ease",
      }} />

      {/* Aurora */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <motion.div
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", width: 250, height: 250, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
            top: -80, left: -80,
          }}
        />
        <motion.div
          animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(125,211,252,0.06) 0%, transparent 70%)",
            bottom: -60, right: -60,
          }}
        />
      </div>

      {/* Collapse button */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "absolute", right: -12, top: 32,
          width: 24, height: 24, borderRadius: "50%",
          background: "#0B1120",
          border: "1px solid rgba(59,130,246,0.4)",
          color: "#3B82F6", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 20, boxShadow: "0 0 12px rgba(59,130,246,0.3)",
        }}
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft size={12} />}
      </motion.button>

      {/* Logo Section */}
      <div style={{
        padding: "20px 14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          {/* Orb */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", inset: -3, borderRadius: "50%",
                background: "conic-gradient(from 0deg, #3B82F6, #7DD3FC, #60A5FA, #3B82F6)",
                padding: 1,
              }}
            >
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#0B1120" }} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(125,211,252,0.2))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, position: "relative", zIndex: 1,
                boxShadow: "0 0 20px rgba(59,130,246,0.3)",
              }}
            >
              🔮
            </motion.div>
            <LogoParticles />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.p
                  style={{
                    margin: 0, fontWeight: 800, fontSize: 15,
                    background: "linear-gradient(135deg, #FFFFFF, #60A5FA, #7DD3FC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.02em",
                  }}
                >
                  GenBI AI
                </motion.p>
                <p style={{
                  margin: 0, fontSize: 9, color: "#4B5563",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  AI Business Intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Ready badge */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: 12, paddingLeft: 2,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
              />
              <span style={{ color: "#22c55e", fontSize: 10, fontWeight: 600 }}>AI Ready</span>
              <span style={{ color: "#374151", fontSize: 10, marginLeft: 4 }}>· llama3.2</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Chat button */}
        <motion.button
          onClick={() => setActiveTool("chat")}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #1e3a5f, #3B82F6, #2563eb)",
            border: "1px solid rgba(125,211,252,0.3)",
            borderRadius: 12, padding: "9px 12px",
            color: "white", fontSize: 13, fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "center",
            gap: 6,
            boxShadow: "0 4px 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <Sparkles size={14} />
          {!collapsed && <span>New Chat</span>}
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
              <span style={{ color: "#4B5563", fontSize: 12 }}>🔍</span>
              <input
                placeholder="Search..."
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "#D1D5DB", fontSize: 12, width: "100%",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <kbd style={{
                fontSize: 9, padding: "2px 5px", borderRadius: 4,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#4B5563",
              }}>⌘K</kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px", position: "relative", zIndex: 1 }}>
        {!collapsed && chats?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: "#374151", fontSize: 9, padding: "4px 8px", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>Recent</p>
            {chats.slice(0, 3).map((chat, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveChat(chat)}
                whileHover={{ x: 2 }}
                style={{
                  width: "100%", textAlign: "left", padding: "7px 10px",
                  borderRadius: 8, marginBottom: 1, cursor: "pointer",
                  background: activeChat === chat ? "rgba(59,130,246,0.1)" : "transparent",
                  border: "1px solid transparent",
                  color: activeChat === chat ? "#60A5FA" : "#6B7280",
                  fontSize: 11,
                }}
              >
                <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  💬 {chat.question}
                </p>
              </motion.button>
            ))}
          </div>
        )}

        {!collapsed && (
          <p style={{ color: "#374151", fontSize: 9, padding: "4px 8px", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 4px 0" }}>
            Navigation
          </p>
        )}

        {NAV_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NavButton
              item={item}
              isActive={activeTool === item.id}
              collapsed={collapsed}
              onClick={() => setActiveTool(item.id)}
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
        {/* Theme */}
        <motion.button
          onClick={() => setIsDark(!isDark)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px" }}>
          <motion.div
            animate={{ boxShadow: ["0 0 8px rgba(59,130,246,0.3)", "0 0 16px rgba(59,130,246,0.5)", "0 0 8px rgba(59,130,246,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 13,
              border: "1px solid rgba(125,211,252,0.3)",
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
                  <p style={{ color: "#4B5563", fontSize: 10, margin: 0 }}>Free Plan</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Logout"
            style={{
              background: "none", border: "none",
              color: "#4B5563", cursor: "pointer",
              padding: 6, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#4B5563"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}