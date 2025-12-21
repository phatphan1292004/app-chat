import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import ChatApp from "./pages/ChatApp";
import { useAuthSocket } from "./hooks/useAuthSocket";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { logged, logout } = useAuthSocket();

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
