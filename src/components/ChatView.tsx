import { useState, useRef, useEffect } from "react";
import {
  FaPhone,
  FaVideo,
  FaInfoCircle,
  FaSmile,
  FaPaperclip,
  FaImage,
} from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { IoMdSend } from "react-icons/io";
import EmojiPickerModal from "./EmojiPickerModal";
import MessageItem from "./MessageItem";
import MenuDropdown from "./MenuDropdown";
import { useChat } from "../hooks/useChat";
import { chatSocket } from "../services/chatSocket";
import { toast } from "react-toastify";
import { formatDateSeparator, getDateKey, encodeEmojiToShortcode } from "../utils";
import { uploadToCloudinary } from "../services/uploadService";

interface ChatViewProps {
  currentRoom?: string | null;
  currentUser?: string | null;
  chatType?: "room" | "people";
}

const ChatView: React.FC<ChatViewProps> = ({
  currentRoom = null,
  currentUser = null,
  chatType = "room",
}) => {
  const {
    messages,
    sendMessage: sendMessageViaSocket,
    addReaction,
  } = useChat({
    currentRoom,
    currentUser,
    chatType,
  });

  console.log("ChatView rendered with messages:", messages);

  const [inputValue, setInputValue] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedImageId, setExpandedImageId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(chatType === "people");
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileVideoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hoverHideTimeout = useRef<number | null>(null);

  const handleSendMessage = async () => {
    // Nếu có ảnh preview, gửi ảnh
    if (previewImage) {
      try {
        toast.info("Đang tải ảnh lên...");
        const imageUrl = await uploadToCloudinary(previewImage, 'image');
        sendMessageViaSocket(imageUrl);
        toast.success("Đã gửi ảnh!");
        
        // Xóa preview
        setPreviewImage(null);
        setPreviewImageUrl(null);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error("Lỗi khi tải ảnh. Vui lòng thử lại!");
      }
      return;
    }
    
    // Nếu không có ảnh, gửi text thông thường
    if (inputValue.trim()) {
      // Encode emoji thành shortcode để backend lưu được (text thông thường vẫn giữ nguyên)
      const encodedMessage = encodeEmojiToShortcode(inputValue);
      sendMessageViaSocket(encodedMessage);
      setInputValue("");
    }
  };

  const handleAddReaction = (messageId: number, emoji: string) => {
    addReaction(messageId, emoji);
    setHoveredMessageId(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(inputValue + emoji);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Kiểm tra xem có ảnh trong clipboard không
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Ngăn paste text mặc định
        
        const file = items[i].getAsFile();
        if (!file) continue;

        // Kiểm tra kích thước
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB");
          return;
        }

        // Tạo preview URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setPreviewImageUrl(imageData);
        };
        reader.readAsDataURL(file);
        
        // Lưu file để upload sau khi nhấn gửi
        setPreviewImage(file);
        return; // Chỉ xử lý ảnh đầu tiên
      }
    }
  };

  const handleHoverStart = (messageId: number) => {
    if (hoverHideTimeout.current) {
      clearTimeout(hoverHideTimeout.current);
      hoverHideTimeout.current = null;
    }
    setHoveredMessageId(messageId);
  };

  const handleHoverEnd = () => {
    if (hoverHideTimeout.current) {
      clearTimeout(hoverHideTimeout.current);
    }
    hoverHideTimeout.current = window.setTimeout(() => {
      setHoveredMessageId(null);
      hoverHideTimeout.current = null;
    }, 250);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check user online
  useEffect(() => {
    if (chatType === "people" && currentUser) {
      const checkOnline = () => {
        const unsubscribe = chatSocket.onMessage((response) => {
          if (
            response.event === "CHECK_USER_ONLINE" &&
            response.status === "success"
          ) {
            setIsOnline(response.data.status);
            unsubscribe();
          }
        });
        chatSocket.checkUserOnline(currentUser);
      };

      checkOnline();

      const interval = setInterval(() => {
        checkOnline();
      }, 60000);

      return () => {
        clearInterval(interval);
        setIsOnline(false);
      };
    }
  }, [chatType, currentUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB");
        return;
      }

      try {
        toast.info("Đang tải ảnh lên...");
        
        // Upload lên Cloudinary
        const imageUrl = await uploadToCloudinary(file, 'image');
        
        // Gửi URL thay vì base64
        sendMessageViaSocket(imageUrl);
        toast.success("Đã gửi ảnh!");
      } catch (error) {
        console.error('Upload error:', error);
        toast.error("Lỗi khi tải ảnh. Vui lòng thử lại!");
        
        // Fallback: Gửi base64 nếu upload thất bại (chỉ cho ảnh nhỏ)
        if (file.size < 500 * 1024) { // < 500KB
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target?.result as string;
            sendMessageViaSocket(imageData);
          };
          reader.readAsDataURL(file);
        }
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra loại file
      const isVideo = file.type.startsWith("video/");
      const isDocument =
        file.type.includes("pdf") ||
        file.type.includes("document") ||
        file.type.includes("text") ||
        file.type.includes("zip") ||
        file.type.includes("application");

      if (isVideo || isDocument) {
        // Kiểm tra kích thước (giới hạn 50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast.error("File quá lớn! Vui lòng chọn file nhỏ hơn 50MB");
          return;
        }

        try {
          toast.info("Đang tải file lên...");
          
          // Upload lên Cloudinary
          const resourceType = isVideo ? 'video' : 'raw';
          const fileUrl = await uploadToCloudinary(file, resourceType);
          
          // Gửi URL với tên file
          const message = isVideo
            ? `[VIDEO] ${file.name}\n${fileUrl}`
            : `[FILE] ${file.name}\n${fileUrl}`;
          sendMessageViaSocket(message);
          toast.success("Đã gửi file!");
        } catch (error) {
          console.error('Upload error:', error);
          toast.error("Lỗi khi tải file. Vui lòng thử lại!");
          
          // Fallback: Gửi base64 nếu upload thất bại (chỉ cho file nhỏ)
          if (file.size < 1024 * 1024) { // < 1MB
            const reader = new FileReader();
            reader.onload = (event) => {
              const fileData = event.target?.result as string;
              const message = isVideo
                ? `[VIDEO] ${file.name}\n${fileData}`
                : `[FILE] ${file.name}\n${fileData}`;
              sendMessageViaSocket(message);
            };
            reader.readAsDataURL(file);
          }
        }
      } else {
        toast.error("Vui lòng chọn file video hoặc tài liệu hợp lệ");
      }
    }
    if (fileVideoInputRef.current) {
      fileVideoInputRef.current.value = "";
    }
  };

  const displayName = currentRoom || currentUser || "Chat";

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative w-12 h-12 mr-3">
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
              {(displayName || "").substring(0, 2).toUpperCase()}
            </div>
            {chatType === "people" && isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-black">{displayName}</h2>
            <p className="text-xs text-gray-500">
              {chatType === "room"
                ? "Nhóm chat"
                : isOnline
                ? "Đang online"
                : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-primary-1/10 rounded-lg text-gray-600 transition">
            <FaPhone size={18} />
          </button>
          <button className="p-2 hover:bg-primary-1/10 rounded-lg text-gray-600 transition">
            <FaVideo size={18} />
          </button>
          <button className="p-2 hover:bg-primary-1/10 rounded-lg text-gray-600 transition">
            <FaInfoCircle size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gray-100">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Chưa có tin nhắn
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Check if we need to show a date separator
              const currentDateKey = message.createAt ? getDateKey(message.createAt) : "";
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevDateKey = prevMessage?.createAt ? getDateKey(prevMessage.createAt) : "";
              const showDateSeparator = currentDateKey && currentDateKey !== prevDateKey;

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
                        {formatDateSeparator(message.createAt!)}
                      </div>
                    </div>
                  )}
                  <MessageItem
                    message={message}
                    index={index}
                    isHovered={hoveredMessageId === message.id}
                    openMenuId={openMenuId}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                    onAddReaction={handleAddReaction}
                    onOpenMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
                    onExpandImage={setExpandedImageId}
                    MenuDropdown={MenuDropdown}
                  />
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200">
        {/* Hàng trên: các nút chức năng */}
        <div className="flex items-center gap-3 px-4 py-1 border-b border-gray-200">
          <button
            onClick={() => fileVideoInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
            title="File/Video"
          >
            <FaPaperclip size={20} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
            title="Chọn ảnh"
          >
            <FaImage size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={fileVideoInputRef}
            type="file"
            accept="video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            onChange={handleFileVideoUpload}
            className="hidden"
          />
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
          >
            <FaSmile size={20} />
          </button>
        </div>
        
        {/* Preview ảnh */}
        {previewImageUrl && (
          <div className="px-4 py-2">
            <div className="relative inline-block">
              <img 
                src={previewImageUrl} 
                alt="Preview" 
                className="max-w-xs max-h-40 rounded-lg border-2 border-primary-1"
              />
              <button
                onClick={() => {
                  setPreviewImage(null);
                  setPreviewImageUrl(null);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                title="Hủy"
              >
                <AiOutlineClose size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Hàng dưới: input và gửi */}
        <div className="flex items-center gap-3 py-2 pl-2 pr-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Nhập tin nhắn tới ${displayName}`}
            className="flex-1 px-4 py-2 rounded-full text-black placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="text-primary-1 p-1 hover:bg-primary-1/10 rounded-sm transition flex items-center justify-center"
          >
            <IoMdSend size={22} />
          </button>
        </div>

        {/* Emoji Picker Modal */}
        <EmojiPickerModal
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
        />

        {/* Image Viewer Modal */}
        {expandedImageId !== null && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setExpandedImageId(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={
                  messages.find((m) => m.id === expandedImageId)?.content || ""
                }
                alt="expanded"
                className="w-full h-full object-contain rounded-lg"
              />
              <button
                onClick={() => setExpandedImageId(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200 transition"
                title="Đóng"
              >
                <AiOutlineClose className="w-6 h-6 text-black" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;
