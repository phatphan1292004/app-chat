import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Auth from "./pages/Auth";
import ChatApp from "./pages/ChatApp";
import { useAuthSocket } from "./hooks/useAuthSocket";

function App() {
  const { logged, logout } = useAuthSocket();

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <Routes>
        <Route
          path="/login"
          element={logged ? <Navigate to="/chat" /> : <Auth />}
        />
        <Route
          path="/register"
          element={logged ? <Navigate to="/chat" /> : <Auth />}
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
