import Header from "./components/Header";
import Sidebar from "./components/Sidebar";


function App() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header ở trên cùng */}
      <Header />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar bên trái */}
        <Sidebar />
        {/* Nội dung chính */}
        <div className="flex-1 bg-[#111b21] overflow-auto">
          <h1 className="text-3xl font-bold underline text-red-500 p-8">
            Hello world!
          </h1>
        </div>
      </div>
    </div>
  );
}

export default App;
