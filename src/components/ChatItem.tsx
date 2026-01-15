import React, { useMemo } from "react";
import { MdGroups } from "react-icons/md";
import { decodeEmojiFromShortcode, isImageLike } from "../utils";

interface ChatItemProps {
  avatar: string;
  name: string;
  time: string;
  lastMessage: string;
  type: number;
  online?: boolean;
  lastSender?: string;
  lastIsOwn?: boolean;
}

type ReplyMeta = { text?: string };

const parseReply = (raw: string) => {
  const res = {
    isReply: false,
    meta: null as ReplyMeta | null,
    content: raw || "",
  };
  if (!raw || !raw.startsWith("[REPLY]")) return res;

  res.isReply = true;

  const nl = raw.indexOf("\n");
  const slashN = raw.indexOf("\\n");
  const idx = nl !== -1 ? nl : slashN !== -1 ? slashN : -1;
  if (idx === -1) return res;

  try {
    res.meta = JSON.parse(raw.slice(7, idx).trim());
  } catch {
    res.meta = null;
  }

  res.content = raw.slice(idx + (nl !== -1 ? 1 : 2));
  return res;
};

const getContentPreview = (raw: string) => {
  const { isReply, meta, content } = parseReply(raw);
  const c = (content || "").trim();

  let text = "";

  if (!c) text = meta?.text || "Tin nhắn";
  else if (c.startsWith("[VIDEO]")) text = "🎬 Video";
  else if (c.startsWith("[FILE]")) text = "📎 Tệp";
  else if (isImageLike(c)) text = "🖼️ Ảnh";
  else text = decodeEmojiFromShortcode(c).replace(/\s+/g, " ").trim();

  if (text.length > 60) text = text.slice(0, 60) + "…";

  return isReply ? `${text}` : text;
};

const ChatItem: React.FC<ChatItemProps> = ({
  avatar,
  name,
  time,
  lastMessage,
  type,
  online = false,
  lastSender,
  lastIsOwn,
}) => {
  const preview = useMemo(
    () => getContentPreview(lastMessage || ""),
    [lastMessage]
  );

  const prefix = useMemo(() => {
    if (!lastSender && lastIsOwn == null) return "";
    const who = lastIsOwn ? "Bạn" : lastSender || "";
    return who ? `${who}: ` : "";
  }, [lastSender, lastIsOwn]);

  return (
    <div className="flex items-center px-4 py-3 hover:bg-primary-1/10">
      <div className="relative w-12 h-12 mr-3">
        <div className="w-12 h-12 rounded-full bg-primary-1 flex items-center justify-center text-white font-bold">
          {type === 1 ? <MdGroups size={24} /> : avatar}
        </div>
        {type === 0 && (
          <div
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              online ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600">{name}</span>
          <span className="text-[13px] text-gray-400">{time}</span>
        </div>

        <div className="text-gray-400 text-sm truncate">
          {prefix}
          {preview || "..."}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
