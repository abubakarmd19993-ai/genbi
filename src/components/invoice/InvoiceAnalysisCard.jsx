import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoiceExportService } from "../../services/invoiceService";

function AnimatedNumber({ value, prefix = "" }) {
  const [display, setDisplay] = useState(0);
  const num = parseFloat(value) || 0;

  useEffect(() => {
    let start = 0;
    const steps = 40;
    const increment = num / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) { setDisplay(num); clearInterval(timer); }
      else setDisplay(Math.round(start * 100) / 100);
    }, 25);
    return () => clearInterval(timer);
  }, [num]);

  return <span>{prefix}{display.toLocaleString()}</span>;
}

function ValidationRow({ label, status, expected, actual, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", borderRadius: 10, marginBottom: 6,
        background: status === "ok" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${status === "ok" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: "spring" }}
        >
          {status === "ok" ? "✅" : "⚠️"}
        </motion.span>
        <span style={{ color: "#E5E7EB", fontSize: 12 }}>{label}</span>
      </div>
      {status !== "ok" && expected && (
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#ef4444", fontSize: 10, margin: 0 }}>Expected: {expected}</p>
          <p style={{ color: "#ef4444", fontSize: 10, margin: 0 }}>Found: {actual}</p>
        </div>
      )}
      {status === "ok" && (
        <span style={{ color: "#22c55e", fontSize: 11 }}>Verified</span>
      )}
    </motion.div>
  );
}

