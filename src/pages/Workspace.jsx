import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import ChatArea from "../components/ChatArea";

export default function Workspace() {
  const { tool } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const switchTool = (newTool) => {
    navigate(`/workspace/${newTool}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col text-[var(--text-primary)]">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-panel)]">
        <button
          onClick={() => navigate("/")}
          className="text-[var(--text-secondary)] hover:text-[#f78166] text-sm flex items-center gap-1 transition-all"
          title="Back to Dashboard"
        >
          ← Dashboard
        </button>
        <span className="text-[var(--text-quaternary)] text-xs">/</span>
        <span className="text-[var(--text-primary)] text-sm capitalize">{tool}</span>
      </div>

      <div className="flex flex-1">
        <LeftSidebar
          chats={chats}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          activeTool={tool}
          setActiveTool={switchTool}
        />
        <ChatArea
          activeTool={tool}
          setActiveTool={switchTool}
          activeChat={activeChat}
          setChats={setChats}
          setActiveChat={setActiveChat}
        />
        <RightSidebar setActiveTool={switchTool} />
      </div>
    </div>
  );
}