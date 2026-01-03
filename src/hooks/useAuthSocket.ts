import { useEffect, useRef, useState } from "react";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";
import { toast } from "react-toastify";

export function useAuthSocket() {
  const [logged, setLogged] = useState<boolean>(() =>
    Boolean(localStorage.getItem("relogin_code"))
  );

  const lastRef = useRef<{ key: string; at: number } | null>(null);
  const skip = (key: string, ms = 800) => {
    const now = Date.now();
    const last = lastRef.current;
    if (last && last.key === key && now - last.at < ms) return true;
    lastRef.current = { key, at: now };
    return false;
  };

  useEffect(() => {
    chatSocket.connect();

    const off = chatSocket.onMessage((res: SocketResponse) => {
      console.log("📩 SOCKET:", res);

      if (res.status === "error") {
        if (res.event === "RE_LOGIN") {
          localStorage.removeItem("relogin_code");
          localStorage.removeItem("user");
          setLogged(false);

          toast.error(res.mes || "Phiên đăng nhập đã hết hạn!", {
            toastId: "relogin-expired",
          });
        }
        return;
      }

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        const code = res.data?.RE_LOGIN_CODE;
        if (typeof code === "string") {
          localStorage.setItem("relogin_code", code);
          setLogged(true);

          if (res.event === "RE_LOGIN") {
            toast.success("Tự động đăng nhập!", {
              toastId: "relogin-success",
            });
          }
        }
      }

      if (res.event === "LOGOUT") {
        localStorage.clear();
        setLogged(false);
        const key = "ok:LOGOUT";
        if (!skip(key)) toast.info("Bạn đã đăng xuất!");
      }
    });

    return off;
  }, []);

  const logout = () => {
    chatSocket.logout();
    localStorage.clear();
    toast.info("Đang đăng xuất...");
    window.location.href = "/login";
  };

  return { logged, logout };
}
