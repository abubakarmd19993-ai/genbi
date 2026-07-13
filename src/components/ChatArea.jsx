import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AILoading from "./AILoading";
import ChartDashboard from "./Dashboard";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";

const API = "http://127.0.0.1:8000";
const PIE_COLORS = ["#f78166", "#bc8cff", "#58a6ff", "#3fb950", "#f0883e", "#db61a2"];

export default function ChatArea({ activeTool, setActiveTool, setChats }) {
  const { username, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (setChats) {
        setChats(prev => [...prev, {
          question: input,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
    }
    setLoading(false);
  };

  if (activeTool === "dashboard") {
    return <Dashboard headers={headers} />;
  }
  if (activeTool === "autodashboard") {
    return <ChartDashboard headers={headers} />;
  }
  if (activeTool === "upload") {
    return <UploadTool headers={headers} setFileId={setFileId} setActiveTool={setActiveTool} />;
  }
  if (activeTool === "forecast") {
    return <ForecastTool headers={headers} />;
  }
  if (activeTool === "files") {
    return <FilesTool headers={headers} setFileId={setFileId} setActiveTool={setActiveTool} />;
  }
  if (activeTool === "history") {
    return <HistoryTool headers={headers} />;
  }

  return (
    <div className="flex-1 flex flex-col">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hello, {username}! 👋</h1>
          <p className="text-gray-400 text-xl mb-8">How can I help you today?</p>

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
                className="bg-[#161b22] border border-[#30363d] hover:border-[#f78166]/50 text-gray-300 text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2"
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
          {loading && <AILoading />}
        </div>
      )}

      <div className="p-4 border-t border-[#30363d]">
        <div className="mb-2">
          <input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="Paste File ID here to chat with your data..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2 text-gray-400 text-xs focus:outline-none focus:border-[#f78166]/50 transition-all"
          />
        </div>
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

// ── Dashboard (usage stats) ───────────────────────────────
function Dashboard({ headers }) {
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadStats = async () => {
    try {
      const [filesRes, historyRes] = await Promise.all([
        axios.get(`${API}/files`, { headers }),
        axios.get(`${API}/query-history`, { headers }),
      ]);
      setStats({
        totalFiles: filesRes.data.length,
        totalRows: filesRes.data.reduce((sum, f) => sum + (f.rows || 0), 0),
        totalQueries: historyRes.data.length,
        recentFiles: filesRes.data.slice(0, 5),
        recentQueries: historyRes.data.slice(0, 5),
      });
      setLoaded(true);
    } catch {
      setStats({ totalFiles: 0, totalRows: 0, totalQueries: 0, recentFiles: [], recentQueries: [] });
      setLoaded(true);
    }
  };

  if (!loaded) loadStats();

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-2">📊 Dashboard</h2>
      <p className="text-gray-400 mb-6">Your GenBI activity at a glance</p>

      {!stats ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
              <p className="text-gray-500 text-xs mb-1">📁 Files Uploaded</p>
              <p className="text-white text-3xl font-bold">{stats.totalFiles}</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
              <p className="text-gray-500 text-xs mb-1">📊 Total Rows Analyzed</p>
              <p className="text-white text-3xl font-bold">{stats.totalRows.toLocaleString()}</p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
              <p className="text-gray-500 text-xs mb-1">💬 Queries Asked</p>
              <p className="text-white text-3xl font-bold">{stats.totalQueries}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-white font-semibold mb-3">🗂️ Recent Files</p>
              {stats.recentFiles.length === 0 ? (
                <p className="text-gray-500 text-sm">No files yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentFiles.map((f, i) => (
                    <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
                      <p className="text-white text-sm font-medium truncate">📄 {f.filename}</p>
                      <p className="text-gray-500 text-xs mt-1">{f.rows} rows</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-white font-semibold mb-3">📜 Recent Queries</p>
              {stats.recentQueries.length === 0 ? (
                <p className="text-gray-500 text-sm">No queries yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentQueries.map((h, i) => (
                    <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
                      <p className="text-[#f78166] text-sm font-medium truncate">❓ {h.question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Auto Dashboard Generator (charts from uploaded file columns) ──
function AutoDashboardCharts({ columnInfo }) {
  if (!columnInfo) return null;

  const numericCols = Object.entries(columnInfo).filter(([, info]) => info.min !== undefined);
  const categoricalCols = Object.entries(columnInfo).filter(([, info]) => info.min === undefined && info.top_values);

  if (numericCols.length === 0 && categoricalCols.length === 0) {
    return <p className="text-gray-500 text-sm">Not enough column data to build charts.</p>;
  }

  return (
    <div className="space-y-6">
      {numericCols.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-medium mb-3">📈 Numeric Columns (Min / Avg / Max)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numericCols.map(([col, info]) => {
              const data = [
                { name: "Min", value: info.min },
                { name: "Avg", value: info.mean },
                { name: "Max", value: info.max },
              ];
              return (
                <div key={col} className="bg-[#0d0d0d] rounded-xl p-4">
                  <p className="text-white text-xs font-medium mb-2">{col}</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis dataKey="name" stroke="#8b949e" fontSize={11} />
                      <YAxis stroke="#8b949e" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="value" fill="#f78166" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categoricalCols.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-medium mb-3">🥧 Categorical Columns (Top Values)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoricalCols.map(([col, info]) => {
              const data = Object.entries(info.top_values || {}).map(([name, value]) => ({ name, value }));
              if (data.length === 0) return null;
              return (
                <div key={col} className="bg-[#0d0d0d] rounded-xl p-4">
                  <p className="text-white text-xs font-medium mb-2">{col}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={{ fontSize: 11, fill: "#8b949e" }}
                      >
                        {data.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#8b949e" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload Tool ──────────────────────────────────────────
function UploadTool({ headers, setFileId, setActiveTool }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [dataQuality, setDataQuality] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [showAutoDashboard, setShowAutoDashboard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

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
      showToast(`✅ ${res.data.filename} uploaded successfully!`, "success");
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed");
      showToast("❌ Upload failed. Please try again.", "error");
    }
    setLoading(false);
  };

  const handleInsights = async () => {
    if (!file) return;
    setInsightsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/insights`, formData, { headers });
      setInsights(res.data);
      showToast("🔮 Executive insights generated!", "success");
    } catch (e) {
      showToast("❌ Failed to generate insights.", "error");
    }
    setInsightsLoading(false);
  };

  const handleRecommendations = async () => {
    if (!file) return;
    setRecsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/recommendations`, formData, { headers });
      setRecommendations(res.data);
      showToast("💡 Business recommendations ready!", "success");
    } catch (e) {
      showToast("❌ Failed to generate recommendations.", "error");
    }
    setRecsLoading(false);
  };

  const handleDataQuality = async () => {
    if (!file) return;
    setQualityLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/data-quality`, formData, { headers });
      setDataQuality(res.data);
      showToast("🧹 Data quality analysis complete!", "success");
    } catch (e) {
      showToast("❌ Data quality analysis failed.", "error");
    }
    setQualityLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx"))) {
      setFile(droppedFile);
      showToast(`📎 ${droppedFile.name} selected!`, "info");
    } else {
      showToast("❌ Only CSV and Excel files allowed.", "error");
    }
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-2">📁 Upload File</h2>
      <p className="text-gray-400 mb-4">Upload your CSV or Excel file to start analyzing</p>

      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 mb-6">
        <span>🔒</span>
        <p className="text-green-400 text-xs">Your data is encrypted and private — we never share or sell your files</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all mb-4 ${
          isDragging ? "border-[#f78166] bg-[#f78166]/10" : "border-[#30363d] hover:border-[#f78166]/50"
        }`}
      >
        <div className="text-5xl mb-4">{isDragging ? "📂" : "📁"}</div>
        <p className="text-gray-400 mb-2">{isDragging ? "Drop your file here!" : "Drag & drop or click to browse"}</p>
        <p className="text-gray-600 text-xs mb-4">Supports CSV and Excel files</p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            setFile(e.target.files[0]);
            showToast(`📎 ${e.target.files[0].name} selected!`, "info");
          }}
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
        <div className="mt-6 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setActiveTool("chat")}
                className="bg-[#f78166]/20 border border-[#f78166]/30 text-[#f78166] py-2 rounded-xl text-sm hover:bg-[#f78166]/30 transition-all"
              >
                Start Chatting →
              </button>
              <button
                onClick={handleInsights}
                disabled={insightsLoading}
                className="bg-[#bc8cff]/20 border border-[#bc8cff]/30 text-[#bc8cff] py-2 rounded-xl text-sm hover:bg-[#bc8cff]/30 transition-all disabled:opacity-50"
              >
                {insightsLoading ? "Analyzing..." : "🔮 Get Insights"}
              </button>
              <button
                onClick={handleRecommendations}
                disabled={recsLoading}
                className="bg-[#58a6ff]/20 border border-[#58a6ff]/30 text-[#58a6ff] py-2 rounded-xl text-sm hover:bg-[#58a6ff]/30 transition-all disabled:opacity-50"
              >
                {recsLoading ? "Analyzing..." : "💡 Recommendations"}
              </button>
              <button
                onClick={handleDataQuality}
                disabled={qualityLoading}
                className="bg-[#3fb950]/20 border border-[#3fb950]/30 text-[#3fb950] py-2 rounded-xl text-sm hover:bg-[#3fb950]/30 transition-all disabled:opacity-50"
              >
                {qualityLoading ? "Analyzing..." : "🧹 Data Quality"}
              </button>
              <button
                onClick={() => setShowAutoDashboard(!showAutoDashboard)}
                className="col-span-2 bg-[#f0883e]/20 border border-[#f0883e]/30 text-[#f0883e] py-2 rounded-xl text-sm hover:bg-[#f0883e]/30 transition-all"
              >
                {showAutoDashboard ? "▲ Hide Auto Dashboard" : "📊 Generate Auto Dashboard"}
              </button>
            </div>
          </div>

          {showAutoDashboard && result.summary?.column_info && (
            <div className="bg-[#161b22] border border-[#f0883e]/30 rounded-2xl p-6">
              <p className="text-[#f0883e] font-semibold mb-4">📊 Auto Dashboard</p>
              <AutoDashboardCharts columnInfo={result.summary.column_info} />
            </div>
          )}

          {result.summary && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold">🔮 AI Data Summary</p>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  result.summary.quality_score === 100
                    ? "bg-green-500/20 text-green-400"
                    : result.summary.quality_score > 80
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  Quality: {result.summary.quality_score}%
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {result.summary.insights?.map((insight, i) => (
                  <p key={i} className="text-gray-300 text-sm bg-[#0d0d0d] rounded-xl px-3 py-2">{insight}</p>
                ))}
              </div>
              <p className="text-gray-500 text-xs mb-3">Column Analysis:</p>
              <div className="space-y-2">
                {Object.entries(result.summary.column_info || {}).map(([col, info]) => (
                  <div key={col} className="bg-[#0d0d0d] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-xs font-medium">{col}</p>
                      <span className="text-gray-500 text-xs">{info.type}</span>
                    </div>
                    {info.min !== undefined ? (
                      <p className="text-gray-400 text-xs">
                        Min: <span className="text-[#f78166]">{info.min}</span> •
                        Max: <span className="text-[#f78166]">{info.max}</span> •
                        Avg: <span className="text-[#f78166]">{info.mean}</span>
                      </p>
                    ) : (
                      <p className="text-gray-400 text-xs">Top: {Object.keys(info.top_values || {}).join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights && (
            <div className="bg-[#161b22] border border-[#bc8cff]/30 rounded-2xl p-6">
              <p className="text-[#bc8cff] font-semibold mb-4">🔮 Executive Business Insights</p>
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{insights.executive_summary}</div>
            </div>
          )}

          {recommendations && (
            <div className="bg-[#161b22] border border-[#58a6ff]/30 rounded-2xl p-6">
              <p className="text-[#58a6ff] font-semibold mb-4">💡 AI Business Recommendations</p>
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{recommendations.recommendations}</div>
            </div>
          )}

          {dataQuality && (
            <div className="bg-[#161b22] border border-[#3fb950]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#3fb950] font-semibold">🧹 AI Data Quality Report</p>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  dataQuality.quality_score >= 90
                    ? "bg-green-500/20 text-green-400"
                    : dataQuality.quality_score >= 70
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  Score: {dataQuality.quality_score}%
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {dataQuality.issues?.map((issue, i) => (
                  <p key={i} className="text-gray-300 text-xs bg-[#0d0d0d] rounded-xl px-3 py-2">{issue}</p>
                ))}
              </div>

              <p className="text-gray-500 text-xs mb-2">Suggestions:</p>
              <div className="space-y-2 mb-4">
                {dataQuality.suggestions?.map((s, i) => (
                  <p key={i} className="text-gray-300 text-xs bg-[#0d0d0d] rounded-xl px-3 py-2">{s}</p>
                ))}
              </div>

              <div className="bg-[#0d0d0d] rounded-xl p-3">
                <p className="text-[#3fb950] text-xs font-medium mb-1">🤖 AI Assessment:</p>
                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{dataQuality.ai_summary}</p>
              </div>
            </div>
          )}
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
  const { showToast } = useToast();

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
      showToast(`📈 Forecast completed!`, "success");
    } catch (e) {
      setError(e.response?.data?.detail || "Forecast failed");
      showToast("❌ Forecast failed.", "error");
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
          <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files[0])}
            className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-gray-400 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Date Column</label>
            <input value={dateCol} onChange={(e) => setDateCol(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f78166]" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Value Column</label>
            <input value={valueCol} onChange={(e) => setValueCol(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f78166]" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Periods</label>
            <input type="number" value={periods} onChange={(e) => setPeriods(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f78166]" />
          </div>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button onClick={handleForecast} disabled={!file || loading}
        className="w-full bg-[#f78166] hover:bg-[#e06b52] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all mb-6">
        {loading ? "Running Forecast..." : "Run Forecast 📈"}
      </button>
      {result && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
          <p className="text-green-400 font-medium mb-4">✅ Forecast completed! {result.periods_forecasted} periods predicted.</p>
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
  const { showToast } = useToast();

  const loadFiles = async () => {
    try {
      const res = await axios.get(`${API}/files`, { headers });
      setFiles(res.data);
      setLoaded(true);
    } catch {
      setLoaded(true);
      showToast("❌ Failed to load files.", "error");
    }
  };

  if (!loaded) loadFiles();

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white mb-2">🗂️ My Files</h2>
      <p className="text-gray-400 mb-6">All files you have uploaded</p>
      {files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4 animate-bounce">📂</p>
          <p className="text-gray-400">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((f, i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-medium text-sm">📄 {f.filename}</p>
                <button
                  onClick={() => { setFileId(f._id); setActiveTool("chat"); showToast(`💬 Chatting with ${f.filename}`, "info"); }}
                  className="text-[#f78166] text-xs hover:underline"
                >Chat with this →</button>
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
          <p className="text-5xl mb-4 animate-bounce">📜</p>
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