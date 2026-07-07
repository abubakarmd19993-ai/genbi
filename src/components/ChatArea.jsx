import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function ChatArea({ activeTool, setActiveTool, setChats, setActiveChat }) {
  const { username, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

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

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!fileId) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Please upload a file first and enter the File ID to ask questions about your data."
      }]);
      return;
    }

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/query`,
        { question: input, file_id: fileId },
        { headers }
      );
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.answer
      }]);
      setChats(prev => [...prev, {
        question: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
    }
    setLoading(false);
  };

  // Show Upload Tool
  if (activeTool === "upload") {
    return <UploadTool headers={headers} setFileId={setFileId} setActiveTool={setActiveTool} />;
  }

  // Show Forecast Tool
  if (activeTool === "forecast") {
    return <ForecastTool headers={headers} />;
  }

  // Show Files Tool
  if (activeTool === "files") {
    return <FilesTool headers={headers} setFileId={setFileId} setActiveTool={setActiveTool} />;
  }

  // Show History Tool
  if (activeTool === "history") {
    return <HistoryTool headers={headers} />;
  }

  // Main Chat View
  return (
    <div className="flex-1 flex flex-col">
      {messages.length === 0 ? (
        // Welcome Screen
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Hello, {username}! 👋
          </h1>
          <p className="text-gray-400 text-xl mb-8">How can I help you today?</p>

          {/* File ID Input */}
          {fileId && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2 text-green-400 text-sm">
              ✅ File loaded: {fileId.slice(0, 20)}...
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.text)}
                className="bg-[#161b22] border border-[#30363d] hover:border-[#f78166]/50 text-gray-300 text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>

          {/* Popular Actions */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
            {popularActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setActiveTool(action.id)}
                className="bg-[#161b22] border border-[#30363d] hover:border-[#f78166]/50 rounded-xl p-4 text-left transition-all group"
              >
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <p className="text-white text-sm font-medium group-hover:text-[#f78166] transition-all">
                  {action.title}
                </p>
                <p className="text-gray-500 text-xs mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Chat Messages
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#f78166] text-white"
                  : "bg-[#161b22] border border-[#30363d] text-gray-200"
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span>🔮</span>
                    <span className="text-[#f78166] text-xs font-medium">GenBI</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>🔮</span>
                  <span className="text-gray-400 text-sm">GenBI is thinking...</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#f78166] rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
                    <div className="w-1.5 h-1.5 bg-[#f78166] rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
                    <div className="w-1.5 h-1.5 bg-[#f78166] rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-[#30363d]">
        {/* File ID input */}
        <div className="mb-2">
          <input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="Paste File ID here to chat with your data..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2 text-gray-400 text-xs focus:outline-none focus:border-[#f78166]/50 transition-all"
          />
        </div>
        {/* Message input */}
        <div className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-2xl px-4 py-3 focus-within:border-[#f78166]/50 transition-all">
          <button
            onClick={() => setActiveTool("upload")}
            className="text-gray-500 hover:text-[#f78166] transition-all text-lg"
            title="Upload file"
          >
            📎
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask GenBI anything..."
            className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-[#f78166] hover:bg-[#e06b52] disabled:opacity-30 rounded-xl flex items-center justify-center transition-all"
          >
            <span className="text-white text-sm">→</span>
          </button>
        </div>
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

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload`, formData, { headers });
      setResult(res.data);
      setFileId(res.data.file_id);
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white mb-2">📁 Upload File</h2>
      <p className="text-gray-400 mb-6">Upload your CSV or Excel file to start analyzing</p>

      <div className="border-2 border-dashed border-[#30363d] hover:border-[#f78166]/50 rounded-2xl p-8 text-center transition-all mb-4">
        <div className="text-5xl mb-4">📂</div>
        <p className="text-gray-400 mb-4">Drop your file here or click to browse</p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="bg-[#161b22] border border-[#30363d] text-gray-300 px-6 py-2 rounded-xl cursor-pointer hover:border-[#f78166]/50 transition-all text-sm"
        >
          Choose File
        </label>
        {file && <p className="text-[#f78166] mt-3 text-sm">✅ {file.name}</p>}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full bg-[#f78166] hover:bg-[#e06b52] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
      >
        {loading ? "Uploading & Indexing..." : "Upload & Index 🚀"}
      </button>

      {result && (
        <div className="mt-6 bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
          <p className="text-green-400 font-medium mb-4">✅ File uploaded successfully!</p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">📄 <span className="text-white">{result.filename}</span></p>
            <p className="text-gray-400">📊 Rows: <span className="text-white">{result.rows}</span></p>
            <p className="text-gray-400">🗂️ Columns: <span className="text-white">{result.columns?.join(", ")}</span></p>
            <p className="text-gray-400">🧩 Chunks: <span className="text-white">{result.chunks_indexed}</span></p>
            <div className="bg-[#0d0d0d] rounded-xl p-3 mt-3">
              <p className="text-gray-500 text-xs mb-1">File ID (copy this):</p>
              <p className="text-[#f78166] font-mono text-xs break-all">{result.file_id}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTool("chat")}
            className="w-full mt-4 bg-[#f78166]/20 border border-[#f78166]/30 text-[#f78166] py-2 rounded-xl text-sm hover:bg-[#f78166]/30 transition-all"
          >
            Start Chatting →
          </button>
        </div>
      )}
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

  const handleForecast = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date_col", dateCol);
    formData.append("value_col", valueCol);
    formData.append("periods", periods);
    try {
      const res = await axios.post(`${API}/forecast`, formData, { headers });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Forecast failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white mb-2">📈 Forecasting</h2>
      <p className="text-gray-400 mb-6">Predict future values from your time-series data</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Upload File</label>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-gray-400 text-sm"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Date Column</label>
            <input
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f78166]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Value Column</label>
            <input
              value={valueCol}
              onChange={(e) => setValueCol(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f78166]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Periods</label>
            <input
              type="number"
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f78166]"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={handleForecast}
        disabled={!file || loading}
        className="w-full bg-[#f78166] hover:bg-[#e06b52] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all mb-6"
      >
        {loading ? "Running Forecast..." : "Run Forecast 📈"}
      </button>

      {result && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
          <p className="text-green-400 font-medium mb-4">
            ✅ Forecast completed! {result.periods_forecasted} periods predicted.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#30363d]">
                  <th className="text-gray-500 text-left py-2">Date</th>
                  <th className="text-gray-500 text-left py-2">Predicted</th>
                  <th className="text-gray-500 text-left py-2">Lower</th>
                  <th className="text-gray-500 text-left py-2">Upper</th>
                </tr>
              </thead>
              <tbody>
                {result.forecast?.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-[#30363d]/50">
                    <td className="text-gray-300 py-2">{row.ds}</td>
                    <td className="text-[#f78166] py-2">{Math.round(row.yhat).toLocaleString()}</td>
                    <td className="text-gray-500 py-2">{Math.round(row.yhat_lower).toLocaleString()}</td>
                    <td className="text-gray-500 py-2">{Math.round(row.yhat_upper).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.forecast?.length > 10 && (
              <p className="text-gray-500 text-xs mt-2">
                Showing 10 of {result.forecast.length} predictions
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Files Tool ───────────────────────────────────────────
function FilesTool({ headers, setFileId, setActiveTool }) {
  const [files, setFiles] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadFiles = async () => {
    try {
      const res = await axios.get(`${API}/files`, { headers });
      setFiles(res.data);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  };

  if (!loaded) loadFiles();

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white mb-2">🗂️ My Files</h2>
      <p className="text-gray-400 mb-6">All files you have uploaded</p>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-gray-400">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((f, i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-medium text-sm">📄 {f.filename}</p>
                <button
                  onClick={() => { setFileId(f._id); setActiveTool("chat"); }}
                  className="text-[#f78166] text-xs hover:underline"
                >
                  Chat with this →
                </button>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>📊 {f.rows} rows</span>
                <span>🗂️ {f.columns?.join(", ")}</span>
              </div>
              <p className="text-gray-600 font-mono text-xs mt-2 truncate">ID: {f._id}</p>
            </div>
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
    try {
      const res = await axios.get(`${API}/query-history`, { headers });
      setHistory(res.data);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  };

  if (!loaded) loadHistory();

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white mb-2">📜 Query History</h2>
      <p className="text-gray-400 mb-6">Your past questions and answers</p>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📜</p>
          <p className="text-gray-400">No queries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
              <p className="text-[#f78166] text-sm font-medium mb-2">❓ {h.question}</p>
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{h.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}