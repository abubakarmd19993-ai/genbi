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
    <div className="min-h-screen bg-[#0d0d0d] flex text-white">
      {/* Left Sidebar */}
      <LeftSidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />

      {/* Center — Chat Area */}
      <ChatArea
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeChat={activeChat}
        setChats={setChats}
        setActiveChat={setActiveChat}
      />

      {/* Right Sidebar */}
      <RightSidebar setActiveTool={setActiveTool} />
    </div>
  );
}