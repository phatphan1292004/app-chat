import React from "react";

interface ChatItemProps {
  avatar: string;
  name: string;
  time: string;
  lastMessage: string;
}

const ChatItem: React.FC<ChatItemProps> = ({ avatar, name, time, lastMessage }) => {
  return (
    <div className="flex items-center px-4 py-3 hover:bg-[#2A3942] cursor-pointer">
      <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold mr-3">{avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-xl text-white">{name}</span>
          <span className="text-sm text-gray-400">{time}</span>
        </div>
        <div className="text-gray-400 text-lg truncate">{lastMessage}</div>
      </div>
    </div>
  );
};

export default ChatItem;
