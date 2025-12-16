import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { chatSocket } from "./services/chatSocket";
import type { SocketResponse } from "./types/socket";

function App() {
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    chatSocket.connect((res: SocketResponse) => {
      console.log("📩 SOCKET:", res);

      if (res.status === "error") {
        console.error(res.data.message);
        return;
      }

      if (res.event === "LOGIN" || res.event === "RE_LOGIN") {
        if (res.data?.RE_LOGIN_CODE) {
          localStorage.setItem("relogin_code", res.data.RE_LOGIN_CODE);
        }
        setLogged(true);
      }

      if (res.event === "LOGOUT") {
        setLogged(false);
        localStorage.removeItem("relogin_code");
        localStorage.removeItem("user");
      }
    });
  }, []);

  const handleLogout = () => {
    if (chatSocket.isConnected()) {
      chatSocket.send("LOGOUT", {});
    }
    setLogged(false);
    localStorage.removeItem("relogin_code");
    localStorage.removeItem("user");
  };

  if (!logged) return <Auth onLoginSuccess={() => setLogged(true)} />;

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 bg-[#111b21] p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Chat screen</h1>
            <button
              onClick={handleLogout}
              className="rounded bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
          {/* Nội dung chat */}
        </div>
      </div>
    </div>
  );
}

export default App;
