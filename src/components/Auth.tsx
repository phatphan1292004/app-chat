import { useState, useEffect } from "react";
import { chatSocket } from "../services/chatSocket";
import type { SocketResponse } from "../types/socket";

interface AuthProps {
  onLoginSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleSocket = (res: SocketResponse) => {
      setLoading(false);
      setError(null);
      setSuccess(null);

      if (res.status === "error") {
        setError(res.data.message);
        return;
      }

      if (res.event === "REGISTER") {
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
        setUser("");
        setPass("");
      }

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        if (res.data?.RE_LOGIN_CODE) {
          localStorage.setItem("relogin_code", res.data.RE_LOGIN_CODE);
        }
        onLoginSuccess?.();
      }
    };

    chatSocket.connect(handleSocket);
  }, [onLoginSuccess]);

  const submit = () => {
    setError(null);
    setSuccess(null);

    if (!user || !pass) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (!chatSocket.isConnected()) {
      setError("⚠ Chưa kết nối server, vui lòng thử lại.");
      return;
    }

    setLoading(true);
    localStorage.setItem("user", user);

    chatSocket.send(isLogin ? "LOGIN" : "REGISTER", { user, pass });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#e9f0f8]">
      <div className="w-[360px] rounded-lg bg-white p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        <h2 className="mb-5 text-center text-2xl font-semibold text-[#0068ff]">
          {isLogin ? "Đăng nhập" : "Đăng ký"}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="mb-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-3 rounded-md bg-green-100 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <input
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0068ff]"
          placeholder="Tên đăng nhập"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <input
          type="password"
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0068ff]"
          placeholder="Mật khẩu"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading || !chatSocket.isConnected()}
          className="mt-1 w-full cursor-pointer rounded-md bg-[#0068ff] py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
        >
          {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>

        <p className="mt-6 text-center text-sm">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          <span
            className="ml-1 cursor-pointer font-semibold text-[#0068ff]"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
          >
            {isLogin ? "Đăng ký" : "Đăng nhập"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
