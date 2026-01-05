export const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
  return `${Math.floor(diffMins / 1440)} ngày trước`;
};

// Message content helpers
export const isImageDataUrl = (s: string) => s.startsWith("data:image");

export const isEmojiOnly = (s: string) => {
  const t = (s || "").trim();
  if (!t) return false;
  try {
    // Broad emoji class; supported in modern runtimes
    return /^\p{Extended_Pictographic}+$/u.test(t);
  } catch {
    // Fallback: simple surrogate pair / common emoji ranges
    return /^[\u231A-\u231B\u23E9-\u23F3\u23F8-\u23FA\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]+$/.test(t);
  }
};

export const isImageHttpUrl = (s: string) => {
  if (!s) return false;
  const lower = s.toLowerCase();
  if (!/^https?:\/\//.test(lower)) return false;
  return (
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lower) ||
    lower.includes("media.tenor.com") ||
    lower.includes("media.giphy.com") ||
    lower.includes("i.giphy.com")
  );
};

export const isStickerContent = (s: string) =>
  isImageDataUrl(s) || isImageHttpUrl(s) || isEmojiOnly(s);

export const isImageLike = (s: string) => isImageDataUrl(s) || isImageHttpUrl(s);

// Message transformation helpers
export interface RawMessage {
  id?: number;
  name?: string;
  sender?: string;
  avatar?: string;
  mes?: string;
  content?: string;
  timestamp?: string;
  to?: string;
  reactions?: Record<string, number>;
  isSticker?: boolean;
}

export interface Message {
  id: number;
  sender: string;
  avatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  reactions?: Record<string, number>;
  isSticker?: boolean;
}

// Helper function to map raw messages to Message type
export const mapRawMessages = (rawMessages: RawMessage[]): Message[] => {
  // Validate input is array
  if (!Array.isArray(rawMessages)) {
    console.warn("mapRawMessages received non-array:", rawMessages);
    return [];
  }

  const currentUser = localStorage.getItem("user");
  return rawMessages
    .map((msg, idx) => {
      const sender = msg.name || msg.sender || "Unknown";
      const isOwnMsg = sender === currentUser;
      const content = msg.mes || msg.content || "";
      return {
        id: msg.id || idx,
        sender,
        avatar: msg.avatar || sender.substring(0, 2).toUpperCase(),
        content,
        timestamp: msg.timestamp || new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: isOwnMsg,
        reactions: msg.reactions,
        isSticker: msg.isSticker ?? isStickerContent(content),
      };
    })
    .sort((a, b) => (a.id as number) - (b.id as number));
};

// Helper function to create message from raw data
export const createMessageFromRaw = (newMsg: RawMessage): Message => {
  const sender = newMsg.name || newMsg.sender || "Unknown";
  const content = newMsg.mes || newMsg.content || "";
  return {
    id: newMsg.id || Date.now(),
    sender,
    avatar: newMsg.avatar || sender.substring(0, 2).toUpperCase(),
    content,
    timestamp: newMsg.timestamp || new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    isOwn: sender === localStorage.getItem("user"),
    reactions: newMsg.reactions,
    isSticker: newMsg.isSticker ?? isStickerContent(content),
  };
};
