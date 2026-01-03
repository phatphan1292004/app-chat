import React from "react";
import { MdGroups } from "react-icons/md";

interface ChatItemProps {
  avatar: string;
  name: string;
  time: string;
  lastMessage: string;
  type: number;
  online?: boolean;
}

const ChatItem: React.FC<ChatItemProps> = ({
  avatar,
  name,
  time,
  lastMessage,
  type,
  online = false,
}) => {
  return (
    <div className="flex items-center px-4 py-3 hover:bg-primary-1/10">
      <div className="relative w-12 h-12 mr-3">
        <div className="w-12 h-12 rounded-full bg-primary-1 flex items-center justify-center text-white font-bold">
          {type === 1 ? <MdGroups size={24} /> : avatar}
        </div>
        {type === 0 &&  (
          <div
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              online ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600">{name}</span>
          <span className="text-[13px] text-gray-400">{time}</span>
        </div>
        <div className="text-gray-400 text-sm truncate">{lastMessage}</div>
      </div>
    </div>
  );
};

export default ChatItem;
