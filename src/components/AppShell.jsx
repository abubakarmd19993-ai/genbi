import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles, Upload, LayoutDashboard, TrendingUp, History,
  FolderOpen, Settings2, ChevronLeft, ChevronRight, Search,
  Bell, Sun, Moon, LogOut, BarChart3
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { id: "chat", icon: Sparkles, label: "AI Chat", path: "/" },
  { id: "upload", icon: Upload, label: "Upload Data" },
  { id: "dashboard", icon: LayoutDashboard, label: "My Stats" },
  { id: "autodashboard", icon: BarChart3, label: "Auto Dashboard" },
  { id: "forecast", icon: TrendingUp, label: "Forecasting" },
  { id: "history", icon: History, label: "History" },
  { id: "files", icon: FolderOpen, label: "My Files" },
  { id: "embed", icon: Settings2, label: "Embedder" },
];

export default function AppShell({ children, activeTool, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const { username, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-void)" }}>
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="relative flex flex-col glass-panel border-r"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="aurora-bg" />

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 w-6 h-6 rounded-full flex items-center justify-center z-20 transition-all glass-panel hover:scale-110"
          style={{ color: "var(--text-mid)" }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <div className="relative z-10 p-5 flex items-center gap-3">
          <img src="/logo/genbi-icon.png" alt="GenBI" className="w-9 h-9 object-contain shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
              >
                <p className="font-display font-semibold text-sm" style={{ color: "var(--text-hi)" }}>GenBI AI</p>
                <p className="text-[10px] tracking-wider" style={{ color: "var(--text-low)" }}>DATA · INTELLIGENCE · GROWTH</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="relative z-10 flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path ? location.pathname === "/" : activeTool === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => (item.path ? navigate(item.path) : onNavigate(item.id))}
                title={collapsed ? item.label : undefined}
                className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors group"
                style={{ color: isActive ? "var(--text-hi)" : "var(--text-mid)" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "var(--glass-strong)", border: "1px solid var(--glass-border)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={17} className="relative z-10 shrink-0" style={{ color: isActive ? "var(--accent-flame)" : "inherit" }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        <div className="relative z-10 p-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm mb-1 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-mid)" }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <div className="flex items-center gap-2 px-2 pt-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent-signal), var(--accent-data))" }}
            >
              {username?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-hi)" }}>{username}</p>
                <p className="text-[10px]" style={{ color: "var(--text-low)" }}>Free Plan</p>
              </div>
            )}
            <button onClick={handleLogout} style={{ color: "var(--text-low)" }} className="hover:text-red-400 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="glass-panel h-14 flex items-center justify-between px-5 border-b shrink-0"
          style={{ borderColor: "var(--glass-border)" }}
        >
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg"
              style={{ background: "var(--glass)", border: "1px solid var(--glass-border)" }}
            >
              <Search size={14} style={{ color: "var(--text-low)" }} />
              <input
                placeholder="Search datasets, chats, reports..."
                className="bg-transparent outline-none text-sm flex-1"
                style={{ color: "var(--text-hi)" }}
              />
              <kbd
                className="font-mono text-[10px] px-1.5 py-0.5 rounded hidden sm:block"
                style={{ background: "var(--glass-strong)", color: "var(--text-low)" }}
              >
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-mid)" }}>
              <Bell size={17} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent-flame)" }}
              />
            </button>
          </div>
        </header>

        {/* Animated content area */}
        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool || location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating AI assistant */}
      <button
        onClick={() => onNavigate("chat")}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-50 hover:scale-105 transition-transform"
        style={{ background: "linear-gradient(135deg, var(--accent-flame), var(--accent-signal))" }}
        title="Ask GenBI"
      >
        <Sparkles size={22} className="text-white" />
      </button>
    </div>
  );
}