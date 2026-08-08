import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  { id: "load", label: "Document loaded" },
  { id: "scan", label: "Scanning document..." },
  { id: "detect", label: "Detecting invoice fields..." },
  { id: "vendor", label: "Identifying vendor and customer..." },
  { id: "items", label: "Extracting line items..." },
  { id: "totals", label: "Calculating totals..." },
  { id: "tax", label: "Verifying tax and GST..." },
  { id: "anomaly", label: "Checking for anomalies..." },
  { id: "done", label: "Finalizing invoice analysis..." },
];

export default function InvoiceProcessing({ filename }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= STAGES.length - 1) { clearInterval(timer); return prev; }
        return prev + 1;
      });
    }, 1200);

    const scanTimer = setInterval(() => {
      setScanY(prev => prev >= 100 ? 0 : prev + 2);
    }, 30);

    return () => { clearInterval(timer); clearInterval(scanTimer); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {/* Document Preview */}
        <div style={{
          width: 160, flexShrink: 0,
          background: "rgba(255,255,255,0.97)",
          borderRadius: 8, padding: 12, position: "relative",
          overflow: "hidden", minHeight: 200,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>
          {/* Scan line */}
          <motion.div
            style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent, #3B82F6, #7DD3FC, #3B82F6, transparent)",
              top: `${scanY}%`,
              boxShadow: "0 0 8px rgba(59,130,246,0.8)",
              zIndex: 10,
            }}
          />
          {/* Fake document content */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 12, background: "#1e3a5f", borderRadius: 2, marginBottom: 8, width: "60%" }} />
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 2, marginBottom: 4, width: "80%" }} />
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 2, marginBottom: 12, width: "70%" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, background: "#e5e7eb", borderRadius: 2 }} />
            ))}
          </div>
          <div style={{ height: 40, background: "#f3f4f6", borderRadius: 4, marginBottom: 8 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ height: 6, background: i === 0 ? "#3B82F6" : "#e5e7eb", borderRadius: 2, margin: "4px", width: `${70 + i * 5}%` }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
            <div style={{ height: 5, background: "#e5e7eb", borderRadius: 2, width: "40%" }} />
            <div style={{ height: 5, background: "#3B82F6", borderRadius: 2, width: "25%" }} />
          </div>
          <p style={{ position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", fontSize: 8, color: "#9CA3AF" }}>
            {filename}
          </p>
        </div>

        {/* Stages */}
        <div style={{ flex: 1 }}>
          <p style={{ color: "#60A5FA", fontWeight: 600, fontSize: 13, margin: "0 0 12px 0" }}>
            🔍 Invoice Intelligence
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STAGES.map((stage, i) => {
              const done = i < currentStage;
              const active = i === currentStage;
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: i <= currentStage ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px", borderRadius: 8,
                    background: done ? "rgba(34,197,94,0.06)" : active ? "rgba(59,130,246,0.08)" : "transparent",
                    border: `1px solid ${done ? "rgba(34,197,94,0.15)" : active ? "rgba(59,130,246,0.15)" : "transparent"}`,
                    transition: "all 0.3s",
                  }}
                >
                  {done ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 12 }}>✅</motion.span>
                  ) : active ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.3)", borderTopColor: "#3B82F6", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    color: done ? "#22c55e" : active ? "#60A5FA" : "#4B5563",
                  }}>
                    {stage.label}
                  </span>
                  {active && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ color: "#3B82F6", fontSize: 10, marginLeft: "auto" }}
                    >
                      ...
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}