import type { SocketEvent, SocketResponse } from "../types/socket";

type SocketCallback = (res: SocketResponse) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private callbacks = new Set<SocketCallback>();
  private connecting = false;
  private queue: string[] = [];

  connect() {
    if (this.ws || this.connecting) return;

    this.connecting = true;
    this.ws = new WebSocket("wss://chat.longapp.site/chat/chat");

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");
      this.connecting = false;

      const user = localStorage.getItem("user");
      const code = localStorage.getItem("relogin_code");

      if (user && code) {
        this.ws!.send(
          JSON.stringify({
            action: "onchat",
            data: {
              event: "RE_LOGIN",
              data: { user, code },
            },
          })
        );
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

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queue.push(payload);
      this.connect();
      return;
    }

    this.ws.send(payload);
  }
}

export const chatSocket = new ChatSocket();
