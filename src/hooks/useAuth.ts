import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";

interface UseAuthProps {
  onLoginSuccess?: () => void;
}

export const useAuth = ({ onLoginSuccess }: UseAuthProps) => {
  const location = useLocation();

  const [isLogin, setIsLogin] = useState<boolean>(
    location.pathname !== "/register"
  );
  const [user, setUser] = useState<string>("");
  const [pass, setPass] = useState<string>("");
  const [showPass, setShowPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!error && !success) return;

    const timer = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [error, success]);

  useEffect(() => {
    const off = chatSocket.onMessage((res: SocketResponse) => {
      setLoading(false);

      if (res.status === "error") {
        const raw =
          res.mes?.toString() ||
          res.data?.message?.toString() ||
          "Lỗi không xác định";

        const msg = raw.toLowerCase();

        if (msg.includes("wrong username") || msg.includes("wrong password")) {
          setError("Sai tài khoản hoặc mật khẩu");
        } else if (
          msg.includes("duplicate username") ||
          msg.includes("creating account error")
        ) {
          setError("Tên tài khoản đã tồn tại");
        } else {
          setError(raw);
        }

        setSuccess(null);
        return;
      }

      if (res.event === "REGISTER") {
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
        setError(null);
        setIsLogin(true);
        setUser("");
        setPass("");
        return;
      }

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        if (res.data?.RE_LOGIN_CODE) {
          localStorage.setItem(
            "relogin_code",
            res.data.RE_LOGIN_CODE.toString()
          );
        }
        onLoginSuccess?.();
      }
    });

    return off;
  }, [onLoginSuccess]);

  const submit = (): void => {
    setError(null);
    setSuccess(null);

    if (!user || !pass) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    localStorage.setItem("user", user);
    chatSocket.send(isLogin ? "LOGIN" : "REGISTER", { user, pass });
  };

  const toggleMode = (): void => {
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
