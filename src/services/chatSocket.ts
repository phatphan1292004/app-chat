import type { SocketResponse, SocketEvent } from "../types/socket";

type SocketCallback = (res: SocketResponse) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private callback: SocketCallback | null = null;

  connect(cb: SocketCallback) {
    this.callback = cb;

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = import.meta.env.WS_URL || "wss://chat.longapp.site/chat/chat";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");

      const user = localStorage.getItem("user");
      const code = localStorage.getItem("relogin_code");
      if (user && code) {
        this.send("RE_LOGIN", { user, code });
      }
    };

    this.ws.onmessage = (e: MessageEvent<string>) => {
      const data = JSON.parse(e.data) as SocketResponse;
      this.callback?.(data);
    };

    this.ws.onclose = () => {
      console.log("❌ WebSocket closed");
      this.ws = null;
    };
  }

  reconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.connect(this.callback!);
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send<E extends SocketEvent>(event: E, data: unknown) {
    if (!this.isConnected()) {
      console.warn("⚠️ WS not connected, connecting...");
      this.connect(this.callback!);
      return;
    }

    this.ws!.send(JSON.stringify({ action: "onchat", data: { event, data } }));
  }
}

export const chatSocket = new ChatSocket();
