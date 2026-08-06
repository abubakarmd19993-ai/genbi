import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";

const API = "http://127.0.0.1:8000";

// ── Language Config ───────────────────────────────────────
const LANGUAGES = [
  { id: "french", flag: "🇫🇷", label: "French", native: "Français", rtl: false, words: ["Bonjour", "Rapport", "Données", "Analyse", "Traduction", "Affaires"] },
  { id: "german", flag: "🇩🇪", label: "German", native: "Deutsch", rtl: false, words: ["Hallo", "Bericht", "Daten", "Analyse", "Übersetzung", "Geschäft"] },
  { id: "spanish", flag: "🇪🇸", label: "Spanish", native: "Español", rtl: false, words: ["Hola", "Informe", "Datos", "Análisis", "Traducción", "Negocios"] },
  { id: "arabic", flag: "🇦🇪", label: "Arabic", native: "العربية", rtl: true, words: ["مرحبا", "الترجمة", "البيانات", "التقرير", "الأعمال", "تحليل"] },
  { id: "hindi", flag: "🇮🇳", label: "Hindi", native: "हिंदी", rtl: false, words: ["नमस्ते", "अनुवाद", "रिपोर्ट", "डेटा", "व्यापार", "विश्लेषण"] },
  { id: "telugu", flag: "🇮🇳", label: "Telugu", native: "తెలుగు", rtl: false, words: ["నమస్కారం", "అనువాదం", "నివేదిక", "డేటా", "వ్యాపారం", "విశ్లేషణ"] },
  { id: "urdu", flag: "🇵🇰", label: "Urdu", native: "اردو", rtl: true, words: ["ہیلو", "ترجمہ", "رپورٹ", "ڈیٹا", "کاروبار", "تجزیہ"] },
  { id: "chinese", flag: "🇨🇳", label: "Chinese", native: "中文", rtl: false, words: ["你好", "翻译", "数据", "报告", "分析", "商业"] },
  { id: "japanese", flag: "🇯🇵", label: "Japanese", native: "日本語", rtl: false, words: ["こんにちは", "翻訳", "レポート", "データ", "分析", "ビジネス"] },
  { id: "korean", flag: "🇰🇷", label: "Korean", native: "한국어", rtl: false, words: ["안녕하세요", "번역", "보고서", "데이터", "분석", "사업"] },
  { id: "tamil", flag: "🇮🇳", label: "Tamil", native: "தமிழ்", rtl: false, words: ["வணக்கம்", "மொழிபெயர்ப்பு", "அறிக்கை", "தரவு", "வணிகம்", "பகுப்பாய்வு"] },
  { id: "marathi", flag: "🇮🇳", label: "Marathi", native: "मराठी", rtl: false, words: ["नमस्कार", "भाषांतर", "अहवाल", "डेटा", "व्यवसाय", "विश्लेषण"] },
];

const TRANSLATION_STAGES = [
  { id: "detect", label: "Detecting language", duration: 8 },
  { id: "extract", label: "Extracting text", duration: 20 },
  { id: "understand", label: "Understanding document", duration: 35 },
  { id: "translate", label: "Translating with AI", duration: 70 },
  { id: "format", label: "Preserving formatting", duration: 82 },
  { id: "generate", label: "Generating translated PDF", duration: 90 },
  { id: "quality", label: "Quality check", duration: 96 },
  { id: "finalize", label: "Finalizing", duration: 100 },
];

const AI_MESSAGES = [
  "Understanding your document structure...",
  "Translating with neural AI...",
  "Preserving original formatting...",
  "Optimizing readability...",
  "Ensuring translation accuracy...",
  "Final quality inspection...",
  "Almost done...",
];

