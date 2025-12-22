import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatView from "../components/ChatView";

interface ChatAppProps {
  onLogout: () => void;
}

const ChatApp: React.FC<ChatAppProps> = ({ onLogout }) => {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [chatType, setChatType] = useState<"room" | "people">("room");

  const handleChatSelect = (
    room: string | null,
    user: string | null,
    type: "room" | "people"
  ) => {
    setCurrentRoom(room);
    setCurrentUser(user);
    setChatType(type);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <Header onLogout={onLogout} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onChatSelect={handleChatSelect} />
        <div className="flex-1 overflow-hidden pl-90">
          <ChatView
            currentRoom={currentRoom}
            currentUser={currentUser}
            chatType={chatType}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
