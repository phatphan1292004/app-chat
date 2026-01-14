import * as nodeEmoji from 'node-emoji';

// Convert emoji to shortcode for safe string storage (text thông thường vẫn giữ nguyên)
export const encodeEmojiToShortcode = (text: string): string => {
  try {
    return nodeEmoji.unemojify(text);
  } catch (error) {
    console.error('Error encoding emoji:', error);
    return text;
  }
};

// Convert shortcode back to emoji for display
export const decodeEmojiFromShortcode = (text: string): string => {
  try {
    return nodeEmoji.emojify(text);
  } catch (error) {
    console.error('Error decoding emoji:', error);
    return text;
  }
};

export const formatTime = (timeStr: string) => {
  // Handle both timestamp string (milliseconds) and ISO date string
  let date: Date;
  if (/^\d+$/.test(timeStr)) {
    // Pure number string - parse as milliseconds timestamp
    date = new Date(parseInt(timeStr, 10));
  } else {
    date = new Date(timeStr);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "";
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
  return `${Math.floor(diffMins / 1440)} ngày trước`;
};

// Format date separator for message grouping
export const formatDateSeparator = (dateStr: string): string => {
  let date: Date;
  
  // Parse the date string
  if (/^\d+$/.test(dateStr)) {
    date = new Date(parseInt(dateStr, 10));
  } else {
    // Handle "YYYY-MM-DD HH:MM:SS" format
    date = new Date(dateStr.replace(' ', 'T'));
  }
  
  if (isNaN(date.getTime())) {
    return "";
  }
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare only dates
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Hôm nay";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Hôm qua";
  } else {
    // Format as "Thứ DD/MM/YYYY"
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${dayName} ${day}/${month}/${year}`;
  }
};

// Get date key for grouping messages
export const getDateKey = (dateStr: string): string => {
  let date: Date;
  
  if (/^\d+$/.test(dateStr)) {
    date = new Date(parseInt(dateStr, 10));
  } else {
    date = new Date(dateStr.replace(' ', 'T'));
  }
  
  if (isNaN(date.getTime())) {
    return "";
  }
  
  // Return YYYY-MM-DD format for grouping
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Message content helpers
export const isImageDataUrl = (s: string) => s.startsWith("data:image");

// Encode emoji thành unicode escape để backend lưu được
export const encodeEmoji = (emoji: string): string => {
  return Array.from(emoji)
    .map(char => {
      const code = char.codePointAt(0);
      if (!code) return char;
      // Nếu là emoji (> U+1F000), encode thành &#xHEXCODE;
      if (code > 0x1F000) {
        return `&#x${code.toString(16).toUpperCase()};`;
      }
      return char;
    })
    .join('');
};

// Decode emoji từ unicode escape
export const decodeEmoji = (str: string): string => {
  return str.replace(/&#x([0-9A-F]+);/gi, (_match, hex) => {
    const codePoint = parseInt(hex, 16);
    if (isNaN(codePoint)) return _match; // Nếu parse lỗi, giữ nguyên
    return String.fromCodePoint(codePoint);
  });
};
// Kiểm tra xem có phải là sticker (hiển thị to) hay không
export const isStickerMarker = (s: string) => s.startsWith("[STICKER]");

// Lấy nội dung sticker (loại bỏ prefix và decode emoji)
export const getStickerContent = (s: string) => {
  const content = s.replace("[STICKER]", "");
  return decodeEmoji(content);
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

export const isStickerContent = (s: string) => {
  // Kiểm tra nếu có marker [STICKER]
  if (isStickerMarker(s)) return true;
  // Kiểm tra nếu là ảnh hoặc URL
  return isImageDataUrl(s) || isImageHttpUrl(s);
};

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
  createAt?: string; // Thêm createAt từ API
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
  createAt?: string; // Ngày giờ gốc từ API để nhóm theo ngày
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
      let content = msg.mes || msg.content || "";
      
      // Chỉ decode emoji nếu là sticker hoặc có HTML entity
      if (content.includes("&#x") || content.startsWith("[STICKER]")) {
        content = decodeEmoji(content);
      }
      
      // Ưu tiên sử dụng createAt từ API, sau đó mới dùng timestamp
      const originalDate = msg.createAt || msg.timestamp;
      let timeStr = originalDate;
      
      if (!timeStr) {
        timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // Parse createAt (format: "2025-12-29 11:52:32") và hiển thị dạng HH:MM
        const date = new Date(timeStr.replace(' ', 'T'));
        if (!isNaN(date.getTime())) {
          timeStr = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
      
      return {
        id: msg.id || idx,
        sender,
        avatar: msg.avatar || sender.substring(0, 2).toUpperCase(),
        content,
        timestamp: timeStr,
        createAt: originalDate, // Lưu ngày gốc để nhóm
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
  let content = newMsg.mes || newMsg.content || "";
  
  // Chỉ decode emoji nếu là sticker hoặc có HTML entity
  if (content.includes("&#x") || content.startsWith("[STICKER]")) {
    content = decodeEmoji(content);
  }
  
  // Ưu tiên sử dụng createAt từ API, sau đó mới dùng timestamp
  const originalDate = newMsg.createAt || newMsg.timestamp;
  let timeStr = originalDate;
  
  if (!timeStr) {
    timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    // Parse createAt (format: "2025-12-29 11:52:32") và hiển thị dạng HH:MM
    const date = new Date(timeStr.replace(' ', 'T'));
    if (!isNaN(date.getTime())) {
      timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  
  return {
    id: newMsg.id || Date.now(),
    sender,
    avatar: newMsg.avatar || sender.substring(0, 2).toUpperCase(),
    content,
    timestamp: timeStr,
    createAt: originalDate, 
    isOwn: sender === localStorage.getItem("user"),
    reactions: newMsg.reactions,
    isSticker: newMsg.isSticker ?? isStickerContent(content),
  };
};
