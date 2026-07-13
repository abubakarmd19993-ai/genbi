import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useConversations } from "../context/ConversationContext";

export default function LeftSidebar({ activeTool, setActiveTool }) {
  const { username, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const params = useParams();
  const { conversations, currentConversationId, deleteConversation, renameConversation, selectConversation } = useConversations();

  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const KNOWN_TOOLS = ["upload", "forecast", "files", "history", "embed"];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { id: "chat", icon: "💬", label: "All Chats" },
    { id: "upload", icon: "📁", label: "Upload File" },
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "forecast", icon: "📈", label: "Forecasting" },
    { id: "history", icon: "📜", label: "History" },
    { id: "files", icon: "🗂️", label: "My Files" },
    { id: "embed", icon: "⚙️", label: "Embedder" },
  ];

  const handleNavClick = (id) => {
    setActiveTool(id);
  };

  const filteredConversations = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content?.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const activeConversationId = params.id && !KNOWN_TOOLS.includes(params.id) ? params.id : currentConversationId;

  const lastPreview = (conv) => {
    const last = conv.messages[conv.messages.length - 1];
    if (!last) return "No messages yet";
    const text = last.content || "...";
    return text.length > 40 ? text.slice(0, 40) + "..." : text;
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const startRename = (conv) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
    setMenuOpenId(null);
  };

  const confirmRename = (id) => {
    if (renameValue.trim()) renameConversation(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleDelete = (id) => {
    deleteConversation(id);
    setConfirmDeleteId(null);
    if (activeConversationId === id) navigate("/");
  };

  return (
    <div
      className={`min-h-screen bg-[var(--bg-panel)] border-r border-[var(--border-color)] flex flex-col transition-all duration-300 relative ${
        collapsed ? "w-[70px]" : "w-[260px]"
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#f78166] hover:border-[#f78166]/50 transition-all z-10 text-xs"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      <div className="p-4 border-b border-[var(--border-color)]">
        <div className={`flex items-center gap-2 mb-3 ${collapsed ? "justify-center" : ""}`}>
          <span className="text-2xl">🔮</span>
          {!collapsed && (
            <div>
              <p className="text-[var(--text-primary)] font-bold text-sm">GenBI</p>
              <p className="text-[var(--text-tertiary)] text-xs">Your AI Universe</p>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-[#f78166] hover:bg-[#e06b52] text-white text-sm font-medium py-2 rounded-xl transition-all flex items-center justify-center gap-2"
          title="New Chat"
        >
          <span>+</span> {!collapsed && "New Chat"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 bg-[var(--bg-panel-alt)] rounded-xl px-3 py-2 border border-[var(--border-color)]">
            <span className="text-[var(--text-tertiary)] text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent text-[var(--text-secondary)] text-xs outline-none w-full placeholder-[var(--text-quaternary)]"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {!collapsed && <p className="text-[var(--text-quaternary)] text-xs mb-2 px-1">{search ? "Search Results" : "Conversations"}</p>}

        {!collapsed && filteredConversations.length === 0 && (
          <p className="text-[var(--text-quaternary)] text-xs px-2 mb-3">{search ? "No matches found" : "No conversations yet"}</p>
        )}

        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            className={`relative group rounded-xl mb-1 transition-all ${
              activeConversationId === conv.id ? "bg-[#f78166]/15 border border-[#f78166]/30" : "hover:bg-[var(--bg-panel-alt)] border border-transparent"
            }`}
          >
            {renamingId === conv.id ? (
              <div className="p-2 flex gap-1">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmRename(conv.id)}
                  onBlur={() => confirmRename(conv.id)}
                  maxLength={30}
                  className="flex-1 bg-[var(--bg-app)] border border-[#f78166]/50 rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  selectConversation(conv.id);
                  navigate(`/workspace/${conv.id}`);
                }}
                className="w-full text-left px-3 py-2 text-xs"
                title={conv.title}
              >
                <p className={`truncate font-medium ${activeConversationId === conv.id ? "text-[#f78166]" : "text-[var(--text-secondary)]"}`}>
                  {collapsed ? "💬" : conv.title}
                </p>
                {!collapsed && (
                  <>
                    <p className="text-[var(--text-quaternary)] truncate mt-0.5">{lastPreview(conv)}</p>
                    <p className="text-[var(--text-quaternary)] mt-0.5">{formatTime(conv.updatedAt)}</p>
                  </>
                )}
              </button>
            )}

            {!collapsed && renamingId !== conv.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                }}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs px-1 transition-all"
                title="More"
              >
                ⋮
              </button>
            )}

            {menuOpenId === conv.id && (
              <div className="absolute right-1.5 top-7 z-20 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden text-xs w-28">
                <button onClick={() => startRename(conv)} className="w-full text-left px-3 py-2 hover:bg-[var(--bg-panel-alt)] text-[var(--text-secondary)]">
                  ✏️ Rename
                </button>
                <button
                  onClick={() => {
                    setConfirmDeleteId(conv.id);
                    setMenuOpenId(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400"
                >
                  🗑️ Delete
                </button>
              </div>
            )}

            {confirmDeleteId === conv.id && (
              <div className="absolute inset-0 bg-[var(--bg-panel)]/95 rounded-xl flex items-center justify-center gap-2 z-30 p-2">
                <span className="text-[var(--text-secondary)] text-xs">Delete this chat?</span>
                <button onClick={() => handleDelete(conv.id)} className="text-red-400 text-xs font-medium hover:underline">
                  Yes
                </button>
                <button onClick={() => setConfirmDeleteId(null)} className="text-[var(--text-tertiary)] text-xs font-medium hover:underline">
                  No
                </button>
              </div>
            )}
          </div>
        ))}

        {!collapsed && <p className="text-[var(--text-quaternary)] text-xs mb-2 px-1 mt-4">Tools</p>}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            title={item.label}
            className={`w-full ${collapsed ? "justify-center" : "text-left"} px-3 py-2.5 rounded-xl text-sm mb-1 transition-all flex items-center gap-3 ${
              activeTool === item.id
                ? "bg-[#f78166]/20 text-[#f78166] border border-[#f78166]/30"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel-alt)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--border-color)]">
        <button
          onClick={toggleTheme}
          className={`w-full mb-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-panel-alt)] transition-all ${
            collapsed ? "justify-center" : ""
          }`}
          title="Toggle theme"
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"}`}>
          <div className={`flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-[#f78166] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {username?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <p className="text-[var(--text-primary)] text-xs font-medium">{username}</p>
                <p className="text-[var(--text-tertiary)] text-xs">Free Plan</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="text-[var(--text-tertiary)] hover:text-red-400 text-xs transition-all" title="Logout">
            🚪
          </button>
        </div>
      </div>
    </div>
  );
}