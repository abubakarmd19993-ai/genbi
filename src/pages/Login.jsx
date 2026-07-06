import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API}/auth/login`,
        new URLSearchParams({ username, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" }}
      );
      login(res.data.access_token, username);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/auth/signup`, { username, password });
      setSuccess("Account created! Please login.");
      setIsLogin(true);
    } catch (e) {
      setError(e.response?.data?.detail || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#161b22] flex-col items-center justify-center p-12 border-r border-[#30363d]">
        <div className="text-8xl mb-6">🔮</div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#f78166] to-[#bc8cff] bg-clip-text text-transparent mb-4">
          GenBI
        </h1>
        <p className="text-gray-400 text-xl text-center mb-8">Your AI Universe</p>
        <div className="space-y-4 w-full max-w-sm">
          {[
            { icon: "📊", text: "Analyze any business data instantly" },
            { icon: "🤖", text: "RAG pipeline for intelligent Q&A" },
            { icon: "📈", text: "30-month sales forecasting" },
            { icon: "🧠", text: "ML, DL, NLP & Computer Vision" },
            { icon: "⚙️", text: "Universal file embeddings" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#0d0d0d] rounded-xl p-3 border border-[#30363d]">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-gray-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">🔮</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f78166] to-[#bc8cff] bg-clip-text text-transparent">
              GenBI
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Welcome back 👋" : "Create account ✨"}
          </h2>
          <p className="text-gray-400 mb-8">
            {isLogin ? "Login to your GenBI account" : "Join GenBI for free"}
          </p>

          {/* Tabs */}
          <div className="flex mb-6 bg-[#161b22] rounded-xl p-1 border border-[#30363d]">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isLogin ? "bg-[#f78166] text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              🔑 Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? "bg-[#f78166] text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              ✨ Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f78166] transition-all"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (isLogin ? handleLogin() : handleSignup())}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f78166] transition-all"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              onClick={isLogin ? handleLogin : handleSignup}
              disabled={loading}
              className="w-full bg-[#f78166] hover:bg-[#e06b52] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
            >
              {loading ? "Please wait..." : isLogin ? "Login →" : "Create Account →"}
            </button>
          </div>

          <p className="text-center text-gray-600 text-xs mt-8">
            One Stop AI Platform — Analytics • ML • DL • NLP • Computer Vision
          </p>
        </div>
      </div>
    </div>
  );
}