import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function ChatArea({ activeTool, setActiveTool, setChats, setActiveChat, standalone = false }) {
  const { username, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState(null);
  const [listening, setListening] = useState(false);

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

  const sendMessage = async (question, fid) => {
    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/query`, { question, file_id: fid }, { headers });
      setMessages((prev) => {
        const next = [...prev, { role: "assistant", content: res.data.answer }];
        setTypingIndex(next.length - 1);
        return next;
      });
      setChats((prev) => [
        ...prev,
        { question, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } catch {
      setMessages((prev) => {
        const next = [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }];
        setTypingIndex(next.length - 1);
        return next;
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!standalone && location.state?.pendingMessage) {
      const msg = location.state.pendingMessage;
      const fid = location.state.pendingFileId;
      if (fid) setFileId(fid);
      sendMessage(msg, fid);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!fileId) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Please upload a file first and enter the File ID to ask questions about your data." },
      ]);
      return;
    }

    if (standalone) {
      navigate("/workspace/chat", { state: { pendingMessage: input, pendingFileId: fileId } });
      return;
    }

    await sendMessage(input, fileId);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.start();
  };

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
      <style>{`
        @keyframes msg-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-animate { animation: msg-slide-in 0.3s ease-out; }
      `}</style>

      {messages.length === 0 ? (
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
                onClick={() => setActiveTool(action.id)}
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
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex msg-animate ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 group relative ${
                  msg.role === "user"
                    ? "bg-[#f78166] text-white"
                    : "bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span>🔮</span>
                      <span className="text-[#f78166] text-xs font-medium">GenBI</span>
                    </div>
                    <CopyButton text={msg.content} />
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">
                  {msg.role === "assistant" && i === typingIndex ? (
                    <TypingText text={msg.content} onDone={() => setTypingIndex(null)} />
                  ) : (
                    msg.content
                  )}
                </p>
              </div>
            </div>
          ))}
          {loading && <ThinkingLoader />}
        </div>
      )}

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
          <button
            onClick={() => setActiveTool("upload")}
            className="text-[var(--text-tertiary)] hover:text-[#f78166] transition-all text-lg"
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
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none text-sm"
          />
          <button
            onClick={handleVoiceInput}
            className={`text-lg transition-all ${listening ? "text-red-400 animate-pulse" : "text-[var(--text-tertiary)] hover:text-[#f78166]"}`}
            title="Voice input"
          >
            🎤
          </button>
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

// ── Copy Button ───────────────────────────────────────────
function CopyButton({ text }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Couldn't copy. Try selecting manually.", "error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[var(--text-tertiary)] hover:text-[#f78166] text-xs opacity-0 group-hover:opacity-100 transition-all"
      title="Copy answer"
    >
      {copied ? "✅ Copied" : "📋 Copy"}
    </button>
  );
}

// ── Typing Effect ─────────────────────────────────────────
function TypingText({ text, onDone }) {
  const [display, setDisplay] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setDisplay("");
    let i = 0;
    const words = text.split(" ");
    const interval = setInterval(() => {
      i++;
      setDisplay(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone && onDone();
        }
      }
    }, 35);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <>{display}</>;
}

// ── Animated Thinking Loader ─────────────────────────────
function ThinkingLoader() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = ["Reading your data...", "Crunching the numbers...", "Connecting the dots...", "Almost there..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <style>{`
        @keyframes genbi-spin { to { transform: rotate(360deg); } }
        @keyframes genbi-pulse-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(247,129,102,0.4); }
          50% { box-shadow: 0 0 16px 6px rgba(188,140,255,0.5); }
        }
        @keyframes genbi-fade-slide {
          0% { opacity: 0; transform: translateY(4px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .genbi-ring { animation: genbi-spin 1.2s linear infinite; }
        .genbi-orb { animation: genbi-pulse-glow 1.6s ease-in-out infinite; }
        .genbi-phrase { animation: genbi-fade-slide 1.8s ease-in-out; }
      `}</style>
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
          <div
            className="genbi-ring absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #f78166, #bc8cff, #58a6ff, #f78166)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0)",
            }}
          ></div>
          <div className="genbi-orb w-3.5 h-3.5 rounded-full bg-[var(--bg-app)] flex items-center justify-center text-[10px]">
            🔮
          </div>
        </div>
        <span key={phraseIndex} className="genbi-phrase text-[var(--text-secondary)] text-sm min-w-[160px]">
          {phrases[phraseIndex]}
        </span>
      </div>
    </div>
  );
}

// ── Upload Tool ──────────────────────────────────────────
function UploadTool({ headers, setFileId, setActiveTool }) {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);

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
      showToast("File uploaded and indexed successfully!", "success");
    } catch (e) {
      const msg = e.response?.data?.detail || "Upload failed";
      setError(msg);
      showToast(msg, "error");
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
      showToast("Insights generated!", "success");
    } catch (e) {
      console.error("Insights failed:", e);
      showToast("Couldn't generate insights.", "error");
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
      showToast("Recommendations ready!", "success");
    } catch (e) {
      console.error("Recommendations failed:", e);
      showToast("Couldn't generate recommendations.", "error");
    }
    setRecsLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      showToast(`"${dropped.name}" ready to upload`, "info");
    }
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">📁 Upload File</h2>
      <p className="text-[var(--text-secondary)] mb-4">Upload your CSV or Excel file to start analyzing</p>

      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 mb-6">
        <span>🔒</span>
        <p className="text-green-400 text-xs">Your data is encrypted and private — we never share or sell your files</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all mb-4 ${
          dragActive ? "border-[#f78166] bg-[#f78166]/5 scale-[1.01]" : "border-[var(--border-color)] hover:border-[#f78166]/50"
        }`}
      >
        <div className="text-5xl mb-4">{dragActive ? "📥" : "📂"}</div>
        <p className="text-[var(--text-secondary)] mb-4">
          {dragActive ? "Drop it right here!" : "Drop your file here or click to browse"}
        </p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="bg-[var(--bg-panel-alt)] border border-[var(--border-color)] text-[var(--text-secondary)] px-6 py-2 rounded-xl cursor-pointer hover:border-[#f78166]/50 transition-all text-sm"
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
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6">
            <p className="text-green-400 font-medium mb-4">✅ File uploaded successfully!</p>
            <div className="space-y-2 text-sm">
              <p className="text-[var(--text-secondary)]">📄 <span className="text-[var(--text-primary)]">{result.filename}</span></p>
              <p className="text-[var(--text-secondary)]">📊 Rows: <span className="text-[var(--text-primary)]">{result.rows}</span></p>
              <p className="text-[var(--text-secondary)]">🗂️ Columns: <span className="text-[var(--text-primary)]">{result.columns?.join(", ")}</span></p>
              <p className="text-[var(--text-secondary)]">🧩 Chunks: <span className="text-[var(--text-primary)]">{result.chunks_indexed}</span></p>
              <div className="bg-[var(--bg-panel-alt)] rounded-xl p-3 mt-3">
                <p className="text-[var(--text-tertiary)] text-xs mb-1">File ID (copy this):</p>
                <p className="text-[#f78166] font-mono text-xs break-all">{result.file_id}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTool("chat")}
                className="flex-1 bg-[#f78166]/20 border border-[#f78166]/30 text-[#f78166] py-2 rounded-xl text-sm hover:bg-[#f78166]/30 transition-all"
              >
                Start Chatting →
              </button>
              <button
                onClick={handleInsights}
                disabled={insightsLoading}
                className="flex-1 bg-[#bc8cff]/20 border border-[#bc8cff]/30 text-[#bc8cff] py-2 rounded-xl text-sm hover:bg-[#bc8cff]/30 transition-all disabled:opacity-50"
              >
                {insightsLoading ? "Analyzing..." : "🔮 Get Insights"}
              </button>
              <button
                onClick={handleRecommendations}
                disabled={recsLoading}
                className="flex-1 bg-[#58a6ff]/20 border border-[#58a6ff]/30 text-[#58a6ff] py-2 rounded-xl text-sm hover:bg-[#58a6ff]/30 transition-all disabled:opacity-50"
              >
                {recsLoading ? "Analyzing..." : "💡 Recommendations"}
              </button>
            </div>
          </div>

          {result.summary && (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[var(--text-primary)] font-semibold">🔮 AI Data Summary</p>
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
                  <p key={i} className="text-[var(--text-secondary)] text-sm bg-[var(--bg-panel-alt)] rounded-xl px-3 py-2">
                    {insight}
                  </p>
                ))}
              </div>

              <p className="text-[var(--text-tertiary)] text-xs mb-3">Column Analysis:</p>
              <div className="space-y-2">
                {Object.entries(result.summary.column_info || {}).map(([col, info]) => (
                  <div key={col} className="bg-[var(--bg-panel-alt)] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[var(--text-primary)] text-xs font-medium">{col}</p>
                      <span className="text-[var(--text-tertiary)] text-xs">{info.type}</span>
                    </div>
                    {info.min !== undefined ? (
                      <p className="text-[var(--text-secondary)] text-xs">
                        Min: <span className="text-[#f78166]">{info.min}</span> •
                        Max: <span className="text-[#f78166]">{info.max}</span> •
                        Avg: <span className="text-[#f78166]">{info.mean}</span>
                      </p>
                    ) : (
                      <p className="text-[var(--text-secondary)] text-xs">
                        Top: {Object.keys(info.top_values || {}).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights && (
            <div className="bg-[var(--bg-panel)] border border-[#bc8cff]/30 rounded-2xl p-6">
              <p className="text-[#bc8cff] font-semibold mb-4">🔮 Executive Business Insights</p>
              <div className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
                {insights.executive_summary}
              </div>
            </div>
          )}

          {recommendations && (
            <div className="bg-[var(--bg-panel)] border border-[#58a6ff]/30 rounded-2xl p-6">
              <p className="text-[#58a6ff] font-semibold mb-4">💡 AI Business Recommendations</p>
              <div className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
                {recommendations.recommendations}
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
  const { showToast } = useToast();
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
      showToast("Forecast completed!", "success");
    } catch (e) {
      const msg = e.response?.data?.detail || "Forecast failed";
      setError(msg);
      showToast(msg, "error");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">📈 Forecasting</h2>
      <p className="text-[var(--text-secondary)] mb-6">Predict future values from your time-series data</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-2 block">Upload File</label>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-secondary)] text-sm"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[var(--text-secondary)] text-xs mb-1 block">Date Column</label>
            <input
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#f78166]"
            />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs mb-1 block">Value Column</label>
            <input
              value={valueCol}
              onChange={(e) => setValueCol(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#f78166]"
            />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-xs mb-1 block">Periods</label>
            <input
              type="number"
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#f78166]"
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
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6">
          <p className="text-green-400 font-medium mb-4">
            ✅ Forecast completed! {result.periods_forecasted} periods predicted.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-[var(--text-tertiary)] text-left py-2">Date</th>
                  <th className="text-[var(--text-tertiary)] text-left py-2">Predicted</th>
                  <th className="text-[var(--text-tertiary)] text-left py-2">Lower</th>
                  <th className="text-[var(--text-tertiary)] text-left py-2">Upper</th>
                </tr>
              </thead>
              <tbody>
                {result.forecast?.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border-color)]/50">
                    <td className="text-[var(--text-secondary)] py-2">{row.ds}</td>
                    <td className="text-[#f78166] py-2">{Math.round(row.yhat).toLocaleString()}</td>
                    <td className="text-[var(--text-tertiary)] py-2">{Math.round(row.yhat_lower).toLocaleString()}</td>
                    <td className="text-[var(--text-tertiary)] py-2">{Math.round(row.yhat_upper).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.forecast?.length > 10 && (
              <p className="text-[var(--text-tertiary)] text-xs mt-2">
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
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">🗂️ My Files</h2>
      <p className="text-[var(--text-secondary)] mb-6">All files you have uploaded</p>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4 animate-bounce">📂</p>
          <p className="text-[var(--text-secondary)]">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((f, i) => (
            <div key={i} className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[var(--text-primary)] font-medium text-sm">📄 {f.filename}</p>
                <button
                  onClick={() => { setFileId(f._id); setActiveTool("chat"); }}
                  className="text-[#f78166] text-xs hover:underline"
                >
                  Chat with this →
                </button>
              </div>
              <div className="flex gap-4 text-xs text-[var(--text-tertiary)]">
                <span>📊 {f.rows} rows</span>
                <span>🗂️ {f.columns?.join(", ")}</span>
              </div>
              <p className="text-[var(--text-quaternary)] font-mono text-xs mt-2 truncate">ID: {f._id}</p>
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
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">📜 Query History</h2>
      <p className="text-[var(--text-secondary)] mb-6">Your past questions and answers</p>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4 animate-bounce">📜</p>
          <p className="text-[var(--text-secondary)]">No queries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-4">
              <p className="text-[#f78166] text-sm font-medium mb-2">❓ {h.question}</p>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-3">{h.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}