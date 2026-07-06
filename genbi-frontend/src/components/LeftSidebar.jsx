import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LeftSidebar({ chats, activeChat, setActiveChat, activeTool, setActiveTool }) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { id: "chat", icon: "💬", label: "All Chats" },
    { id: "upload", icon: "📁", label: "Upload File" },
    { id: "forecast", icon: "📈", label: "Forecasting" },
    { id: "history", icon: "📜", label: "History" },
    { id: "files", icon: "🗂️", label: "My Files" },
    { id: "embed", icon: "⚙️", label: "Embedder" },
  ];

  return (
    <div className="w-[220px] min-h-screen bg-[#161b22] border-r border-[#30363d] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[#30363d]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔮</span>
          <div>
            <p className="text-white font-bold text-sm">GenBI</p>
            <p className="text-gray-500 text-xs">Your AI Universe</p>
          </div>
        </div>
        {/* New Chat Button */}
        <button
          onClick={() => setActiveTool("chat")}
          className="w-full bg-[#f78166] hover:bg-[#e06b52] text-white text-sm font-medium py-2 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span>+</span> New Chat
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#30363d]">
        <div className="flex items-center gap-2 bg-[#0d0d0d] rounded-xl px-3 py-2 border border-[#30363d]">
          <span className="text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search chats..."
            className="bg-transparent text-gray-400 text-xs outline-none w-full placeholder-gray-600"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-3">
        {chats.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-600 text-xs mb-2 px-1">Today</p>
            {chats.map((chat, i) => (
              <button
                key={i}
                onClick={() => setActiveChat(chat)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs mb-1 transition-all ${
                  activeChat === chat
                    ? "bg-[#f78166]/20 text-[#f78166]"
                    : "text-gray-400 hover:bg-[#0d0d0d]"
                }`}
              >
                <p className="truncate">{chat.question}</p>
                <p className="text-gray-600 text-xs mt-0.5">{chat.time}</p>
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <p className="text-gray-600 text-xs mb-2 px-1">Tools</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTool(item.id)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1 transition-all flex items-center gap-3 ${
              activeTool === item.id
                ? "bg-[#f78166]/20 text-[#f78166] border border-[#f78166]/30"
                : "text-gray-400 hover:bg-[#0d0d0d] hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-[#30363d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f78166] flex items-center justify-center text-white font-bold text-sm">
              {username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white text-xs font-medium">{username}</p>
              <p className="text-gray-500 text-xs">Free Plan</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 text-xs transition-all"
          >
            🚪
          </button>
        </div>
      </div>
    </div>
  );
}