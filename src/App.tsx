import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { chatSocket } from "./services/chatSocket";
import type { SocketResponse } from "./types/socket";
import ChatView from "./components/ChatView";

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
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 ml-100 overflow-hidden">
          <ChatView />
        </div>
      </div>
    </div>
  );
}

export default App;
