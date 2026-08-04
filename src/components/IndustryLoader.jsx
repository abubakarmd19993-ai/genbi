import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRY_THEMES = {
  retail: {
    icon: "🛒",
    color: "#f78166",
    label: "Retail Intelligence",
    phrases: [
      "Scanning product catalog...",
      "Analyzing sales trends...",
      "Checking inventory levels...",
      "Identifying top performers...",
      "Calculating revenue mix...",
      "Generating retail insights...",
    ],
    particles: ["🛍️", "📦", "💳", "🏪", "🏷️"],
  },
  finance: {
    icon: "💰",
    color: "#3fb950",
    label: "Financial Intelligence",
    phrases: [
      "Analyzing loan portfolio...",
      "Calculating risk scores...",
      "Checking default rates...",
      "Evaluating creditworthiness...",
      "Computing interest metrics...",
      "Generating financial report...",
    ],
    particles: ["💵", "📈", "🏦", "💳", "📊"],
  },
  healthcare: {
    icon: "🏥",
    color: "#58a6ff",
    label: "Healthcare Intelligence",
    phrases: [
      "Analyzing patient data...",
      "Checking health metrics...",
      "Evaluating treatment outcomes...",
      "Computing health trends...",
      "Identifying risk factors...",
      "Generating health insights...",
    ],
    particles: ["💊", "🩺", "❤️", "🧬", "🩻"],
  },
  hr: {
    icon: "👥",
    color: "#bc8cff",
    label: "HR Intelligence",
    phrases: [
      "Analyzing workforce data...",
      "Computing attrition risk...",
      "Evaluating performance...",
      "Checking salary equity...",
      "Identifying retention gaps...",
      "Generating HR insights...",
    ],
    particles: ["👔", "📋", "🎯", "🏆", "💼"],
  },
  marketing: {
    icon: "📱",
    color: "#ffa657",
    label: "Marketing Intelligence",
    phrases: [
      "Analyzing campaign data...",
      "Computing ROI metrics...",
      "Evaluating channel performance...",
      "Checking conversion rates...",
      "Calculating customer CAC...",
      "Generating marketing insights...",
    ],
    particles: ["📣", "🎯", "📊", "💡", "🚀"],
  },
  manufacturing: {
    icon: "🏭",
    color: "#ff7b72",
    label: "Manufacturing Intelligence",
    phrases: [
      "Analyzing production data...",
      "Computing efficiency metrics...",
      "Checking defect rates...",
      "Evaluating machine performance...",
      "Calculating OEE scores...",
      "Generating factory insights...",
    ],
    particles: ["⚙️", "🔧", "🏗️", "📐", "🔩"],
  },
  ecommerce: {
    icon: "🛍️",
    color: "#79c0ff",
    label: "E-Commerce Intelligence",
    phrases: [
      "Analyzing order data...",
      "Computing return rates...",
      "Evaluating seller metrics...",
      "Checking fulfillment speed...",
      "Calculating customer LTV...",
      "Generating ecommerce insights...",
    ],
    particles: ["📦", "🚚", "⭐", "💳", "🏪"],
  },
  general: {
    icon: "🔮",
    color: "#bc8cff",
    label: "Business Intelligence",
    phrases: [
      "Analyzing business data...",
      "Computing key metrics...",
      "Identifying patterns...",
      "Evaluating performance...",
      "Generating insights...",
      "Preparing consultation...",
    ],
    particles: ["📊", "💡", "🎯", "📈", "🔍"],
  },
};

export default function IndustryLoader({ industry = "general" }) {
  const theme = INDUSTRY_THEMES[industry] || INDUSTRY_THEMES.general;
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [particlePositions] = useState(() =>
    theme.particles.map(() => ({
      x: Math.random() * 300 - 150,
      y: Math.random() * 300 - 150,
      delay: Math.random() * 2,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % theme.phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [theme.phrases.length]);

  return (
    <div className="flex justify-start my-4">
      <div
        className="relative rounded-2xl p-6 max-w-sm overflow-hidden"
        style={{
          background: "rgba(22, 27, 34, 0.95)",
          border: `1px solid ${theme.color}30`,
          boxShadow: `0 0 30px ${theme.color}15`,
        }}
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {theme.particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute text-lg"
              style={{
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [0, particlePositions[i].x, 0],
                y: [0, particlePositions[i].y, 0],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: particlePositions[i].delay,
                ease: "easeInOut",
              }}
            >
              {particle}
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            {/* Animated icon */}
            <motion.div
              className="relative w-12 h-12 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              {/* Spinning ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${theme.color}, transparent, ${theme.color})`,
                  padding: "2px",
                }}
              >
                <div className="w-full h-full rounded-full bg-[#161b22]" />
              </motion.div>
              {/* Icon */}
              <motion.span
                className="relative z-10 text-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {theme.icon}
              </motion.span>
            </motion.div>

            <div>
              <p className="text-white font-semibold text-sm">{theme.label}</p>
              <p className="text-xs" style={{ color: theme.color }}>AI Analysis Running</p>
            </div>
          </div>

          {/* Animated phrase */}
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              className="text-gray-400 text-xs mb-4"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4 }}
            >
              {theme.phrases[phraseIndex]}
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-full bg-[#0d0d0d] rounded-full h-1.5 mb-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.color}80)` }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Wave bars */}
          <div className="flex items-end gap-1 h-8 justify-center">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ background: theme.color, minHeight: 3 }}
                animate={{ height: [3, Math.random() * 24 + 4, 3] }}
                transition={{
                  duration: 0.6 + Math.random() * 0.4,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}