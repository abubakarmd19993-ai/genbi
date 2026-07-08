import { useState } from "react";

export default function RightSidebar({ setActiveTool }) {
  const [collapsed, setCollapsed] = useState(false);

  const aiModels = [
    { name: "GPT-4o", icon: "⚡", color: "#10a37f" },
    { name: "Claude 3.5", icon: "🤖", color: "#cc785c" },
    { name: "Gemini 1.5", icon: "✨", color: "#4285f4" },
    { name: "Llama 3.2", icon: "🦙", color: "#f78166" },
    { name: "Mistral", icon: "🌊", color: "#bc8cff" },
    { name: "DeepSeek", icon: "🔍", color: "#58a6ff" },
  ];

  const aiTools = [
    { name: "Data Analysis", icon: "📊", id: "chat" },
    { name: "Forecasting", icon: "📈", id: "forecast" },
    { name: "Embedder", icon: "⚙️", id: "embed" },
    { name: "My Files", icon: "🗂️", id: "files" },
  ];

  const integrations = [
    { name: "MongoDB", icon: "🍃" },
    { name: "ChromaDB", icon: "🔮" },
    { name: "Ollama", icon: "🦙" },
    { name: "Prophet", icon: "📈" },
  ];

  return (
    <div
      className={`min-h-screen bg-[var(--bg-panel)] border-l border-[var(--border-color)] flex flex-col overflow-y-auto transition-all duration-300 relative ${
        collapsed ? "w-[70px]" : "w-[260px]"
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-6 w-6 h-6 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#f78166] hover:border-[#f78166]/50 transition-all z-10 text-xs"
        title={collapsed ? "Expand panel" : "Collapse panel"}
      >
        {collapsed ? "◀" : "▶"}
      </button>

      <div className="p-4 border-b border-[var(--border-color)]">
        {!collapsed ? (
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--text-primary)] text-sm font-semibold">AI Models</p>
            <button className="text-[#f78166] text-xs hover:underline">View all</button>
          </div>
        ) : (
          <p className="text-[var(--text-tertiary)] text-xs text-center mb-3">🤖</p>
        )}
        <div className={collapsed ? "flex flex-col gap-2 items-center" : "grid grid-cols-3 gap-2"}>
          {aiModels.map((model, i) => (
            <div
              key={i}
              title={model.name}
              className="bg-[var(--bg-panel-alt)] border border-[var(--border-color)] rounded-xl p-2 flex flex-col items-center gap-1 cursor-pointer hover:border-[#f78166]/50 transition-all"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: model.color + "20" }}
              >
                {model.icon}
              </div>
              {!collapsed && (
                <p className="text-[var(--text-secondary)] text-xs text-center truncate w-full">{model.name}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-[var(--border-color)]">
        {!collapsed ? (
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--text-primary)] text-sm font-semibold">AI Tools</p>
            <button className="text-[#f78166] text-xs hover:underline">View all</button>
          </div>
        ) : (
          <p className="text-[var(--text-tertiary)] text-xs text-center mb-3">🛠️</p>
        )}
        <div className={collapsed ? "flex flex-col gap-2 items-center" : "grid grid-cols-2 gap-2"}>
          {aiTools.map((tool, i) => (
            <button
              key={i}
              onClick={() => setActiveTool(tool.id)}
              title={tool.name}
              className="bg-[var(--bg-panel-alt)] border border-[var(--border-color)] rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-[#f78166]/50 transition-all"
            >
              <span className="text-2xl">{tool.icon}</span>
              {!collapsed && <p className="text-[var(--text-secondary)] text-xs text-center">{tool.name}</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {!collapsed ? (
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--text-primary)] text-sm font-semibold">Integrations</p>
            <button className="text-[#f78166] text-xs hover:underline">View all</button>
          </div>
        ) : (
          <p className="text-[var(--text-tertiary)] text-xs text-center mb-3">🔌</p>
        )}
        <div className={collapsed ? "flex flex-col gap-2 items-center" : "grid grid-cols-2 gap-2"}>
          {integrations.map((item, i) => (
            <div
              key={i}
              title={item.name}
              className="bg-[var(--bg-panel-alt)] border border-[var(--border-color)] rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-[#f78166]/50 transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              {!collapsed && <p className="text-[var(--text-secondary)] text-xs text-center">{item.name}</p>}
            </div>
          ))}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-r from-[#f78166]/20 to-[#bc8cff]/20 border border-[#f78166]/30 rounded-xl p-4">
            <p className="text-[var(--text-primary)] text-sm font-semibold mb-1">⚡ Upgrade to Pro</p>
            <p className="text-[var(--text-secondary)] text-xs mb-3">Unlimited files, queries & forecasts</p>
            <button className="w-full bg-[#f78166] hover:bg-[#e06b52] text-white text-xs font-medium py-2 rounded-lg transition-all">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="p-2 mt-auto flex justify-center">
          <button
            className="w-10 h-10 bg-gradient-to-r from-[#f78166]/20 to-[#bc8cff]/20 border border-[#f78166]/30 rounded-xl flex items-center justify-center"
            title="Upgrade to Pro"
          >
            ⚡
          </button>
        </div>
      )}
    </div>
  );
}