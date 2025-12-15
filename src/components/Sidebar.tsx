
import { FaSearch, FaUserPlus, FaUsers } from "react-icons/fa";

const Sidebar = () => {
	return (
		<div className="w-100 h-screen fixed top-0 left-0 mt-16 bg-[#222E35] flex flex-col border-r border-[#222E35]">
			{/* Search bar + icons */}
			<div className="p-4 flex items-center gap-2">
				<div className="relative flex-1">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
						<FaSearch size={16} />
					</span>
					<input
						type="text"
						placeholder="Tìm kiếm"
						className="w-full pl-9 pr-3 py-2 rounded bg-[#2A3942] text-white placeholder-gray-400 focus:outline-none"
					/>
				</div>
				<button className="ml-2 p-2 rounded hover:bg-[#2A3942] text-gray-300">
					<FaUserPlus size={20} />
				</button>
				<button className="p-2 rounded hover:bg-[#2A3942] text-gray-300">
					<FaUsers size={20} />
				</button>
			</div>
			{/* Chat list */}
			<div className="flex-1 overflow-y-auto">
				{/* Example chat item */}
				<div className="flex items-center px-4 py-3 hover:bg-[#2A3942] cursor-pointer">
					<div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold mr-3">DN</div>
					<div className="flex-1 min-w-0">
						<div className="flex justify-between items-center">
							<span className="font-semibold text-white">10d Frontend</span>
							<span className="text-xs text-gray-400">Vài giây</span>
						</div>
						<div className="text-gray-400 text-sm truncate">Đặng Trung Nghĩa: Duy Nhat ngu vai</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
