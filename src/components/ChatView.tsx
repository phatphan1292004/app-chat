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
import {
  formatDateSeparator,
  getDateKey,
  encodeEmojiToShortcode,
} from "../utils";
import { uploadToCloudinary } from "../services/uploadService";
import type { Message } from "../types/message.js";

// ✅ cần các util này để preview reply đúng (nếu bạn chưa export thì export thêm)
import {
  decodeEmojiFromShortcode,
  isImageLike,
  isStickerMarker,
  getStickerContent,
} from "../utils";

interface ChatViewProps {
  currentRoom?: string | null;
  currentUser?: string | null;
  chatType?: "room" | "people";
}

type ReplyTo = {
  id: number;
  sender: string;
  previewText: string;
};

const MAX_REPLY_PREVIEW = 140;

// ✅ tạo preview cho thanh "Trả lời ..."
const makeReplyPreview = (msg: Message): string => {
  const raw = msg.content || "";

  // file/video marker
  if (raw.startsWith("[VIDEO]")) return "🎬 Video";
  if (raw.startsWith("[FILE]")) return "📎 Tệp";

  // sticker
  if (msg.isSticker) {
    if (isStickerMarker(raw)) return getStickerContent(raw) || "😊 Sticker";
    if (isImageLike(raw)) return "🖼️ Sticker ảnh";
    return "😊 Sticker";
  }

  // ảnh
  if (isImageLike(raw)) return "🖼️ Ảnh";

  // text
  const decoded = decodeEmojiFromShortcode(raw);
  return (
    decoded.replace(/\s+/g, " ").trim().slice(0, MAX_REPLY_PREVIEW) ||
    "Tin nhắn"
  );
};

const buildReplyPayload = (reply: ReplyTo, actualContent: string) => {
  // Format gửi: [REPLY]{json}\n<content>
  const meta = {
    id: reply.id,
    sender: reply.sender,
    text: reply.previewText,
  };
  return `[REPLY]${JSON.stringify(meta)}\n${actualContent}`;
};

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

  const [inputValue, setInputValue] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedImageId, setExpandedImageId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(chatType === "people");

  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // ✅ reply state
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileVideoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hoverHideTimeout = useRef<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    // 1) gửi ảnh preview (paste)
    if (previewImage) {
      try {
        toast.info("Đang tải ảnh lên...");
        const imageUrl = await uploadToCloudinary(previewImage, "image");

        const payload = replyTo
          ? buildReplyPayload(replyTo, imageUrl)
          : imageUrl;
        sendMessageViaSocket(payload);

        toast.success("Đã gửi ảnh!");
        setPreviewImage(null);
        setPreviewImageUrl(null);
        setReplyTo(null);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Lỗi khi tải ảnh. Vui lòng thử lại!");
      }
      return;
    }

    // 2) gửi text
    if (inputValue.trim()) {
      const encodedMessage = encodeEmojiToShortcode(inputValue);
      const payload = replyTo
        ? buildReplyPayload(replyTo, encodedMessage)
        : encodedMessage;

      sendMessageViaSocket(payload);
      setInputValue("");
      setReplyTo(null);
    }
  };

  const handleAddReaction = (messageId: number, emoji: string) => {
    addReaction(messageId, emoji);
    setHoveredMessageId(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  // ✅ paste ảnh -> show preview
  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();

        const file = items[i].getAsFile();
        if (!file) continue;

        if (file.size > 10 * 1024 * 1024) {
          toast.error("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) =>
          setPreviewImageUrl(event.target?.result as string);
        reader.readAsDataURL(file);

        setPreviewImage(file);
        return;
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
    if (hoverHideTimeout.current) clearTimeout(hoverHideTimeout.current);
    hoverHideTimeout.current = window.setTimeout(() => {
      setHoveredMessageId(null);
      hoverHideTimeout.current = null;
    }, 250);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      const interval = setInterval(() => checkOnline(), 60000);

      return () => {
        clearInterval(interval);
        setIsOnline(false);
      };
    }
  }, [chatType, currentUser]);

  // ✅ chọn ảnh từ file
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB");
        return;
      }

      try {
        toast.info("Đang tải ảnh lên...");
        const imageUrl = await uploadToCloudinary(file, "image");

        const payload = replyTo
          ? buildReplyPayload(replyTo, imageUrl)
          : imageUrl;
        sendMessageViaSocket(payload);

        toast.success("Đã gửi ảnh!");
        setReplyTo(null);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Lỗi khi tải ảnh. Vui lòng thử lại!");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ file/video
  const handleFileVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      if (fileVideoInputRef.current) fileVideoInputRef.current.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isDocument =
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text") ||
      file.type.includes("zip") ||
      file.type.includes("application");

    if (!isVideo && !isDocument) {
      toast.error("Vui lòng chọn file video hoặc tài liệu hợp lệ");
      if (fileVideoInputRef.current) fileVideoInputRef.current.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File quá lớn! Vui lòng chọn file nhỏ hơn 50MB");
      if (fileVideoInputRef.current) fileVideoInputRef.current.value = "";
      return;
    }

    try {
      toast.info("Đang tải file lên...");
      const resourceType = isVideo ? "video" : "raw";
      const fileUrl = await uploadToCloudinary(file, resourceType);

      const message = isVideo
        ? `[VIDEO] ${file.name}\n${fileUrl}`
        : `[FILE] ${file.name}\n${fileUrl}`;

      const payload = replyTo ? buildReplyPayload(replyTo, message) : message;
      sendMessageViaSocket(payload);

      toast.success("Đã gửi file!");
      setReplyTo(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Lỗi khi tải file. Vui lòng thử lại!");
    }

    if (fileVideoInputRef.current) fileVideoInputRef.current.value = "";
  };

  const displayName = currentRoom || currentUser || "Chat";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gray-100">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Chưa có tin nhắn
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const currentDateKey = message.createAt
                ? getDateKey(message.createAt)
                : "";
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevDateKey = prevMessage?.createAt
                ? getDateKey(prevMessage.createAt)
                : "";
              const showDateSeparator =
                currentDateKey && currentDateKey !== prevDateKey;

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
                    onOpenMenu={(id) =>
                      setOpenMenuId(openMenuId === id ? null : id)
                    }
                    onExpandImage={setExpandedImageId}
                    onReply={(msg) => {
                      setReplyTo({
                        id: msg.id,
                        sender: msg.sender,
                        previewText: makeReplyPreview(msg),
                      });
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    MenuDropdown={MenuDropdown}
                  />
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200">
        {/* toolbar */}
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
            title="Emoji"
          >
            <FaSmile size={20} />
          </button>
        </div>

        {/* ✅ Reply bar */}
        {replyTo && (
          <div className="px-4 py-2 border-b border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">
                  Trả lời{" "}
                  <span className="font-semibold text-gray-700">
                    {replyTo.sender}
                  </span>
                </p>
                <p className="text-sm text-gray-700 truncate max-w-[520px]">
                  {replyTo.previewText}
                </p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
                title="Hủy trả lời"
              >
                <AiOutlineClose size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Preview paste image */}
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

        {/* input + send */}
        <div className="flex items-center gap-3 py-2 pl-2 pr-4">
          <input
            ref={inputRef}
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
            title="Gửi"
          >
            <IoMdSend size={22} />
          </button>
        </div>

        <EmojiPickerModal
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
        />

        {/* Image viewer */}
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
