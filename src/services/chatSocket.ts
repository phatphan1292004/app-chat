import type { SocketEvent, SocketResponse } from "../types/socket";

type SocketCallback = (res: SocketResponse) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private callbacks = new Set<SocketCallback>();
  private pendingMessages: string[] = [];

  connect() {
    if (this.ws) return;

    this.ws = new WebSocket("wss://chat.longapp.site/chat/chat");

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");

      this.pendingMessages.forEach((m) => this.ws!.send(m));
      this.pendingMessages = [];

      const user = localStorage.getItem("user");
      const code = localStorage.getItem("relogin_code");
      if (user && code) {
        this.send("RE_LOGIN", { user, code });
      }
    };

    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data) as SocketResponse;
      this.callbacks.forEach((cb) => cb(data));
    };

    this.ws.onclose = () => {
      console.log("❌ WebSocket closed");
      this.ws = null;
    };
  }

  onMessage(cb: SocketCallback): () => void {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send<E extends SocketEvent>(event: E, data: unknown) {
    const payload = JSON.stringify({
      action: "onchat",
      data: { event, data },
    });

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingMessages.push(payload);
      this.connect();
      return;
    }

    this.ws.send(payload);
  }
}

export const chatSocket = new ChatSocket();
