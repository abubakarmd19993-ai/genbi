export default function RightSidebar({ setActiveTool }) {
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
    <div className="w-[260px] min-h-screen bg-[#161b22] border-l border-[#30363d] flex flex-col overflow-y-auto">
      
      {/* AI Models */}
      <div className="p-4 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-semibold">AI Models</p>
          <button className="text-[#f78166] text-xs hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {aiModels.map((model, i) => (
            <div
              key={i}
              className="bg-[#0d0d0d] border border-[#30363d] rounded-xl p-2 flex flex-col items-center gap-1 cursor-pointer hover:border-[#f78166]/50 transition-all"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: model.color + "20" }}
              >
                {model.icon}
              </div>
              <p className="text-gray-400 text-xs text-center truncate w-full">{model.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Tools */}
      <div className="p-4 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-semibold">AI Tools</p>
          <button className="text-[#f78166] text-xs hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {aiTools.map((tool, i) => (
            <button
              key={i}
              onClick={() => setActiveTool(tool.id)}
              className="bg-[#0d0d0d] border border-[#30363d] rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-[#f78166]/50 transition-all"
            >
              <span className="text-2xl">{tool.icon}</span>
              <p className="text-gray-400 text-xs text-center">{tool.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-semibold">Integrations</p>
          <button className="text-[#f78166] text-xs hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {integrations.map((item, i) => (
            <div
              key={i}
              className="bg-[#0d0d0d] border border-[#30363d] rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-[#f78166]/50 transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-gray-400 text-xs text-center">{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Banner */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-r from-[#f78166]/20 to-[#bc8cff]/20 border border-[#f78166]/30 rounded-xl p-4">
          <p className="text-white text-sm font-semibold mb-1">⚡ Upgrade to Pro</p>
          <p className="text-gray-400 text-xs mb-3">Unlimited files, queries & forecasts</p>
          <button className="w-full bg-[#f78166] hover:bg-[#e06b52] text-white text-xs font-medium py-2 rounded-lg transition-all">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}