export default function InvoiceAnalysisCard({ result }) {
  const [showExport, setShowExport] = useState(false);
  const d = result?.invoice_data || {};
  const currency = d.currency || "$";

  const lineTotal = (d.line_items || []).reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
  const subtotalOk = !d.subtotal || Math.abs(lineTotal - d.subtotal) < 1;
  const taxExpected = d.subtotal && d.tax_rate ? (d.subtotal * d.tax_rate / 100) : null;
  const taxOk = !taxExpected || !d.tax_amount || Math.abs(taxExpected - d.tax_amount) < 1;
  const expectedTotal = (d.subtotal || 0) + (d.tax_amount || 0) - Math.abs(d.discount || 0);
  const totalOk = !d.total_amount || Math.abs(expectedTotal - d.total_amount) < 1;

  const anomalies = [];
  if (!d.invoice_number) anomalies.push("Missing invoice number");
  if (!d.vendor_name) anomalies.push("Missing vendor name");
  if (!d.invoice_date) anomalies.push("Missing invoice date");
  if (!subtotalOk) anomalies.push("Subtotal mismatch detected");
  if (!taxOk) anomalies.push("Tax calculation mismatch");
  if (!totalOk) anomalies.push("Total amount mismatch");

  const isVerified = anomalies.length === 0;

  const cardStyle = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "16px", marginBottom: 12,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%" }}>

      {/* Header */}
      <div style={{
        background: isVerified
          ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.1))"
          : "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(251,191,36,0.1))",
        border: `1px solid ${isVerified ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        borderRadius: 16, padding: "16px 20px", marginBottom: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🧾</span>
          <div>
            <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 15, margin: "0 0 2px 0" }}>Invoice Intelligence</p>
            <p style={{ color: "#9CA3AF", fontSize: 11, margin: 0 }}>{result?.filename} · {result?.processed_at}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: isVerified ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${isVerified ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: isVerified ? "#22c55e" : "#ef4444",
            }}
          >
            {isVerified ? "✓ Verified" : "⚠ Review Required"}
          </motion.span>

          {/* Export */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowExport(!showExport)}
              style={{
                padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                color: "#60A5FA", cursor: "pointer",
              }}
            >
              Export ▾
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  style={{
                    position: "absolute", right: 0, top: "110%", zIndex: 50,
                    background: "#0B1120", border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 12, padding: 8, minWidth: 180,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                  }}
                >
                  {[
                    { icon: "{}", label: "JSON Export", action: () => { invoiceExportService.toJSON(result); setShowExport(false); } },
                    { icon: "📋", label: "CSV Line Items", action: () => { invoiceExportService.toCSV(result); setShowExport(false); } },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action}
                      style={{
                        width: "100%", textAlign: "left", padding: "8px 12px",
                        borderRadius: 8, background: "transparent", border: "none",
                        color: "#9CA3AF", fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <p style={{ color: "#60A5FA", fontWeight: 600, fontSize: 13, margin: "0 0 10px 0", gridColumn: "1/-1" }}>
          📋 Invoice Information
        </p>
        {[
          ["Invoice #", d.invoice_number],
          ["Date", d.invoice_date],
          ["Due Date", d.due_date],
          ["Vendor", d.vendor_name],
          ["Client", d.client_name],
          ["Payment Terms", d.payment_terms],
          ["Currency", d.currency],
        ].map(([label, value], i) => value ? (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 12px" }}
          >
            <p style={{ color: "#6B7280", fontSize: 10, margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p style={{ color: "#E5E7EB", fontSize: 12, fontWeight: 500, margin: 0 }}>{value}</p>
          </motion.div>
        ) : null)}
      </div>

      {/* Financial Summary */}
      <div style={cardStyle}>
        <p style={{ color: "#60A5FA", fontWeight: 600, fontSize: 13, margin: "0 0 12px 0" }}>💰 Financial Summary</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Subtotal", value: d.subtotal, color: "#E5E7EB" },
            { label: `Tax${d.tax_rate ? ` (${d.tax_rate}%)` : ""}`, value: d.tax_amount, color: "#fbbf24" },
            { label: "Discount", value: d.discount ? d.discount : null, color: "#22c55e" },
          ].map(({ label, value, color }, i) => value ? (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#9CA3AF", fontSize: 13 }}>{label}</span>
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ color, fontSize: 13, fontWeight: 600 }}
              >
                <AnimatedNumber
                  value={parseFloat(String(value).replace("-", ""))}
                  prefix={value.toString().startsWith("-") ? `-${currency}` : currency}
                />
              </motion.span>
            </div>
          ) : null)}

          {d.total_amount && (
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 10, marginTop: 4,
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(125,211,252,0.05))",
              border: "1px solid rgba(59,130,246,0.2)",
            }}>
              <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700 }}>TOTAL</span>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                style={{ color: "#60A5FA", fontSize: 18, fontWeight: 800 }}
              >
                <AnimatedNumber value={d.total_amount} prefix={currency} />
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      {d.line_items && d.line_items.length > 0 && (
        <div style={cardStyle}>
          <p style={{ color: "#60A5FA", fontWeight: 600, fontSize: 13, margin: "0 0 12px 0" }}>
            📦 Line Items ({d.line_items.length})
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Description", "Qty", "Unit Price", "Total"].map(h => (
                    <th key={h} style={{ color: "#6B7280", textAlign: "left", padding: "6px 8px", fontWeight: 500, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.line_items.map((item, i) => (
                  <motion.tr key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ color: "#E5E7EB", padding: "8px" }}>{item.description}</td>
                    <td style={{ color: "#9CA3AF", padding: "8px", textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ color: "#9CA3AF", padding: "8px", textAlign: "right" }}>{item.unit_price ? `${currency}${item.unit_price}` : "-"}</td>
                    <td style={{ color: "#60A5FA", padding: "8px", textAlign: "right", fontWeight: 600 }}>{item.total ? `${currency}${item.total}` : "-"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Validation */}
      <div style={cardStyle}>
        <p style={{ color: "#60A5FA", fontWeight: 600, fontSize: 13, margin: "0 0 10px 0" }}>✅ Validation</p>
        <ValidationRow label="Line items check" status={subtotalOk ? "ok" : "error"} delay={0.1} />
        <ValidationRow label="Subtotal verification" status={subtotalOk ? "ok" : "error"} expected={lineTotal} actual={d.subtotal} delay={0.2} />
        <ValidationRow label="Tax/GST verification" status={taxOk ? "ok" : "error"} expected={taxExpected} actual={d.tax_amount} delay={0.3} />
        <ValidationRow label="Grand total verification" status={totalOk ? "ok" : "error"} expected={expectedTotal} actual={d.total_amount} delay={0.4} />
      </div>

      {/* Anomalies */}
      <div style={{
        ...cardStyle,
        background: anomalies.length > 0 ? "rgba(239,68,68,0.05)" : "rgba(34,197,94,0.05)",
        border: `1px solid ${anomalies.length > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`,
      }}>
        <p style={{ color: anomalies.length > 0 ? "#ef4444" : "#22c55e", fontWeight: 600, fontSize: 13, margin: "0 0 10px 0" }}>
          {anomalies.length > 0 ? `⚠️ ${anomalies.length} Issue${anomalies.length > 1 ? "s" : ""} Detected` : "✅ No Anomalies Detected"}
        </p>
        {anomalies.length > 0
          ? anomalies.map((a, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ color: "#ef4444", fontSize: 12, margin: "0 0 4px 0" }}>• {a}</motion.p>
            ))
          : <p style={{ color: "#22c55e", fontSize: 12, margin: 0 }}>The invoice passed all available validation checks.</p>
        }
      </div>
    </motion.div>
  );
}