import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";


function App() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header ở trên cùng */}
      <Header />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar bên trái */}
        <Sidebar />
        {/* Nội dung chính */}
        <div className="flex-1 ml-100 overflow-hidden">
          <ChatView />
        </div>
      </div>
    </div>
  );
}

export default App;
