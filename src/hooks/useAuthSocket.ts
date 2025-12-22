import { useEffect, useState } from "react";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";

export function useAuthSocket() {
  const [logged, setLogged] = useState<boolean>(() =>
    Boolean(localStorage.getItem("relogin_code"))
  );

  useEffect(() => {
    chatSocket.connect();

    const off = chatSocket.onMessage((res: SocketResponse) => {
      console.log("📩 SOCKET:", res);

      if (res.status === "error" && res.event === "AUTH") return;
      if (res.status === "error") return;

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        const code = res.data?.RE_LOGIN_CODE;
        if (typeof code === "string") {
          localStorage.setItem("relogin_code", code);
        }
        setLogged(true);
      }

      if (res.event === "LOGOUT") {
        localStorage.clear();
        setLogged(false);
      }
    });

    return off;
  }, []);

  const logout = () => {
    chatSocket.send("LOGOUT", {});
    localStorage.clear();
    setLogged(false);
    window.location.href = "/login";
  };

  return { logged, logout };
}
