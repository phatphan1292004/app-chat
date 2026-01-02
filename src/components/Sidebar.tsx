import { useState, useEffect, useRef, useCallback } from "react";
import { FaUserPlus } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { MdGroupAdd, MdLogin } from "react-icons/md";
import ChatItem from "./ChatItem";
import Modal from "./Modal";
import { chatSocket } from "../services/chatSocket";
import { toast } from "react-toastify";
import { formatTime } from "../utils";
import type { GetUserListSuccess, CheckUserExistSuccess } from "../types/socket";

interface SidebarProps {
  onChatSelect?: (
    room: string | null,
    user: string | null,
    type: "room" | "people"
  ) => void;
}

interface SearchResult {
  found: boolean;
  username: string;
  searching: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onChatSelect }) => {
  const [openAddFriend, setOpenAddFriend] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatList, setChatList] = useState<GetUserListSuccess>([]);
  const [selectedChat, setSelectedChat] = useState<{ name: string; type: number } | null>(null);
  
  // State cho tìm kiếm bạn bè
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult>({
    found: false,
    username: "",
    searching: false,
  });
  
  // Ref để theo dõi online status đã check
  const checkedOnlineRef = useRef<Set<string>>(new Set());
  const onlineCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOnlineChecksRef = useRef<string[]>([]);
  const onlineCheckQueueRef = useRef<string[]>([]); // Queue để track thứ tự check

  // Batch check online status - gộp nhiều request thành 1 batch
  const batchCheckOnlineStatus = useCallback((usernames: string[]) => {
    // Lọc ra những user chưa check
    const newUsers = usernames.filter(u => !checkedOnlineRef.current.has(u));
    if (newUsers.length === 0) return;
    
    // Thêm vào pending
    newUsers.forEach(u => {
      if (!pendingOnlineChecksRef.current.includes(u)) {
        pendingOnlineChecksRef.current.push(u);
      }
    });
    
    // Clear timeout cũ và set timeout mới
    if (onlineCheckTimeoutRef.current) {
      clearTimeout(onlineCheckTimeoutRef.current);
    }
    
    onlineCheckTimeoutRef.current = setTimeout(() => {
      const usersToCheck = [...pendingOnlineChecksRef.current];
      pendingOnlineChecksRef.current = [];
      
      // Thêm vào queue để track thứ tự response
      onlineCheckQueueRef.current = [...usersToCheck];
      
      // Gọi check với delay nhỏ giữa các request để tránh spam
      usersToCheck.forEach((username, index) => {
        checkedOnlineRef.current.add(username);
        setTimeout(() => {
          chatSocket.checkUserOnline(username);
        }, index * 200); // 200ms giữa mỗi request
      });
    }, 500); // Đợi 500ms để gom batch
  }, []);

  useEffect(() => {
    chatSocket.getUserList();
    
    // Lắng nghe response
    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "GET_USER_LIST" && response.status === "success") {
        setChatList(response.data || []);

        // Check online status cho tất cả people chats cùng lúc (batch)
        const peopleChats = (response.data || []).filter(
          (chat) => chat.type === 0
        );
        
        const usernames = peopleChats
          .map(chat => chat.name)
          .filter((name): name is string => !!name);
        
        if (usernames.length > 0) {
          batchCheckOnlineStatus(usernames);
        }
      }
      
      // Xử lý response CHECK_USER_ONLINE
      if (response.event === "CHECK_USER_ONLINE" && response.status === "success") {
        // Lấy username từ queue (FIFO)
        const username = onlineCheckQueueRef.current.shift();
        if (username) {
          setChatList((prevList) =>
            prevList.map((chat) => 
              chat.name === username
                ? { ...chat, online: response.data?.status }
                : chat
            )
          );
        }
      }
    });

    // Check online status định kỳ mỗi 60 giây
    const interval = setInterval(() => {
      // Reset checked set để cho phép check lại
      checkedOnlineRef.current.clear();
      chatSocket.getUserList();
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      if (onlineCheckTimeoutRef.current) {
        clearTimeout(onlineCheckTimeoutRef.current);
      }
    };
  }, [batchCheckOnlineStatus]);

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
    const roomToJoin = searchQuery.trim();
    if (!roomToJoin) {
      toast.error("Vui lòng nhập tên phòng!");
      return;
    }

    const unsubscribe = chatSocket.onMessage((response) => {
      console.log("response", response);
      if (response.event === "JOIN_ROOM") {
        if (response.status === "success") {
          toast.success("Tham gia phòng thành công!");
          // Select the joined room - dùng biến đã lưu
          setSelectedChat({ name: roomToJoin, type: 1 });
          onChatSelect?.(roomToJoin, null, "room");
          // Refresh danh sách chat
          chatSocket.getUserList();
        } else if (response.status === "error") {
          toast.error(response.mes?.toString() || "Lỗi khi tham gia phòng");
        }
        unsubscribe();
      }
    });

    chatSocket.joinRoom(roomToJoin);
    setSearchQuery(""); // Reset sau khi đã lưu roomToJoin
  };

  const handleChatItemClick = (chat: GetUserListSuccess[0]) => {
    const chatName = chat.name || "";
    const chatType = chat.type === 1 ? "room" : "people";

    setSelectedChat({ name: chatName, type: chat.type });

    // Nếu là room chat, cần join room trước
    if (chatType === "room") {
      const unsubscribe = chatSocket.onMessage((response) => {
        if (response.event === "JOIN_ROOM") {
          if (response.status === "success") {
            console.log(`✅ Đã join room: ${chatName}`);
          } else if (response.status === "error") {
            // Nếu đã trong room hoặc lỗi khác, vẫn cho phép xem
            console.log(`⚠️ Join room response: ${response.mes}`);
          }
          unsubscribe();
        }
      });
      chatSocket.joinRoom(chatName);
    }

    onChatSelect?.(
      chatType === "room" ? chatName : null,
      chatType === "people" ? chatName : null,
      chatType
    );
  };

  // Tìm kiếm người dùng
  const handleSearchUser = () => {
    const username = friendSearchQuery.trim();
    if (!username) {
      toast.error("Vui lòng nhập tên người dùng!");
      return;
    }

    // Không cho phép tìm chính mình
    const currentUser = localStorage.getItem("user");
    if (username.toLowerCase() === currentUser?.toLowerCase()) {
      toast.error("Bạn không thể tìm chính mình!");
      return;
    }

    setSearchResult({ found: false, username: "", searching: true });

    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "CHECK_USER_EXIST") {
        if (response.status === "success") {
          const data = response.data as CheckUserExistSuccess;
          if (data.status) {
            setSearchResult({
              found: true,
              username: username,
              searching: false,
            });
            toast.success(`Đã tìm thấy người dùng "${username}"!`);
          } else {
            setSearchResult({
              found: false,
              username: username,
              searching: false,
            });
            toast.error(`Không tìm thấy người dùng "${username}"!`);
          }
        } else {
          setSearchResult({
            found: false,
            username: "",
            searching: false,
          });
          toast.error(response.mes?.toString() || "Lỗi khi tìm kiếm");
        }
        unsubscribe();
      }
    });

    chatSocket.checkUserExist(username);
  };

  // Bắt đầu chat với người dùng đã tìm thấy
  const handleStartChat = () => {
    if (!searchResult.found || !searchResult.username) return;

    const username = searchResult.username;
    
    // Chọn user để chat
    setSelectedChat({ name: username, type: 0 });
    onChatSelect?.(null, username, "people");
    
    // Reset modal state
    setFriendSearchQuery("");
    setSearchResult({ found: false, username: "", searching: false });
    setOpenAddFriend(false);
    
    toast.success(`Đang mở cuộc trò chuyện với ${username}`);
  };

  // Reset search state khi đóng modal
  const handleCloseAddFriend = () => {
    setFriendSearchQuery("");
    setSearchResult({ found: false, username: "", searching: false });
    setOpenAddFriend(false);
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
        onClose={handleCloseAddFriend}
        title="Tìm bạn để nhắn tin"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tên người dùng..."
              value={friendSearchQuery}
              onChange={(e) => setFriendSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
              className="flex-1 text-lg px-4 py-2 rounded bg-primary-1/10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-1"
            />
            <button
              onClick={handleSearchUser}
              disabled={searchResult.searching}
              className="bg-primary-1 text-white font-semibold px-4 py-2 rounded hover:bg-primary-1/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchResult.searching ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>

          {/* Kết quả tìm kiếm */}
          {searchResult.username && !searchResult.searching && (
            <div className="mt-2 p-4 rounded-lg bg-gray-100">
              {searchResult.found ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-1 flex items-center justify-center text-white font-bold text-lg">
                      {searchResult.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{searchResult.username}</p>
                      <p className="text-sm text-green-600">Người dùng tồn tại</p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartChat}
                    className="bg-green-500 text-white font-semibold px-4 py-2 rounded hover:bg-green-600"
                  >
                    Nhắn tin
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-gray-600">Không tìm thấy người dùng "{searchResult.username}"</p>
                  <p className="text-sm text-gray-400 mt-1">Vui lòng kiểm tra lại tên người dùng</p>
                </div>
              )}
            </div>
          )}
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
