import { useState, useEffect, useRef, useCallback } from "react";
import { FaUserPlus } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { MdGroupAdd, MdLogin } from "react-icons/md";
import ChatItem from "./ChatItem";
import Modal from "./Modal";
import { chatSocket } from "../services/chatSocket";
import { toast } from "react-toastify";
import { formatTime } from "../utils";
import type {
  GetUserListSuccess,
  CheckUserExistSuccess,
  SocketResponse,
} from "../types/socket";

interface MessagePayload {
  name?: string;
  to?: string;
  mes?: string;
  content?: string;
  type?: string | "room" | "people";
}

interface ChatWithLastMessage {
  name: string;
  type: number;
  actionTime: string;
  online?: boolean;
  lastMessage?: string;
  lastSender?: string;
  lastIsOwn?: boolean;
}

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
  const IS_DEV = import.meta.env.DEV;
  const [openAddFriend, setOpenAddFriend] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatList, setChatList] = useState<GetUserListSuccess>([]);
  const [selectedChat, setSelectedChat] = useState<{
    name: string;
    type: number;
  } | null>(null);

  // State cho tìm kiếm bạn bè
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult>({
    found: false,
    username: "",
    searching: false,
  });

  // Ref để theo dõi online status đã check
  const checkedOnlineRef = useRef<Set<string>>(new Set());
  const onlineCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pendingOnlineChecksRef = useRef<string[]>([]);
  const onlineCheckQueueRef = useRef<string[]>([]); // Queue để track thứ tự check
  const hasAutoSelectedRef = useRef<boolean>(false); // Track auto-select chat đầu tiên
  const joinedRoomRef = useRef<string | null>(null); // Tránh join lại cùng 1 room nhiều lần

  // Batch check online status - gộp nhiều request thành 1 batch
  const batchCheckOnlineStatus = useCallback((usernames: string[]) => {
    // Lọc ra những user chưa check
    const newUsers = usernames.filter((u) => !checkedOnlineRef.current.has(u));
    if (newUsers.length === 0) return;

    // Thêm vào pending
    newUsers.forEach((u) => {
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
  const currentUsername = (localStorage.getItem("user") || "").toLowerCase();

  const bumpChatToTop = useCallback(
    (payload: MessagePayload) => {
      if (!payload) return;

      const sender = String(payload.name || "");
      const to = String(payload.to || "");
      const mes = String(payload.mes || payload.content || "");

      // ✅ hỗ trợ type: "room"/"people" hoặc 1/0 hoặc "1"/"0"
      const t = payload.type as any;
      const isRoom = t === "room" || t === 1 || t === "1" || t === true; // true nếu server gửi boolean

      // room: chatName = to (tên phòng)
      // people: chatName = người còn lại
      const chatName = isRoom
        ? to
        : sender.toLowerCase() === currentUsername
        ? to
        : sender;

      const chatType = isRoom ? 1 : 0;

      if (!chatName) {
        // debug nhanh nếu bạn muốn
        // console.log("bumpChatToTop missing chatName:", payload);
        return;
      }

      const lastIsOwn = sender.toLowerCase() === currentUsername;
      const lastSender = lastIsOwn ? "Bạn" : sender;

      setChatList((prev) => {
        const idx = prev.findIndex(
          (c) => c.type === chatType && c.name === chatName
        );

        const updatedItem: ChatWithLastMessage = {
          ...(idx >= 0 ? (prev[idx] as any) : {}),
          name: chatName,
          type: chatType,
          actionTime: Date.now().toString(),
          lastMessage: mes,
          lastSender,
          lastIsOwn,
        };

        const next = [...prev];
        if (idx >= 0) next.splice(idx, 1);
        next.unshift(updatedItem);
        return next as any;
      });
    },
    [currentUsername]
  );

  useEffect(() => {
    chatSocket.getUserList();

    // Lắng nghe response
    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "GET_USER_LIST" && response.status === "success") {
        const serverList = response.data || [];

        // Merge với local list để giữ lại những chat mới chưa có trên server
        setChatList((prevList) => {
          const merged = (serverList || []).map((serverChat: any) => {
            const local = prevList.find(
              (x: any) =>
                x.name === serverChat.name && x.type === serverChat.type
            ) as any;

            return {
              ...serverChat,
              lastMessage: serverChat.lastMessage ?? local?.lastMessage,
              lastSender: local?.lastSender,
              lastIsOwn: local?.lastIsOwn,
            };
          });

          const localOnly = prevList.filter(
            (localChat: any) =>
              !merged.some(
                (s: any) =>
                  s.name === localChat.name && s.type === localChat.type
              )
          );

          return [...merged, ...localOnly] as any;
        });

        // Tự động chọn chat đầu tiên khi reload (chỉ làm 1 lần)
        if (
          !hasAutoSelectedRef.current &&
          serverList &&
          serverList.length > 0
        ) {
          hasAutoSelectedRef.current = true;
          const firstChat = serverList[0];
          const chatName = firstChat.name || "";
          const chatType = firstChat.type === 1 ? "room" : "people";

          setSelectedChat({ name: chatName, type: firstChat.type });

          // Nếu là room, join room
          if (chatType === "room") {
            if (joinedRoomRef.current !== chatName) {
              joinedRoomRef.current = chatName;
              chatSocket.joinRoom(chatName);
            }
          }

          // Thông báo cho ChatApp component
          onChatSelect?.(
            chatType === "room" ? chatName : null,
            chatType === "people" ? chatName : null,
            chatType
          );
        }

        // Check online status cho tất cả people chats cùng lúc (batch)
        const peopleChats = (serverList || []).filter(
          (chat) => chat.type === 0
        );

        const usernames = peopleChats
          .map((chat) => chat.name)
          .filter((name): name is string => !!name);

        if (usernames.length > 0) {
          batchCheckOnlineStatus(usernames);
        }
      }

      // Xử lý response CHECK_USER_ONLINE
      if (
        response.event === "CHECK_USER_ONLINE" &&
        response.status === "success"
      ) {
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

      const event = response.event;

      // Debug: log tất cả events để xác định event nhận tin nhắn
      if (
        IS_DEV &&
        event !== "CHECK_USER_ONLINE" &&
        event !== "GET_USER_LIST"
      ) {
        console.log("🔔 Sidebar received event:", event, response);
      }

      if (
        event === "SEND_CHAT" ||
        event === "LOCAL_SEND_CHAT" ||
        event === "MESSAGE"
      ) {
        const messageData = (
          response as SocketResponse & { data: MessagePayload }
        ).data;
        bumpChatToTop(messageData);
        // Không gọi getUserList() ở đây vì sẽ ghi đè kết quả của bumpChatToTop
      }
    });

    // Check online status định kỳ mỗi 60 giây
    const interval = setInterval(() => {
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
  }, [batchCheckOnlineStatus, bumpChatToTop, onChatSelect]);

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
          chatSocket.getUserList();
        } else if (response.status === "error") {
          toast.error(response.mes?.toString() || "Lỗi khi tạo nhóm");
        }
        unsubscribe();
      }
    });

    chatSocket.createRoom(roomName.trim());
    setRoomName("");
    setOpenCreateGroup(false);
  };

  const handleJoinRoom = () => {
    const roomToJoin = searchQuery.trim();
    if (!roomToJoin) {
      toast.error("Vui lòng nhập tên phòng!");
      return;
    }

    // Nếu đang ở đúng room này rồi thì chỉ cần select
    if (joinedRoomRef.current === roomToJoin) {
      setSelectedChat({ name: roomToJoin, type: 1 });
      onChatSelect?.(roomToJoin, null, "room");
      setSearchQuery("");
      return;
    }

    const unsubscribe = chatSocket.onMessage((response) => {
      if (response.event === "JOIN_ROOM") {
        if (response.status === "success") {
          toast.success("Tham gia phòng thành công!");
          setSelectedChat({ name: roomToJoin, type: 1 });
          onChatSelect?.(roomToJoin, null, "room");
        } else if (response.status === "error") {
          toast.error(response.mes?.toString() || "Lỗi khi tham gia phòng");
        }
        unsubscribe();
      }
    });

    joinedRoomRef.current = roomToJoin;
    chatSocket.joinRoom(roomToJoin);
    setSearchQuery("");
  };

  const handleChatItemClick = (chat: GetUserListSuccess[0]) => {
    const chatName = chat.name || "";
    const chatType = chat.type === 1 ? "room" : "people";

    setSelectedChat({ name: chatName, type: chat.type });

    // Nếu là room chat, cần join room trước
    if (chatType === "room") {
      if (joinedRoomRef.current === chatName) {
        onChatSelect?.(chatName, null, "room");
        return;
      }

      const unsubscribe = chatSocket.onMessage((response) => {
        if (response.event === "JOIN_ROOM") {
          if (response.status === "success") {
            toast.success(`Đã join room: ${chatName}`);
          } else if (response.status === "error") {
            toast.error(`Join room failed: ${response.mes}`);
          }
          unsubscribe();
        }
      });
      joinedRoomRef.current = chatName;
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
      <div className="pt-4 pb-3 px-4 border-b border-gray-200">
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
            title="Add friend"
          >
            <FaUserPlus size={18} />
          </button>
          <button
            className="p-2 rounded hover:bg-primary-1/10 text-gray-600"
            onClick={() => setOpenCreateGroup(true)}
            title="Create Group"
          >
            <MdGroupAdd size={18} />
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chatList.length > 0 ? (
          chatList.map((chat, idx) => {
            const chatAny = chat as any;
            const isSelected =
              selectedChat?.name === chat.name &&
              selectedChat?.type === chat.type;
            return (
              <div
                key={`${chat.name || "unknown"}-${
                  chat.actionTime || idx
                }-${idx}`}
                onClick={() => handleChatItemClick(chat)}
                className={`cursor-pointer ${
                  isSelected ? "bg-primary-1/20" : ""
                }`}
              >
                <ChatItem
                  avatar={chat.name?.substring(0, 2).toUpperCase() || "??"}
                  name={chat.name || "Unknown"}
                  time={chat.actionTime ? formatTime(chat.actionTime) : ""}
                  lastMessage={
                    (chat as ChatWithLastMessage).lastMessage ||
                    (chat.type === 1 ? "Nhóm chat" : "Tin nhắn")
                  }
                  lastSender={chatAny.lastSender}
                  lastIsOwn={chatAny.lastIsOwn}
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
                      <p className="font-semibold text-gray-800">
                        {searchResult.username}
                      </p>
                      <p className="text-sm text-green-600">
                        Người dùng tồn tại
                      </p>
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
                  <p className="text-gray-600">
                    Không tìm thấy người dùng "{searchResult.username}"
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Vui lòng kiểm tra lại tên người dùng
                  </p>
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
