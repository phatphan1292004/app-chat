import { useEffect, useState, useCallback } from "react";
import { chatSocket } from "../services/chatSocket";
import { mapRawMessages, createMessageFromRaw, type RawMessage, isStickerContent } from "../utils";
import type { SocketResponse } from "../types/socket";
import type { Message } from "../types/message";

const IS_DEV = import.meta.env.DEV;
const log = (...args: unknown[]) => IS_DEV && console.log(...args);

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
    if (!currentRoom && !currentUser) {
      return;
    }

    let isSubscribed = true;

    // Set up listener FIRST before sending request
    const unsubscribe = chatSocket.onMessage((response: SocketResponse) => {
      if (!isSubscribed) return;
      if (response.status === "error") {
        if (
          (response.event === "GET_ROOM_CHAT_MES" && chatType === "room") ||
          (response.event === "GET_PEOPLE_CHAT_MES" && chatType === "people")
        ) {
          setError(() => response.mes || "Failed to load messages");
          setLoading(() => false);
        }
        return;
      }

      // Handle initial message load
      if (response.event === "GET_ROOM_CHAT_MES" && chatType === "room") {
        log("📥 Room messages loaded:", response.data);
        // Safely extract messages array
        let roomMessages: RawMessage[] = [];
        if (Array.isArray(response.data)) {
          roomMessages = response.data;
        } else if (response.data?.chatData && Array.isArray(response.data.chatData)) {
          roomMessages = response.data.chatData;
        } 
        const mappedMessages = mapRawMessages(roomMessages);
        setMessages(() => mappedMessages);
        log("✅ Loaded", mappedMessages.length, "messages");
        setLoading(() => false);
      }

      if (response.event === "GET_PEOPLE_CHAT_MES" && chatType === "people") {
        log("📥 People messages loaded:", response.data);
        // Safely extract messages array
        let peopleMessages: RawMessage[] = [];
        if (Array.isArray(response.data)) {
          peopleMessages = response.data;
        } else if (response.data?.messages && Array.isArray(response.data.messages)) {
          peopleMessages = response.data.messages;
        }
        const mappedMessages = mapRawMessages(peopleMessages);
        setMessages(() => mappedMessages);
        log("✅ Loaded", mappedMessages.length, "messages");
        setLoading(() => false);
      }

      // Handle incoming messages from others in real-time
      if (response.event === "SEND_CHAT" || response.event === "MESSAGE") {
        log("📨 New message received");
        const newMsg = response.data as RawMessage;
        if (!newMsg) return;

        // For room chat: check if message is for current room
        if (chatType === "room" && currentRoom && newMsg.to !== currentRoom) {
          return; // Not for current room
        }
        
        // For people chat: check if message is from/to current user
        if (chatType === "people" && currentUser) {
          const isFromCurrentUser = newMsg.name === currentUser;
          const isToCurrentUser = newMsg.to === currentUser;
          if (!isFromCurrentUser && !isToCurrentUser) return; // Not relevant
        }

        const incomingMessage = createMessageFromRaw(newMsg);
        setMessages((prev) => [...prev, incomingMessage]);
      }
    });

    // Reset state before sending request (use queueMicrotask to avoid cascading render warning)
    queueMicrotask(() => {
      setError(null);
      setMessages([]);
      setLoading(true);
    });

    // THEN send the request after listener is attached
    if (chatType === "room" && currentRoom) {
      log("🔄 Loading room messages for:", currentRoom);
      chatSocket.getRoomMessages(currentRoom, 1);
    } else if (chatType === "people" && currentUser) {
      log("🔄 Loading people messages for:", currentUser);
      chatSocket.getPeopleMessages(currentUser, 1);
    }

    return () => {
      isSubscribed = false;
      unsubscribe();
      setLoading(false);
    };
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