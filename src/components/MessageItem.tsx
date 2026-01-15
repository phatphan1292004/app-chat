import { FaReply } from "react-icons/fa";
import {
  FaFileAlt,
  FaFilePdf,
  FaFileArchive,
  FaFileWord,
} from "react-icons/fa";
import type { Message } from "../types/message.js";
import {
  isImageLike,
  isStickerMarker,
  getStickerContent,
  decodeEmojiFromShortcode,
} from "../utils";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

type ReplyMeta = { id: number; sender: string; text: string };

const getUserColor = (username: string): string => {
  if (!username) return "bg-blue-400";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-rose-500",
  ];
  return colors[Math.abs(hash) % colors.length];
};

interface MessageItemProps {
  message: Message;
  index: number;
  isHovered: boolean;
  openMenuId: number | null;
  onHoverStart: (messageId: number) => void;
  onHoverEnd: () => void;
  onAddReaction: (messageId: number, emoji: string) => void;
  onOpenMenu: (messageId: number) => void;
  onExpandImage: (messageId: number) => void;
  onReply: (message: Message) => void;
  MenuDropdown: React.ComponentType<{ isOwn: boolean }>;
}

const ActionButton: React.FC<{
  icon: React.ComponentType<{ size: number }>;
  title: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ icon: Icon, title, onClick }) => (
  <button
    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"
    title={title}
    onClick={onClick}
  >
    <Icon size={14} />
  </button>
);

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  isHovered,
  openMenuId,
  onHoverStart,
  onHoverEnd,
  onAddReaction,
  onExpandImage,
  onReply,
  MenuDropdown,
}) => {
  const showAvatar = index === 0 || (index > 0 && message.sender !== undefined);
  const avatarColor = getUserColor(message.sender || "");

  // Parse reply wrapper: [REPLY]{json}\n<content>
  const original = message.content || "";
  const isReplyWrapped = original.startsWith("[REPLY]");
  let replyMeta: ReplyMeta | null = null;
  let content = original;

  if (isReplyWrapped) {
    const firstNewline = original.indexOf("\n");
    if (firstNewline !== -1) {
      const metaStr = original.slice("[REPLY]".length, firstNewline).trim();
      try {
        replyMeta = JSON.parse(metaStr) as ReplyMeta;
      } catch {
        replyMeta = null;
      }
      content = original.slice(firstNewline + 1);
    }
  }

  const replyQuoteEl = replyMeta ? (
    <div className="mb-2 border-l-4 border-blue-400 bg-gray-50 rounded-md px-3 py-2">
      <p className="text-xs font-semibold text-gray-700">{replyMeta.sender}</p>
      <p className="text-xs text-gray-600 truncate max-w-[220px]">
        {replyMeta.text}
      </p>
    </div>
  ) : null;

  // file/video
  const isVideoMessage = content.startsWith("[VIDEO]");
  const isFileMessage = content.startsWith("[FILE]");

  let fileName = "";
  let fileData = "";

  if (isVideoMessage || isFileMessage) {
    const parts = content.split("\n");
    fileName = parts[0].replace("[VIDEO] ", "").replace("[FILE] ", "");
    fileData = parts.slice(1).join("\n");
  }

  const getFileIcon = (name: string) => {
    if (name.endsWith(".pdf"))
      return <FaFilePdf className="text-red-500" size={24} />;
    if (name.endsWith(".doc") || name.endsWith(".docx"))
      return <FaFileWord className="text-blue-500" size={24} />;
    if (name.endsWith(".zip") || name.endsWith(".rar"))
      return <FaFileArchive className="text-yellow-600" size={24} />;
    return <FaFileAlt className="text-gray-500" size={24} />;
  };

  return (
    <div
      className={`flex ${
        message.isOwn ? "justify-end" : "justify-start"
      } relative mb-2`}
    >
      {!message.isOwn && (
        <div className="w-8 h-8 mr-3 flex-shrink-0">
          {showAvatar && (
            <div
              className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xs`}
            >
              {message.avatar}
            </div>
          )}
        </div>
      )}

      <div className="relative inline-flex">
        {isVideoMessage ? (
          <div className="relative">
            <div
              className={`${
                message.isOwn
                  ? "bg-primary-2 border border-primary-2 shadow-md"
                  : "bg-white border border-gray-200 shadow-md"
              } p-2 rounded-lg max-w-lg`}
              onMouseEnter={() => onHoverStart(message.id)}
              onMouseLeave={onHoverEnd}
            >
              {!message.isOwn && message.sender && (
                <p className="text-xs font-semibold text-blue-600 mb-1">
                  {message.sender}
                </p>
              )}

              {replyQuoteEl}

              <video
                src={fileData}
                controls
                className="w-full max-h-60 rounded"
              />
              <p className="text-xs text-gray-600 mt-1">{fileName}</p>
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {message.timestamp}
              </p>
            </div>
          </div>
        ) : isFileMessage ? (
          <div className="relative">
            {!message.isOwn && message.sender && (
              <p className="text-xs font-semibold text-blue-600 mb-1">
                {message.sender}
              </p>
            )}

            <div
              className={`${
                message.isOwn
                  ? "bg-primary-2 border border-primary-2 shadow-md"
                  : "bg-white border border-gray-200 shadow-md"
              } px-4 py-3 rounded-lg max-w-xs`}
              onMouseEnter={() => onHoverStart(message.id)}
              onMouseLeave={onHoverEnd}
            >
              {replyQuoteEl}

              <a
                href={fileData}
                download={fileName}
                className="block hover:opacity-80 transition"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(fileName)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500">Nhấn để tải xuống</p>
                  </div>
                </div>
              </a>

              <p className="text-[10px] text-gray-400 mt-2 text-right">
                {message.timestamp}
              </p>
            </div>
          </div>
        ) : message.isSticker ? (
          <div className="relative">
            {!message.isOwn && message.sender && (
              <p className="text-xs font-semibold text-blue-600 mb-1">
                {message.sender}
              </p>
            )}

            <div
              className={`${
                message.isOwn ? "bg-primary-2" : "bg-white"
              } border border-gray-200 shadow-md rounded-xl p-2`}
              onMouseEnter={() => onHoverStart(message.id)}
              onMouseLeave={onHoverEnd}
            >
              {replyQuoteEl}

              {isImageLike(content) ? (
                <button
                  onClick={() => onExpandImage(message.id)}
                  className="w-100 h-60 flex items-center justify-center rounded-xl overflow-hidden bg-white hover:shadow-lg transition"
                >
                  <img
                    src={content}
                    alt="sticker"
                    className="w-full h-full object-contain"
                  />
                </button>
              ) : isStickerMarker(content) ? (
                <div className="text-[90px] leading-none">
                  {getStickerContent(content)}
                </div>
              ) : (
                <div className="text-[90px] leading-none">{content}</div>
              )}

              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {message.timestamp}
              </p>
            </div>
          </div>
        ) : (
          // Text / Image
          <div className="relative">
            <div
              className={`${
                message.isOwn
                  ? "bg-primary-2 text-black border border-primary-2 shadow-md"
                  : "bg-white text-black border border-gray-200 shadow-md"
              } px-4 py-2 rounded-lg max-w-xs break-words`}
              onMouseEnter={() => onHoverStart(message.id)}
              onMouseLeave={onHoverEnd}
            >
              {!message.isOwn && message.sender && (
                <p className="text-xs font-semibold text-gray-400 mb-1 break-words">
                  {message.sender}
                </p>
              )}

              {replyQuoteEl}

              {isImageLike(content) ? (
                <button
                  onClick={() => onExpandImage(message.id)}
                  className="w-72 max-w-full h-60 flex items-center justify-center rounded-xl overflow-hidden bg-white hover:shadow-lg transition"
                >
                  <img
                    src={content}
                    alt="image"
                    className="w-full h-full object-contain"
                  />
                </button>
              ) : (
                <p className="text-sm break-words overflow-wrap-anywhere">
                  {decodeEmojiFromShortcode(content)}
                </p>
              )}

              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {message.timestamp}
              </p>
            </div>

            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div
                className={`absolute -bottom-2 ${
                  message.isOwn ? "left-0" : "right-0"
                } flex gap-1 z-10`}
              >
                {Object.entries(message.reactions).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-100 shadow-md"
                  >
                    {emoji} {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isHovered && (
          <>
            {openMenuId !== message.id && (
              <div
                onMouseEnter={() => onHoverStart(message.id)}
                onMouseLeave={onHoverEnd}
                className={`absolute ${index < 2 ? "-bottom-12" : "-top-12"} ${
                  message.isOwn ? "right-0" : "left-0"
                } bg-white border border-gray-200 rounded-full px-3 py-2 shadow-lg flex gap-2 z-20`}
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="text-lg hover:scale-125 transition cursor-pointer"
                    onClick={() => onAddReaction(message.id, emoji)}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div
              onMouseEnter={() => onHoverStart(message.id)}
              onMouseLeave={onHoverEnd}
              className={`absolute top-0 ${
                message.isOwn ? "right-full mr-2" : "left-full ml-2"
              } flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-lg`}
            >
              <ActionButton
                icon={FaReply}
                title="Trả lời"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                }}
              />
            </div>

            {openMenuId === message.id && (
              <MenuDropdown isOwn={message.isOwn} />
            )}
          </>
        )}
      </div>

      {message.isOwn && showAvatar && (
        <div className="w-8 h-8 ml-2 flex-shrink-0 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
          YOU
        </div>
      )}
    </div>
  );
};

export default MessageItem;
