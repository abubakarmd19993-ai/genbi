import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConversations } from "../context/ConversationContext";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";

const quickActions = [
  { icon: "📊", text: "Analyze my data" },
  { icon: "📈", text: "Forecast sales" },
  { icon: "🔍", text: "Find anomalies" },
  { icon: "📄", text: "Generate report" },
];

const popularActions = [
  { icon: "📁", title: "Upload & Analyze", desc: "Upload CSV or Excel and get instant insights", id: "upload" },
  { icon: "💬", title: "Ask Questions", desc: "Chat with your data in plain English", id: "chat" },
  { icon: "📈", title: "Forecasting", desc: "Predict future values with Prophet AI", id: "forecast" },
  { icon: "⚙️", title: "Embedder", desc: "Convert any file to embeddings", id: "embed" },
  { icon: "🗂️", title: "My Files", desc: "View all your uploaded files", id: "files" },
  { icon: "📜", title: "History", desc: "View past queries and forecasts", id: "history" },
];

export default function Home() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { createConversation, pendingFileId, setPendingFileId } = useConversations();
  const [input, setInput] = useState("");
  const [fileId, setFileId] = useState("");
  const [fading, setFading] = useState(false);

  // Pick up a file ID handed off from the Upload/Files tool ("Start Chatting")
  useEffect(() => {
    if (pendingFileId) {
      setFileId(pendingFileId);
      setPendingFileId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToTool = (tool) => {
    if (tool === "chat") return;
    navigate(`/workspace/${tool}`);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setFading(true);
    const id = createConversation(input.trim(), fileId);
    setTimeout(() => navigate(`/workspace/${id}`), 180);
  };

  return (
    <div
      className={`min-h-screen bg-[var(--bg-app)] flex text-[var(--text-primary)] transition-opacity duration-200 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <LeftSidebar activeTool="chat" setActiveTool={goToTool} />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Hello, {username}! 👋</h1>
          <p className="text-[var(--text-secondary)] text-xl mb-8">How can I help you today?</p>

          {fileId && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2 text-green-400 text-sm">
              ✅ File loaded: {fileId.slice(0, 20)}...
            </div>
          )}

          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.text)}
                className="bg-[var(--bg-panel)] border border-[var(--border-color)] hover:border-[#f78166]/50 text-[var(--text-secondary)] text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
            {popularActions.map((action, i) => (
              <button
                key={i}
                onClick={() => goToTool(action.id)}
                className="bg-[var(--bg-panel)] border border-[var(--border-color)] hover:border-[#f78166]/50 rounded-xl p-4 text-left transition-all group"
              >
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <p className="text-[var(--text-primary)] text-sm font-medium group-hover:text-[#f78166] transition-all">
                  {action.title}
                </p>
                <p className="text-[var(--text-tertiary)] text-xs mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="mb-2">
            <input
              type="text"
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              placeholder="Paste File ID here to chat with your data..."
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-secondary)] text-xs focus:outline-none focus:border-[#f78166]/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus-within:border-[#f78166]/50 transition-all">
            <button onClick={() => goToTool("upload")} className="text-[var(--text-tertiary)] hover:text-[#f78166] transition-all text-lg" title="Upload file">
              📎
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask GenBI anything..."
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 bg-[#f78166] hover:bg-[#e06b52] disabled:opacity-30 rounded-xl flex items-center justify-center transition-all"
            >
              <span className="text-white text-sm">→</span>
            </button>
          </div>
        </div>
      </div>

      <RightSidebar setActiveTool={goToTool} />
    </div>
  );
}