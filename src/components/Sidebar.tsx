import { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { MdGroupAdd, MdLogin } from "react-icons/md";
import ChatItem from "./ChatItem";
import Modal from "./Modal";
import { chatSocket } from "../services/chatSocket";
import { toast } from "react-toastify";
import { formatTime } from "../utils";
import type { GetUserListSuccess } from "../types/socket";

interface SidebarProps {
  onChatSelect?: (
    room: string | null,
    user: string | null,
    type: "room" | "people"
  ) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onChatSelect }) => {
  const [openAddFriend, setOpenAddFriend] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatList, setChatList] = useState<GetUserListSuccess>([]);
  const [selectedChat, setSelectedChat] = useState<{ name: string; type: number } | null>(null);

  const checkAndUpdateOnlineStatus = (username: string) => {
    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "CHECK_USER_ONLINE" && response.status === "success") {
        setChatList((prevList) =>
          prevList.map((chat) =>
            chat.name === username
              ? { ...chat, online: response.data.status }
              : chat
          )
        );
        unsubscribe();
      }
    });
    chatSocket.checkUserOnline(username);
  };

  useEffect(() => {
    chatSocket.getUserList();
    // Lắng nghe response
    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "GET_USER_LIST" && response.status === "success") {
        setChatList(response.data || []);

        // Check online status tuần tự cho từng user
        const peopleChats = (response.data || []).filter(
          (chat) => chat.type === 0
        );
        
        peopleChats.forEach((chat, index) => {
          if (chat.name) {
            setTimeout(() => {
              checkAndUpdateOnlineStatus(chat.name);
            }, index * 100);
          }
        });
      }
    });

    // Check online status định kỳ mỗi 60 giây
    const interval = setInterval(() => {
      chatSocket.getUserList();
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast.error("Vui lòng nhập tên nhóm!");
      return;
    }

    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "CREATE_ROOM") {
        if (response.status === "success") {
          toast.success("Tạo phòng thành công!");
          setRoomName("");
          setOpenCreateGroup(false);
        } else if (response.status === "error") {
          toast.error(response.mes?.toString() || "Lỗi khi tạo nhóm");
        } else {
          toast.success("Tạo phòng thành công!");
          setRoomName("");
          setOpenCreateGroup(false);
        }
        unsubscribe();
      }
    });

    chatSocket.createRoom(roomName.trim());
  };

  const handleJoinRoom = () => {
    if (!searchQuery.trim()) {
      toast.error("Vui lòng nhập tên phòng phòng!");
      return;
    }

    const unsubscribe = chatSocket.onMessage((response) => {
      console.log("response", response);
      if (response.event === "JOIN_ROOM") {
        if (response.status === "success") {
          toast.success("Tham gia phòng thành công!");
          setSearchQuery("");
          // Select the joined room
          const roomName = searchQuery.trim();
          setSelectedChat({ name: roomName, type: 1 });
          onChatSelect?.(roomName, null, "room");
        } else if (response.status === "error") {
          toast.error(response.mes?.toString() || "Lỗi khi tham gia phòng");
        }
        unsubscribe();
      }
    });

    chatSocket.joinRoom(searchQuery.trim());
  };

  const handleChatItemClick = (chat: GetUserListSuccess[0]) => {
    const chatName = chat.name || "";
    const chatType = chat.type === 1 ? "room" : "people";

    setSelectedChat({ name: chatName, type: chat.type });
    onChatSelect?.(
      chatType === "room" ? chatName : null,
      chatType === "people" ? chatName : null,
      chatType
    );
  };

  return (
    <div className="w-90 h-screen fixed top-0 left-0 mt-18 bg-white flex flex-col border-r border-gray-200 z-50">
      {/* Search bar + icons */}
      <div className="p-4 border-b border-gray-200">
        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <AiOutlineSearch size={22} />
            </span>
            <input
              type="text"
              placeholder="Nhập tên phòng để..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              className="w-full text-sm pl-10 pr-3 py-2 rounded-lg bg-primary-1/10 text-black focus:outline-none focus:ring-1 focus:ring-primary-1"
            />
          </div>
          <button
            className="p-2 rounded hover:bg-primary-1/10 text-gray-600"
            onClick={handleJoinRoom}
            title="Join Room"
          >
            <MdLogin size={18} />
          </button>
          <button
            className="p-2 rounded hover:bg-primary-1/10 text-gray-600"
            onClick={() => setOpenAddFriend(true)}
          >
            <FaUserPlus size={18} />
          </button>
          <button
            className="p-2 rounded hover:bg-primary-1/10 text-gray-600"
            onClick={() => setOpenCreateGroup(true)}
          >
            <MdGroupAdd size={18} />
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chatList.length > 0 ? (
          chatList.map((chat, idx) => {
            const isSelected = selectedChat?.name === chat.name && selectedChat?.type === chat.type;
            return (
              <div
                key={`${chat.name || "unknown"}-${chat.actionTime || idx}-${idx}`}
                onClick={() => handleChatItemClick(chat)}
                className={`cursor-pointer ${isSelected ? "bg-primary-1/20" : ""}`}
              >
                <ChatItem
                  avatar={chat.name?.substring(0, 2).toUpperCase() || "??"}
                  name={chat.name || "Unknown"}
                  time={chat.actionTime ? formatTime(chat.actionTime) : ""}
                  lastMessage={chat.type === 1 ? "Nhóm chat" : "Tin nhắn"}
                  online={chat.online}
                  type={chat.type}
                />
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            Chưa có cuộc trò chuyện nào
          </div>
        )}
      </div>

      {/* Modal Add Friend */}
      <Modal
        open={openAddFriend}
        onClose={() => setOpenAddFriend(false)}
        title="Thêm bạn"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nhập tên người dùng..."
            className="w-full text-lg px-4 py-2 rounded bg-primary-1/10 text-white placeholder-gray-400 focus:outline-none"
          />
          <button className="bg-primary-1 text-white font-semibold py-2 rounded">
            Tìm kiếm
          </button>
        </div>
      </Modal>

      {/* Modal Create Group */}
      <Modal
        open={openCreateGroup}
        onClose={() => setOpenCreateGroup(false)}
        title="Tạo nhóm"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nhập tên nhóm..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full text-lg px-4 py-2 rounded bg-primary-1/10 text-gray-800 placeholder-gray-800 focus:outline-none"
          />
          <button
            onClick={handleCreateRoom}
            className="bg-primary-1 text-white font-semibold py-2 rounded"
          >
            Tạo nhóm
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
