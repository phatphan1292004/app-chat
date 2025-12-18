import { useEffect, useState } from "react";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";

export interface UseAuthSocketResult {
  logged: boolean;
  logout: () => void;
}

export function useAuthSocket(): UseAuthSocketResult {
  const [logged, setLogged] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("relogin_code"));
  });

  useEffect(() => {
    chatSocket.connect();

    const off = chatSocket.onMessage((res: SocketResponse) => {
      console.log("📩 SOCKET:", res);

      if (res.status === "error") return;

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        const code = res.data?.RE_LOGIN_CODE;

        if (typeof code === "string" && code.length > 0) {
          localStorage.setItem("relogin_code", code);
        }

        setLogged(true);
      }

      if (res.event === "LOGOUT") {
        localStorage.removeItem("relogin_code");
        localStorage.removeItem("user");
        setLogged(false);
      }
    });

    return () => {
      off?.();
    };
  }, []);

  const logout = (): void => {
    chatSocket.send("LOGOUT", {});
    localStorage.removeItem("relogin_code");
    localStorage.removeItem("user");
    setLogged(false);
    window.location.href = "/login";
  };

  return {
    logged,
    logout,
  };
}
