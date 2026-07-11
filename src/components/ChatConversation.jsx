import { useState, useRef, useEffect } from "react";
import { useConversations } from "../context/ConversationContext";

export default function ChatConversation({ conversation }) {
  const { sendMessage, loading } = useConversations();
  const [input, setInput] = useState("");
  const [fileId, setFileId] = useState(conversation.fileId || "");
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    if (stickToBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  useEffect(() => {
    setFileId(conversation.fileId || "");
  }, [conversation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    stickToBottom.current = atBottom;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    if (!fileId) {
      alert("Please paste a File ID to chat with your data.");
      return;
    }
    sendMessage(conversation.id, input.trim(), fileId);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col">
      <style>{`
        @keyframes msg-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .msg-animate { animation: msg-slide-in 0.3s ease-out; }
      `}</style>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`flex msg-animate ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#f78166] text-white"
                  : "bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-secondary)]"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <span>🔮</span>
                  <span className="text-[#f78166] text-xs font-medium">GenBI</span>
                </div>
              )}
              {msg.pending ? (
                <TypingDots />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask GenBI anything..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none text-sm"
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

function TypingDots() {
  return (
    <div className="flex items-center gap-2">
      <span>🔮</span>
      <span className="text-[var(--text-tertiary)] text-sm">GenBI is thinking...</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-[#f78166] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-1.5 h-1.5 bg-[#f78166] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-1.5 h-1.5 bg-[#f78166] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}