import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import ChatApp from "./pages/ChatApp";
import { useAuthSocket } from "./hooks/useAuthSocket";

function App() {
  const { logged, logout } = useAuthSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            logged ? (
              <Navigate to="/chat" />
            ) : (
              <Auth onLoginSuccess={() => {}} />
            )
          }
        />
        <Route
          path="/register"
          element={
            logged ? (
              <Navigate to="/chat" />
            ) : (
              <Auth onLoginSuccess={() => (window.location.href = "/login")} />
            )
          }
        />
        <Route
          path="/chat"
          element={
            logged ? <ChatApp onLogout={logout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="*"
          element={<Navigate to={logged ? "/chat" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
