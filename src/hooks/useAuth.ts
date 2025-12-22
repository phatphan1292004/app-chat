import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const off = chatSocket.onMessage((res: SocketResponse) => {
      if (res.status === "error") {
        setError(res.mes || "Lỗi không xác định");
        setLoading(false);
        return;
      }

      if (res.event === "REGISTER") {
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
        setUser("");
        setPass("");
      }

      if (res.event === "LOGIN") {
        const code = res.data?.RE_LOGIN_CODE;
        if (code) localStorage.setItem("relogin_code", code);
        setLoading(false);
        onLoginSuccess?.();
      }
    });

    return off;
  }, [onLoginSuccess]);

  const submit = () => {
    if (!user || !pass) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    localStorage.setItem("user", user);
    chatSocket.send(isLogin ? "LOGIN" : "REGISTER", { user, pass });
  };

  const toggleMode = () => {
    const next = !isLogin;
    setIsLogin(next);
    window.history.pushState({}, "", next ? "/login" : "/register");
    setError(null);
    setSuccess(null);
  };

  return {
    isLogin,
    user,
    pass,
    showPass,
    loading,
    error,
    success,
    setUser,
    setPass,
    setShowPass,
    submit,
    toggleMode,
  };
};
