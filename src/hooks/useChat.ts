import { useEffect, useState, useCallback } from "react";
import { chatSocket } from "../services/chatSocket";
import { isStickerContent } from "../utils";
import type { SocketResponse } from "../types/socket";
import type { Message } from "../types/message";

interface UseChatProps {
  currentRoom: string | null;
  currentUser: string | null;
  chatType: "room" | "people"; // room or people chat
}

export const useChat = ({
  currentRoom,
  currentUser,
  chatType,
}: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages when room or user changes
  useEffect(() => {
    if (!currentRoom && !currentUser) return;

    setLoading(true);
    setError(null);
    setMessages([]);

    // Set up listener FIRST before sending request
    const unsubscribe = chatSocket.onMessage((response: SocketResponse) => {
      console.log("💬 Chat message received:", response);

      if (response.status === "error") {
        if (
          (response.event === "GET_ROOM_CHAT_MES" && chatType === "room") ||
          (response.event === "GET_PEOPLE_CHAT_MES" && chatType === "people")
        ) {
          setError(response.mes || "Failed to load messages");
          setLoading(false);
        }
        return;
      }

      // Handle initial message load
      if (response.event === "GET_ROOM_CHAT_MES" && chatType === "room") {
        console.log("📥 Room messages loaded:", response.data);
        const roomMessages = (response.data?.messages || response.data) as any[];
        const currentUser = localStorage.getItem("user");
        console.log("👤 Current user:", currentUser);
        const mappedMessages: Message[] = roomMessages
          .map((msg, idx) => {
            const sender = msg.name || msg.sender || "Unknown";
            const isOwnMsg = sender === currentUser;
            console.log(`  Message ${idx}: sender='${sender}', isOwn=${isOwnMsg}, content='${msg.mes}'`);
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
        console.log("✅ Mapped messages (sorted):", mappedMessages);
        setMessages(mappedMessages);
        console.log("✅ State updated with", mappedMessages.length, "messages");
        setLoading(false);
      }

      if (response.event === "GET_PEOPLE_CHAT_MES" && chatType === "people") {
        console.log("📥 People messages loaded:", response.data);
        const peopleMessages = (response.data?.messages || response.data) as any[];
        const currentUser = localStorage.getItem("user");
        console.log("👤 Current user:", currentUser);
        const mappedMessages: Message[] = peopleMessages
          .map((msg, idx) => {
            const sender = msg.name || msg.sender || "Unknown";
            const isOwnMsg = sender === currentUser;
            console.log(`  Message ${idx}: sender='${sender}', isOwn=${isOwnMsg}, content='${msg.mes}'`);
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
        console.log("✅ Mapped messages (sorted):", mappedMessages);
        setMessages(mappedMessages);
        console.log("✅ State updated with", mappedMessages.length, "messages");
        setLoading(false);
      }

      // Handle incoming messages from others in real-time
      if (response.event === "SEND_CHAT") {
        console.log("📨 New message received:", response.data);
        const newMsg = response.data as any;
        if (newMsg) {
          // For room chat: check if message is for current room
          if (chatType === "room" && currentRoom) {
            if (newMsg.to !== currentRoom) return; // Not for current room
          }
          // For people chat: check if message is from/to current user
          if (chatType === "people" && currentUser) {
            const isFromCurrentUser = newMsg.name === currentUser;
            const isToCurrentUser = newMsg.to === currentUser;
            if (!isFromCurrentUser && !isToCurrentUser) return; // Not relevant
          }

          const sender = newMsg.name || newMsg.sender || "Unknown";
          const content = newMsg.mes || newMsg.content || "";
          const incomingMessage: Message = {
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
          console.log("✅ Adding new message to list:", incomingMessage);
          setMessages((prev) => [...prev, incomingMessage]);
        }
      }

      // Also handle MESSAGE event if server sends it
      if (response.event === "MESSAGE") {
        console.log("📨 Message event received:", response.data);
        const newMsg = response.data as any;
        if (newMsg) {
          // For room chat: check if message is for current room
          if (chatType === "room" && currentRoom) {
            if (newMsg.to !== currentRoom) return; // Not for current room
          }
          // For people chat: check if message is from/to current user
          if (chatType === "people" && currentUser) {
            const isFromCurrentUser = newMsg.name === currentUser;
            const isToCurrentUser = newMsg.to === currentUser;
            if (!isFromCurrentUser && !isToCurrentUser) return; // Not relevant
          }

          const sender = newMsg.name || newMsg.sender || "Unknown";
          const content = newMsg.mes || newMsg.content || "";
          const incomingMessage: Message = {
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
          console.log("✅ Adding new message to list:", incomingMessage);
          setMessages((prev) => [...prev, incomingMessage]);
        }
      }
    });

    // THEN send the request after listener is attached
    if (chatType === "room" && currentRoom) {
      console.log("🔄 Loading room messages for:", currentRoom);
      chatSocket.getRoomMessages(currentRoom, 1);
    } else if (chatType === "people" && currentUser) {
      console.log("🔄 Loading people messages for:", currentUser);
      chatSocket.getPeopleMessages(currentUser, 1);
    }

    return unsubscribe;
  }, [currentRoom, currentUser, chatType]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      if (chatType === "room" && currentRoom) {
        chatSocket.sendRoomMessage(currentRoom, content);
      } else if (chatType === "people" && currentUser) {
        chatSocket.sendPersonalMessage(currentUser, content);
      }

      // Optimistically add message to UI
      const currentUsername = localStorage.getItem("user") || "You";
      const newMessage: Message = {
        id: messages.length + 1,
        sender: currentUsername,
        avatar: currentUsername.substring(0, 2).toUpperCase(),
        content: content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
        reactions: {},
        isSticker: isStickerContent(content),
      };
      setMessages([...messages, newMessage]);
    },
    [messages, chatType, currentRoom, currentUser]
  );

  const addReaction = useCallback(
    (messageId: number, emoji: string) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || {};
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            return { ...msg, reactions };
          }
          return msg;
        })
      );
    },
    []
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    addReaction,
    setMessages,
  };
};