// ── Floating Words ────────────────────────────────────────
function FloatingWords({ language }) {
  const lang = LANGUAGES.find(l => l.id === language);
  const [words, setWords] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const word = lang?.words[Math.floor(Math.random() * lang.words.length)];
      const id = Date.now();
      setWords(prev => [...prev.slice(-8), {
        id, word,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
        rotate: (Math.random() - 0.5) * 20,
        size: Math.random() * 8 + 12,
      }]);
    }, 600);
    return () => clearInterval(interval);
  }, [language]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <AnimatePresence>
        {words.map(w => (
          <motion.span
            key={w.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 0.7, 0.5, 0], scale: 1, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: `${w.x}%`,
              top: `${w.y}%`,
              fontSize: w.size,
              color: "rgba(125,211,252,0.7)",
              fontWeight: 600,
              rotate: w.rotate,
              whiteSpace: "nowrap",
              textShadow: "0 0 10px rgba(125,211,252,0.5)",
              direction: lang?.rtl ? "rtl" : "ltr",
            }}
          >
            {w.word}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── World Map SVG ─────────────────────────────────────────
function WorldMapBg() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", opacity: 0.06 }}>
      <svg viewBox="0 0 1000 500" style={{ width: "100%", height: "100%" }}>
        <ellipse cx="500" cy="250" rx="480" ry="230" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
        <ellipse cx="500" cy="250" rx="350" ry="230" fill="none" stroke="#3B82F6" strokeWidth="0.3" />
        <ellipse cx="500" cy="250" rx="200" ry="230" fill="none" stroke="#3B82F6" strokeWidth="0.3" />
        <line x1="20" y1="250" x2="980" y2="250" stroke="#3B82F6" strokeWidth="0.5" />
        <line x1="500" y1="20" x2="500" y2="480" stroke="#3B82F6" strokeWidth="0.5" />
        {[80, 160, 240, 320].map(y => (
          <line key={y} x1="20" y1={y} x2="980" y2={y} stroke="#3B82F6" strokeWidth="0.2" />
        ))}
        {[80, 160, 240, 320].map(y => (
          <line key={500 + y} x1="20" y1={500 - y} x2="980" y2={500 - y} stroke="#3B82F6" strokeWidth="0.2" />
        ))}
      </svg>
    </div>
  );
}

// ── Connection Line Animation ─────────────────────────────
function ConnectionLine({ fromLang, toLang }) {
  const from = LANGUAGES.find(l => l.id === fromLang);
  const to = LANGUAGES.find(l => l.id === toLang);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "20px 0", position: "relative" }}>
      {/* Source */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontSize: 32, marginBottom: 4 }}>🇬🇧</div>
        <span style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 600 }}>English</span>
      </motion.div>

      {/* Animated connection */}
      <div style={{ flex: 1, maxWidth: 200, position: "relative", height: 40, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 2, background: "rgba(59,130,246,0.2)", borderRadius: 1, position: "relative", overflow: "hidden" }}>
          <motion.div
            style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, #3B82F6, #7DD3FC, transparent)" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 20 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🌍
        </motion.div>
        {/* Moving dots */}
        {[0, 0.5, 1].map((delay, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: 6, height: 6, borderRadius: "50%",
              background: "#7DD3FC",
              boxShadow: "0 0 6px #7DD3FC",
              top: "50%", transform: "translateY(-50%)",
            }}
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay, ease: "linear" }}
          />
        ))}
      </div>

      {/* Target */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontSize: 32, marginBottom: 4 }}>{to?.flag}</div>
        <span style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 600 }}>{to?.label}</span>
      </motion.div>
    </div>
  );
}

