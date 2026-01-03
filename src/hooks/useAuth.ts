import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";
import { toast } from "react-toastify";

interface UseAuthProps {
  onLoginSuccess?: () => void;
}

export const useAuth = ({ onLoginSuccess }: UseAuthProps) => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingToastIdRef = useRef<ReturnType<typeof toast.loading> | null>(
    null
  );

  const lastMsgRef = useRef<{ key: string; at: number } | null>(null);
  const shouldSkipToast = (key: string, ms = 800) => {
    const now = Date.now();
    const last = lastMsgRef.current;
    if (last && last.key === key && now - last.at < ms) return true;
    lastMsgRef.current = { key, at: now };
    return false;
  };

  const dismissLoadingToast = () => {
    if (loadingToastIdRef.current) {
      toast.dismiss(loadingToastIdRef.current);
      loadingToastIdRef.current = null;
    }
  };

  useEffect(() => {
    const off = chatSocket.onMessage((res: SocketResponse) => {
      if (res.status === "error") {
        setLoading(false);
        dismissLoadingToast();
        const key = `err:${res.event}:${res.mes ?? ""}`;
        if (!shouldSkipToast(key)) {
          toast.error(res.mes || "Lỗi không xác định!");
        }
        return;
      }

      if (res.event === "REGISTER") {
        dismissLoadingToast();

        const key = "ok:REGISTER";
        if (!shouldSkipToast(key)) {
          toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        }

        setIsLogin(true);
        setUser("");
        setPass("");
        setLoading(false);
      }

      if (res.event === "LOGIN") {
        dismissLoadingToast();
        const code = res.data?.RE_LOGIN_CODE;
        if (code) {
          localStorage.setItem("relogin_code", code);
        }
        const key = "ok:LOGIN";
        if (!shouldSkipToast(key)) {
          toast.success("Đăng nhập thành công!");
        }
        setLoading(false);
        onLoginSuccess?.();
      }
    });

    return off;
  }, [onLoginSuccess]);

  const submit = () => {
    if (!user || !pass) {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    localStorage.setItem("user", user);

    dismissLoadingToast();
    loadingToastIdRef.current = toast.loading(
      isLogin ? "Đang đăng nhập..." : "Đang đăng ký..."
    );

    if (isLogin) {
      chatSocket.login(user, pass);
    } else {
      chatSocket.register(user, pass);
    }
  };

  const toggleMode = () => {
    const next = !isLogin;
    setIsLogin(next);
    window.history.pushState({}, "", next ? "/login" : "/register");
    setPass("");
    dismissLoadingToast();
  };

  return {
    isLogin,
    user,
    pass,
    showPass,
    loading,
    setUser,
    setPass,
    setShowPass,
    submit,
    toggleMode,
  };
};
