import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import ChatArea from "../components/ChatArea";

export default function Home() {
  const [activeTool, setActiveTool] = useState("chat");
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex text-white">
      <LeftSidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
      <ChatArea
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeChat={activeChat}
        setChats={setChats}
        setActiveChat={setActiveChat}
      />
      <RightSidebar setActiveTool={setActiveTool} />
    </div>
  );
}