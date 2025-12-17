import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatView from "../components/ChatView";

interface ChatAppProps {
  onLogout: () => void;
}

const ChatApp: React.FC<ChatAppProps> = ({ onLogout }) => {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <Header onLogout={onLogout} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-hidden pl-100">
          <ChatView />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