// ── Translation Progress Screen ───────────────────────────
function TranslationProgress({ language, progress, currentStage, aiMessage }) {
  const lang = LANGUAGES.find(l => l.id === language);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "linear-gradient(135deg, #020617 0%, #0B1120 45%, #111827 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32,
      }}
    >
      <WorldMapBg />
      <FloatingWords language={language} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 560, textAlign: "center" }}>

        {/* Connection line */}
        <ConnectionLine fromLang="english" toLang={language} />

        {/* Orb */}
        <div style={{ position: "relative", width: 100, height: 100, margin: "16px auto 24px" }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                inset: -i * 12,
                borderRadius: "50%",
                border: `1px solid rgba(59,130,246,${0.3 - i * 0.08})`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360, boxShadow: ["0 0 20px rgba(59,130,246,0.5)", "0 0 40px rgba(125,211,252,0.7)", "0 0 20px rgba(59,130,246,0.5)"] }}
            transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 2, repeat: Infinity } }}
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a5f, #3B82F6, #7DD3FC)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
            }}
          >
            {lang?.flag}
          </motion.div>
        </div>

        {/* AI Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={aiMessage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ color: "#7DD3FC", fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}
          >
            {aiMessage}
          </motion.p>
        </AnimatePresence>

        <p style={{ color: "#4B5563", fontSize: 13, margin: "0 0 24px 0" }}>
          Translating to {lang?.label} ({lang?.native})
        </p>

        {/* Progress bar */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #3B82F6, #7DD3FC)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              style={{
                position: "absolute", inset: 0, borderRadius: 4,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "#6B7280", fontSize: 11 }}>Processing...</span>
            <motion.span
              key={Math.round(progress)}
              initial={{ scale: 1.2, color: "#7DD3FC" }}
              animate={{ scale: 1, color: "#FFFFFF" }}
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Stages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 20 }}>
          {TRANSLATION_STAGES.map((stage, i) => {
            const done = progress >= stage.duration;
            const active = progress >= (TRANSLATION_STAGES[i - 1]?.duration || 0) && !done;
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 10,
                  background: done ? "rgba(34,197,94,0.08)" : active ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${done ? "rgba(34,197,94,0.2)" : active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)"}`,
                  transition: "all 0.3s",
                }}
              >
                {done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#22c55e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "white", fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    ✓
                  </motion.div>
                ) : active ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      border: "2px solid rgba(59,130,246,0.3)",
                      borderTopColor: "#3B82F6",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize: 12, fontWeight: done ? 600 : 400,
                  color: done ? "#22c55e" : active ? "#60A5FA" : "#4B5563",
                  transition: "color 0.3s",
                }}>
                  {stage.label}
                </span>
                {done && (
                  <span style={{ color: "#22c55e", fontSize: 10, marginLeft: "auto" }}>Done</span>
                )}
                {active && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ color: "#3B82F6", fontSize: 10, marginLeft: "auto" }}
                  >
                    In progress...
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Success Screen ────────────────────────────────────────
function SuccessScreen({ language, pageCount, processingTime, onDownload, onReset }) {
  const lang = LANGUAGES.find(l => l.id === language);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "linear-gradient(135deg, #020617 0%, #0B1120 45%, #111827 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32,
      }}
    >
      <FloatingWords language={language} />
      <WorldMapBg />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 500, textAlign: "center" }}>

        {/* Success orb */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          style={{
            width: 90, height: 90, borderRadius: "50%",
            background: "linear-gradient(135deg, #14532d, #22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 40px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.2)",
            fontSize: 40,
          }}
        >
          ✅
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 26, fontWeight: 800, margin: "0 0 8px 0",
            background: "linear-gradient(135deg, #FFFFFF, #22c55e)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}
        >
          Translation Complete!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: "#9CA3AF", fontSize: 14, margin: "0 0 28px 0" }}
        >
          Your document has been translated to {lang?.label} ({lang?.native}) {lang?.flag}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8, marginBottom: 24,
          }}
        >
          {[
            { label: "Pages", value: pageCount || 1 },
            { label: "Language", value: lang?.flag },
            { label: "Time", value: `${processingTime}s` },
            { label: "AI Model", value: "llama3.2" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                padding: "12px 8px", borderRadius: 12, textAlign: "center",
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <p style={{ color: "#22c55e", fontSize: 18, fontWeight: 700, margin: "0 0 2px 0" }}>{stat.value}</p>
              <p style={{ color: "#6B7280", fontSize: 10, margin: 0 }}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onDownload}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "14px", borderRadius: 14,
              background: "linear-gradient(135deg, #14532d, #22c55e)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
            }}
          >
            ⬇️ Download Translation
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={onReset}
            whileHover={{ scale: 1.01 }}
            style={{
              padding: "12px", borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#9CA3AF", fontSize: 14,
              cursor: "pointer",
            }}
          >
            🔄 Translate Another PDF
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main PDF Translator Tool ──────────────────────────────
export default function PDFTranslatorTool() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const { showToast } = useToast();

  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("french");
  const [isDragging, setIsDragging] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [aiMessage, setAiMessage] = useState(AI_MESSAGES[0]);
  const [success, setSuccess] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [downloadFn, setDownloadFn] = useState(null);
  const [error, setError] = useState("");

  const lang = LANGUAGES.find(l => l.id === language);
  const startTimeRef = useRef(null);
  const progressRef = useRef(null);
  const messageRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".pdf")) {
      setFile(f);
      setError("");
    } else {
      showToast("❌ Only PDF files allowed", "error");
    }
  }, []);

  const handleTranslate = async () => {
    if (!file) return;
    setTranslating(true);
    setProgress(0);
    setSuccess(false);
    setError("");
    startTimeRef.current = Date.now();

    // Animate progress
    let prog = 0;
    progressRef.current = setInterval(() => {
      prog += Math.random() * 2 + 0.5;
      if (prog >= 95) {
        prog = 95;
        clearInterval(progressRef.current);
      }
      setProgress(prog);
    }, 300);

    // Rotate AI messages
    let msgIdx = 0;
    messageRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % AI_MESSAGES.length;
      setAiMessage(AI_MESSAGES[msgIdx]);
    }, 2000);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const latinLanguages = ["french", "german", "spanish"];
      const res = await axios.post(
        `${API}/translate-pdf?target_language=${language}`,
        formData,
        { headers, responseType: "blob" }
      );

      clearInterval(progressRef.current);
      clearInterval(messageRef.current);
      setProgress(100);

      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setProcessingTime(elapsed);

      const isText = !latinLanguages.includes(language);
      const ext = isText ? "txt" : "pdf";
      const mime = isText ? "text/plain" : "application/pdf";
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const filename = `GenBI_${language}_${file.name}.${ext}`;

      setDownloadFn(() => () => {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });

      setTimeout(() => {
        setTranslating(false);
        setSuccess(true);
      }, 600);

    } catch (e) {
      clearInterval(progressRef.current);
      clearInterval(messageRef.current);
      setTranslating(false);
      setError("Translation failed. Please try again.");
      showToast("❌ Translation failed.", "error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setSuccess(false);
    setProgress(0);
    setError("");
    setDownloadFn(null);
  };

  return (
    <>
      {/* Loading overlay */}
      <AnimatePresence>
        {translating && (
          <TranslationProgress
            language={language}
            progress={progress}
            aiMessage={aiMessage}
          />
        )}
      </AnimatePresence>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <SuccessScreen
            language={language}
            pageCount={1}
            processingTime={processingTime}
            onDownload={downloadFn}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>

      {/* Main UI */}
      <div style={{
        flex: 1, padding: "28px 24px",
        maxWidth: 720, margin: "0 auto", width: "100%",
        overflowY: "auto",
      }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 20, marginBottom: 10,
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}>
              <span style={{ fontSize: 10 }}>✨</span>
              <span style={{ color: "#60A5FA", fontSize: 11, fontWeight: 600 }}>AI-Powered Translation</span>
            </div>
            <h2 style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800, margin: "0 0 6px 0" }}>
              🌍 PDF Translator
            </h2>
            <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
              Translate any PDF to 12 languages instantly using llama3.2 AI
            </p>
          </div>

          {/* Language Selector */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Select Target Language
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {LANGUAGES.map(l => (
                <motion.button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "10px 8px", borderRadius: 12,
                    background: language === l.id
                      ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(125,211,252,0.1))"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${language === l.id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)"}`,
                    cursor: "pointer", textAlign: "center",
                    boxShadow: language === l.id ? "0 4px 15px rgba(59,130,246,0.15)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{l.flag}</div>
                  <div style={{ color: language === l.id ? "#60A5FA" : "#9CA3AF", fontSize: 11, fontWeight: language === l.id ? 600 : 400 }}>
                    {l.label}
                  </div>
                  {l.rtl && (
                    <div style={{ color: "#4B5563", fontSize: 9, marginTop: 2 }}>RTL</div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Info banner */}
          <motion.div
            key={language}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>{lang?.flag}</span>
            <div>
              <p style={{ color: "#60A5FA", fontSize: 12, fontWeight: 600, margin: "0 0 2px 0" }}>
                Translating to {lang?.label} · {lang?.native}
                {lang?.rtl && " · Right-to-Left"}
              </p>
              <p style={{ color: "#4B5563", fontSize: 11, margin: 0 }}>
                {["french", "german", "spanish"].includes(language)
                  ? "✅ Downloads as beautifully formatted PDF"
                  : "📄 Downloads as Unicode text file (full character support)"}
              </p>
            </div>
          </motion.div>

          {/* Drop Zone */}
          <motion.div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("pdfTransInput").click()}
            animate={isDragging ? { scale: 1.02, borderColor: "#3B82F6" } : {}}
            style={{
              border: `2px dashed ${isDragging ? "#3B82F6" : file ? "rgba(34,197,94,0.4)" : "rgba(59,130,246,0.25)"}`,
              borderRadius: 20, padding: "36px 24px",
              textAlign: "center", cursor: "pointer",
              background: isDragging
                ? "rgba(59,130,246,0.06)"
                : file
                ? "rgba(34,197,94,0.04)"
                : "rgba(255,255,255,0.02)",
              marginBottom: 12, transition: "all 0.2s",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Shimmer */}
            {!file && (
              <motion.div
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.04), transparent)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            )}

            <motion.div
              animate={isDragging ? { scale: 1.2, rotate: 10 } : { scale: 1 }}
              style={{ fontSize: 44, marginBottom: 12 }}
            >
              {file ? "📄" : isDragging ? "📂" : "🌍"}
            </motion.div>

            {file ? (
              <>
                <p style={{ color: "#22c55e", fontSize: 15, fontWeight: 700, margin: "0 0 4px 0" }}>
                  ✅ {file.name}
                </p>
                <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
                  {(file.size / 1024).toFixed(1)} KB · Ready to translate
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "#E5E7EB", fontSize: 15, fontWeight: 600, margin: "0 0 4px 0" }}>
                  {isDragging ? "Drop your PDF here!" : "Drag & drop PDF or click to browse"}
                </p>
                <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
                  Supports any English PDF document
                </p>
              </>
            )}
            <input id="pdfTransInput" type="file" accept=".pdf"
              onChange={e => { setFile(e.target.files[0]); setError(""); setSuccess(false); }}
              style={{ display: "none" }} />
          </motion.div>

          {file && (
            <p
              onClick={() => { setFile(null); setSuccess(false); }}
              style={{ color: "#4B5563", fontSize: 11, cursor: "pointer", marginBottom: 12, textAlign: "right" }}
            >
              ✕ Remove file
            </p>
          )}

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          {/* Translate Button */}
          <motion.button
            onClick={handleTranslate}
            disabled={!file || translating}
            whileHover={file && !translating ? {
              scale: 1.02, y: -2,
              boxShadow: "0 12px 40px rgba(59,130,246,0.5)",
            } : {}}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%", padding: "16px",
              borderRadius: 16, fontSize: 16, fontWeight: 700,
              background: file
                ? "linear-gradient(135deg, #1e3a5f, #3B82F6, #60A5FA)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${file ? "rgba(125,211,252,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: file ? "white" : "#4B5563",
              cursor: file && !translating ? "pointer" : "not-allowed",
              boxShadow: file ? "0 4px 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 20 }}>{lang?.flag}</span>
            {`Translate to ${lang?.label} →`}
          </motion.button>

          {/* Bottom tips */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <p style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              How it works
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { icon: "📤", text: "Upload any English PDF" },
                { icon: "🤖", text: "llama3.2 AI translates content" },
                { icon: "🎨", text: "Formatting is preserved" },
                { icon: "⬇️", text: "Download in seconds" },
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{tip.icon}</span>
                  <span style={{ color: "#6B7280", fontSize: 11 }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
