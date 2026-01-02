import type { SocketEvent, SocketResponse } from "../types/socket";

type SocketCallback = (res: SocketResponse) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private callbacks = new Set<SocketCallback>();
  private connecting = false;
  private queue: string[] = [];
  private didRelogin = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect() {
    if (this.ws || this.connecting) return;

    this.connecting = true;
    this.ws = new WebSocket("wss://chat.longapp.site/chat/chat");

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");
      this.connecting = false;
      this.reconnectAttempts = 0;

      const user = localStorage.getItem("user");
      const code = localStorage.getItem("relogin_code");

      if (!this.didRelogin && user && code) {
        this.send("RE_LOGIN", { user, code });
        this.didRelogin = true;
      }

      this.queue.forEach((msg) => this.ws!.send(msg));
      this.queue = [];
    };

    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data) as SocketResponse;
      this.callbacks.forEach((cb) => cb(data));
    };

    this.ws.onclose = () => {
      console.log("❌ WebSocket closed");
      this.ws = null;
      this.connecting = false;
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };

    this.ws.onerror = (error) => {
      console.error("⚠️ WebSocket error:", error);
    };
  }

  onMessage(cb: SocketCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  send<E extends SocketEvent>(event: E, data: unknown) {
    const payload = JSON.stringify({
      action: "onchat",
      data: { event, data },
    });

    console.log(`📤 Sending event: ${event}`, data);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log(`⏳ WebSocket not ready, queueing message...`);
      this.queue.push(payload);
      if (!this.connecting) {
        this.connect();
      }
      return;
    }

    this.ws.send(payload);
  }

  // Auth methods
  login(user: string, pass: string) {
    this.send("LOGIN", { user, pass });
  }

  register(user: string, pass: string) {
    this.send("REGISTER", { user, pass });
  }

  logout() {
    this.send("LOGOUT", {});
  }

  // Room methods
  createRoom(name: string) {
    this.send("CREATE_ROOM", { name });
  }

  joinRoom(name: string) {
    this.send("JOIN_ROOM", { name });
  }

  getRoomMessages(name: string, page: number = 1) {
    this.send("GET_ROOM_CHAT_MES", { name, page });
  }

  // User methods
  checkUser(user: string) {
    this.send("CHECK_USER", { user });
  }

  checkUserExist(user: string) {
    this.send("CHECK_USER_EXIST", { user });
  }

  getUserList() {
    this.send("GET_USER_LIST", {});
  }

  // Message methods
  sendRoomMessage(to: string, mes: string) {
    this.send("SEND_CHAT", { type: "room", to, mes });
  }

  sendPersonalMessage(to: string, mes: string) {
    this.send("SEND_CHAT", { type: "people", to, mes });
  }

  getPeopleMessages(name: string, page: number = 1) {
    this.send("GET_PEOPLE_CHAT_MES", { name, page });
  }

  checkUserOnline(name: string) {
    this.send("CHECK_USER_ONLINE", { user: name });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const chatSocket = new ChatSocket();
