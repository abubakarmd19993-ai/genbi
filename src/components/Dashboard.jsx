import { useState } from "react";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ZAxis
} from "recharts";

const API = "http://127.0.0.1:8000";
const COLORS = ["#f78166", "#bc8cff", "#58a6ff", "#3fb950", "#ffa657", "#ff7b72", "#79c0ff", "#d2a8ff"];

export default function Dashboard({ headers }) {
  const [file, setFile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/dashboard`, formData, { headers });
      setDashboard(res.data);
      showToast("📊 Dashboard generated!", "success");
    } catch (e) {
      showToast("❌ Dashboard generation failed.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 p-8 w-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-2">📊 Auto Dashboard</h2>
      <p className="text-gray-400 mb-6">Upload your data and get an instant visual dashboard</p>

      <div className="flex gap-4 mb-6">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-gray-400 text-sm"
        />
        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="bg-[#f78166] hover:bg-[#e06b52] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all"
        >
          {loading ? "Generating..." : "📊 Generate Dashboard"}
        </button>
      </div>

      {dashboard && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.kpis?.map((kpi, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
                <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs mt-1" style={{ color: COLORS[i % COLORS.length] }}>{kpi.sublabel}</p>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Bar Chart */}
            {dashboard.bar_data && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
                <p className="text-white font-semibold mb-4">📊 {dashboard.bar_title}</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboard.bar_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {dashboard.bar_data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie Chart */}
            {dashboard.pie_data && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
                <p className="text-white font-semibold mb-4">🥧 {dashboard.pie_title}</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboard.pie_data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboard.pie_data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Line Chart */}
            {dashboard.line_data && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
                <p className="text-white font-semibold mb-4">📈 {dashboard.line_title}</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dashboard.line_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="value" stroke="#f78166" strokeWidth={2} dot={{ fill: "#f78166" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Scatter Plot */}
            {dashboard.scatter_data && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
                <p className="text-white font-semibold mb-4">🔵 {dashboard.scatter_title}</p>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="x" name="Index" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis dataKey="y" name="Value" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <ZAxis range={[40, 40]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px" }}
                    />
                    <Scatter data={dashboard.scatter_data} fill="#bc8cff" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Heatmap (simple grid) */}
          {dashboard.heatmap_data && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
              <p className="text-white font-semibold mb-4">🌡️ {dashboard.heatmap_title}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-gray-500 text-left py-2 pr-4">Category</th>
                      {dashboard.heatmap_cols?.map((col, i) => (
                        <th key={i} className="text-gray-500 py-2 px-2 text-center">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.heatmap_data?.map((row, i) => (
                      <tr key={i}>
                        <td className="text-gray-300 py-2 pr-4 font-medium">{row.name}</td>
                        {row.values?.map((val, j) => {
                          const max = Math.max(...dashboard.heatmap_data.flatMap(r => r.values));
                          const intensity = max > 0 ? val / max : 0;
                          return (
                            <td key={j} className="py-2 px-2 text-center rounded">
                              <div
                                className="rounded px-2 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor: `rgba(247, 129, 102, ${intensity * 0.8 + 0.1})`,
                                  color: intensity > 0.5 ? "white" : "#9ca3af"
                                }}
                              >
                                {val?.toLocaleString()}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Insight */}
          {dashboard.ai_insight && (
            <div className="bg-[#161b22] border border-[#bc8cff]/30 rounded-2xl p-6">
              <p className="text-[#bc8cff] font-semibold mb-2">🔮 Dashboard Insight</p>
              <p className="text-gray-300 text-sm leading-relaxed">{dashboard.ai_insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}