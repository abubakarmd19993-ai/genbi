import { useParams, useNavigate } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import ChatArea from "../components/ChatArea";
import ChatConversation from "../components/ChatConversation";
import NotFound from "../components/NotFound";
import { useConversations } from "../context/ConversationContext";

const KNOWN_TOOLS = ["upload", "forecast", "files", "history", "embed"];

export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getConversation } = useConversations();

  const isTool = KNOWN_TOOLS.includes(id);
  const conversation = !isTool ? getConversation(id) : null;

  const switchTool = (newTool) => {
    if (newTool === "chat") {
      navigate("/");
      return;
    }
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
        <span className="text-[var(--text-primary)] text-sm capitalize truncate max-w-[300px]">
          {isTool ? id : conversation?.title || "Chat"}
        </span>
      </div>

      <div className="flex flex-1">
        <LeftSidebar activeTool={isTool ? id : "chat"} setActiveTool={switchTool} />

        {isTool ? (
          <ChatArea activeTool={id} setActiveTool={switchTool} />
        ) : conversation ? (
          <ChatConversation conversation={conversation} />
        ) : (
          <NotFound />
        )}

        <RightSidebar setActiveTool={switchTool} />
      </div>
    </div>
  );
}