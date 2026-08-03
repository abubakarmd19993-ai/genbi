import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LeftSidebar({ chats = [], activeChat, setActiveChat, activeTool, setActiveTool }) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  const navItems = [
    { id: "chat", icon: "💬", label: "All Chats" },
    { id: "upload", icon: "📁", label: "Upload File" },
    { id: "dashboard", icon: "📊", label: "My Stats" },
    { id: "autodashboard", icon: "📉", label: "Auto Dashboard" },
    { id: "forecast", icon: "📈", label: "Forecasting" },
    { id: "history", icon: "📜", label: "History" },
    { id: "files", icon: "🗂️", label: "My Files" },
    { id: "embed", icon: "⚙️", label: "Embedder" },
  ];

  return (
    <div className={`min-h-screen bg-[var(--bg-panel-solid)] border-r border-[var(--glass-border)] flex flex-col transition-all duration-300 relative ${collapsed ? "w-[70px]" : "w-[220px]"}`}>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-[var(--bg-panel-solid)] border border-[var(--glass-border)] rounded-full flex items-center justify-center text-[var(--text-mid)] hover:text-[#f78166] transition-all z-10 text-xs"
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className={`flex items-center gap-2 mb-3 ${collapsed ? "justify-center" : ""}`}>
          <span className="text-2xl">🔮</span>
          {!collapsed && (
            <div>
              <p className="text-[var(--text-hi)] font-bold text-sm">GenBI</p>
              <p className="text-[var(--text-low)] text-xs">Your AI Universe</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setActiveTool("chat")}
          className="w-full bg-[#f78166] hover:bg-[#e06b52] text-[var(--text-hi)] text-sm font-medium py-2 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span>+</span> {!collapsed && "New Chat"}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2 bg-[var(--bg-void)] rounded-xl px-3 py-2 border border-[var(--glass-border)]">
            <span className="text-[var(--text-low)] text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search chats..."
              className="bg-transparent text-[var(--text-mid)] text-xs outline-none w-full placeholder-[var(--text-low)]"
            />
          </div>
        </div>
      )}

      {/* Chat History + Nav */}
      <div className="flex-1 overflow-y-auto p-3">
        {!collapsed && chats.length > 0 && (
          <div className="mb-4">
            <p className="text-[var(--text-low)] text-xs mb-2 px-1">Today</p>
            {chats.map((chat, i) => (
              <button
                key={i}
                onClick={() => setActiveChat && setActiveChat(chat)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs mb-1 transition-all ${
                  activeChat === chat
                    ? "bg-[#f78166]/20 text-[#f78166]"
                    : "text-[var(--text-mid)] hover:bg-[var(--bg-void)]"
                }`}
              >
                <p className="truncate">{chat.question}</p>
                <p className="text-[var(--text-low)] text-xs mt-0.5">{chat.time}</p>
              </button>
            ))}
          </div>
        )}

        {!collapsed && <p className="text-[var(--text-low)] text-xs mb-2 px-1">Tools</p>}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTool(item.id)}
            title={item.label}
            className={`w-full px-3 py-2.5 rounded-xl text-sm mb-1 transition-all flex items-center gap-3 ${
              collapsed ? "justify-center" : "text-left"
            } ${
              activeTool === item.id
                ? "bg-[#f78166]/20 text-[#f78166] border border-[#f78166]/30"
                : "text-[var(--text-mid)] hover:bg-[var(--bg-void)] hover:text-[var(--text-hi)]"
            }`}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>

      {/* User Profile + Theme Toggle */}
      <div className="p-3 border-t border-[var(--glass-border)]">
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f78166] flex items-center justify-center text-[var(--text-hi)] font-bold text-sm shrink-0">
              {username?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <p className="text-[var(--text-hi)] text-xs font-medium">{username}</p>
                <p className="text-[var(--text-low)] text-xs">Free Plan</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="text-[var(--text-low)] hover:text-yellow-400 text-xs transition-all"
              title="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className="text-[var(--text-low)] hover:text-red-400 text-xs transition-all"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
