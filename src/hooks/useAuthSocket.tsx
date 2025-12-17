import { useEffect, useState } from "react";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";

export function useAuthSocket() {
  const [logged, setLogged] = useState<boolean>(
    !!localStorage.getItem("relogin_code")
  );

  useEffect(() => {
    chatSocket.connect();

    const off = chatSocket.onMessage((res: SocketResponse) => {
      console.log("📩 SOCKET:", res);

      if (res.status === "error") return;

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        if (res.data?.RE_LOGIN_CODE) {
          localStorage.setItem("relogin_code", res.data.RE_LOGIN_CODE);
        }
        setLogged(true);
      }

      if (res.event === "LOGOUT") {
        localStorage.removeItem("relogin_code");
        localStorage.removeItem("user");
        setLogged(false);
      }
    });

    return off;
  }, []);

  const logout = () => {
    chatSocket.send("LOGOUT", {});
    localStorage.removeItem("relogin_code");
    localStorage.removeItem("user");
    setLogged(false);
    window.location.href = "/login";
  };

  return { logged, logout };
}
