import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ChatArea from "../components/ChatArea";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState("chat");
  const [chats, setChats] = useState([]);

  const handleNavigate = (id) => {
    setActiveTool(id);
  };

  const renderTool = () => {
    switch (activeTool) {
      case "dashboard":
        return <Dashboard />;
      default:
        return (
          <ChatArea
            activeTool={activeTool}
            setActiveTool={handleNavigate}
            setChats={setChats}
          />
        );
    }
  };

  return (
    <AppShell activeTool={activeTool} onNavigate={handleNavigate}>
      {renderTool()}
    </AppShell>
  );
}