import { useState, useEffect } from "react";

export default function AILoading() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = [
    "Reading your data...",
    "Crunching the numbers...",
    "Connecting the dots...",
    "Almost there...",
  ];

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
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
          <div
            className="genbi-ring absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #f78166, #bc8cff, #58a6ff, #f78166)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0)",
            }}
          ></div>
          <div className="genbi-orb w-3.5 h-3.5 rounded-full bg-[#0d0d0d] flex items-center justify-center text-[10px]">
            🔮
          </div>
        </div>
        <span key={phraseIndex} className="genbi-phrase text-gray-400 text-sm min-w-[160px]">
          {phrases[phraseIndex]}
        </span>
      </div>
    </div>
  );
}