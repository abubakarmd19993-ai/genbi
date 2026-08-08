import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { invoiceService } from "../services/invoiceService";
import InvoiceProcessing from "./invoice/InvoiceProcessing";
import InvoiceAnalysisCard from "./invoice/InvoiceAnalysisCard";
import { Send, Sparkles } from "lucide-react";

const QUICK_QUESTIONS = [
  "Is this invoice correct?",
  "What is the total amount?",
  "What is the GST amount?",
  "When is payment due?",
  "Are there any anomalies?",
  "Summarize this invoice",
];

export default function InvoiceReaderTool() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleFileSelect = (f) => {
    const allowed = ["pdf", "jpg", "jpeg", "png", "bmp", "tiff", "webp"];
    const ext = f.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      showToast("❌ Only PDF and image files allowed", "error");
      return;
    }
    setFile(f); setResult(null); setError(""); setMessages([]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setProcessing(true); setError("");
    try {
      const data = await invoiceService.analyze(file, token);
      setResult(data);
      showToast("🧾 Invoice analyzed successfully!", "success");
      setMessages([{
        role: "assistant",
        content: `✅ Invoice analyzed! I found ${data.invoice_data?.line_items?.length || 0} line items with a total of ${data.invoice_data?.currency || "$"}${data.invoice_data?.total_amount || "N/A"}. Ask me anything about this invoice!`
      }]);
    } catch (e) {
      setError(e.message || "Failed to analyze invoice.");
      showToast("❌ Analysis failed.", "error");
    }
    setProcessing(false);
  };

  const handleAsk = async (q = question) => {
    if (!q.trim() || !result) return;
    const userMsg = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await invoiceService.chat(q, result.invoice_data, token);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.answer || "I couldn't find that information in the invoice."
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I couldn't process that question. Please try again."
      }]);
    }
    setAsking(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(15,23,42,0.6)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🧾</span>
          <div>
            <h2 style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700, margin: 0 }}>Invoice Intelligence</h2>
            <p style={{ color: "#6B7280", fontSize: 11, margin: 0, letterSpacing: "0.05em" }}>
              UNDERSTAND • VERIFY • ANALYZE
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Upload Zone */}
        {!file && !result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("invoiceInput").click()}
              animate={isDragging ? { scale: 1.02 } : {}}
              style={{
                border: `2px dashed ${isDragging ? "#3B82F6" : "rgba(59,130,246,0.25)"}`,
                borderRadius: 20, padding: "48px 24px",
                textAlign: "center", cursor: "pointer",
                background: isDragging ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                marginBottom: 16, transition: "all 0.2s",
                position: "relative", overflow: "hidden",
              }}
            >
              <motion.div
                style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.04), transparent)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div style={{ fontSize: 48, marginBottom: 16 }}>{isDragging ? "📂" : "🧾"}</div>
              <p style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 600, margin: "0 0 6px 0" }}>
                {isDragging ? "Drop your invoice here!" : "Drop your invoice here"}
              </p>
              <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 20px 0" }}>PDF • JPG • PNG • JPEG</p>
              <div style={{
                display: "inline-flex", padding: "8px 20px", borderRadius: 10,
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
                color: "#60A5FA", fontSize: 13, fontWeight: 600,
              }}>
                Browse Invoice
              </div>
              <input id="invoiceInput" type="file"
                accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp"
                onChange={e => handleFileSelect(e.target.files[0])}
                style={{ display: "none" }}
              />
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { icon: "📄", label: "PDF Invoices", desc: "Digital or scanned" },
                { icon: "🖼️", label: "Image Invoices", desc: "JPG, PNG, TIFF" },
                { icon: "📊", label: "Auto Validation", desc: "Tax, totals, items" },
              ].map((f, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12, padding: 12, textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                  <p style={{ color: "#E5E7EB", fontSize: 11, fontWeight: 600, margin: "0 0 2px 0" }}>{f.label}</p>
                  <p style={{ color: "#6B7280", fontSize: 10, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* File Selected */}
        {file && !processing && !result && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: 16, borderRadius: 16,
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 36 }}>🧾</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 14, margin: "0 0 2px 0" }}>{file.name}</p>
              <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => { setFile(null); setError(""); }}
              style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 13 }}
            >
              Remove
            </button>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          }}>
            <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 8px 0" }}>⚠️ {error}</p>
            <button onClick={() => { setError(""); setFile(null); }}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Processing */}
        <AnimatePresence>
          {processing && <InvoiceProcessing filename={file?.name} />}
        </AnimatePresence>

        {/* Results */}
        {result && !processing && (
          <>
            <InvoiceAnalysisCard result={result} />

            {/* Chat Messages */}
            {messages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
                    >
                      <div style={{
                        maxWidth: "80%", padding: "10px 14px", borderRadius: 14,
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, #1e3a5f, #3B82F6)"
                          : "rgba(255,255,255,0.04)",
                        border: msg.role === "user"
                          ? "1px solid rgba(125,211,252,0.3)"
                          : "1px solid rgba(255,255,255,0.07)",
                      }}>
                        {msg.role === "assistant" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Sparkles size={12} color="#3B82F6" />
                            <span style={{ color: "#3B82F6", fontSize: 11, fontWeight: 600 }}>Invoice AI</span>
                          </div>
                        )}
                        <p style={{ color: "#E5E7EB", fontSize: 13, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {asking && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }}
                    />
                    <span style={{ color: "#6B7280", fontSize: 12 }}>Analyzing invoice...</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Questions */}
            {result && !asking && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginTop: 16 }}
              >
                <p style={{ color: "#6B7280", fontSize: 11, margin: "0 0 8px 0" }}>Quick questions:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {QUICK_QUESTIONS.map((q, i) => (
                    <motion.button key={i} onClick={() => handleAsk(q)}
                      whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12,
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "#60A5FA", cursor: "pointer",
                      }}
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{
        padding: "12px 20px 16px",
        background: "rgba(15,23,42,0.8)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        {file && !processing && !result && (
          <motion.button
            onClick={handleAnalyze}
            whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(59,130,246,0.4)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%", padding: "14px", borderRadius: 14,
              fontSize: 15, fontWeight: 700,
              background: "linear-gradient(135deg, #1e3a5f, #3B82F6)",
              border: "1px solid rgba(125,211,252,0.25)",
              color: "white", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span>🔍</span> Analyze Invoice
          </motion.button>
        )}

        {result && (
          <div style={{
            display: "flex", gap: 8, alignItems: "center",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 14, padding: "8px 8px 8px 16px",
          }}>
            <input
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAsk()}
              placeholder="Ask anything about this invoice..."
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", color: "#E5E7EB", fontSize: 14,
                fontFamily: "Inter, sans-serif",
              }}
            />
            <motion.button
              onClick={() => handleAsk()}
              disabled={asking || !question.trim()}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: question.trim() ? "linear-gradient(135deg, #1e3a5f, #3B82F6)" : "rgba(255,255,255,0.05)",
                border: "none", cursor: question.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: asking ? 0.6 : 1,
              }}
            >
              <Send size={14} color={question.trim() ? "white" : "#374151"} />
            </motion.button>
          </div>
        )}

        {!file && !result && (
          <p style={{ color: "#374151", fontSize: 11, textAlign: "center", margin: 0 }}>
            GenBI Invoice Intelligence · Supports PDF, JPG, PNG
          </p>
        )}
      </div>
    </div>
  );
}