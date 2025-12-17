import { useState } from "react";
import { FaSearch, FaUserPlus } from "react-icons/fa";
import { MdGroupAdd } from "react-icons/md";
import ChatItem from "./ChatItem";
import Modal from "./Modal";

const Sidebar = () => {
	const [openAddFriend, setOpenAddFriend] = useState(false);
	const [openCreateGroup, setOpenCreateGroup] = useState(false);

	return (
		<div className="w-100 h-screen fixed top-0 left-0 mt-20 bg-[#222E35] flex flex-col border-r border-[#222E35]">
			{/* Search bar + icons */}
			<div className="p-4 flex items-center">
				<div className="relative flex-1">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
						<FaSearch size={20} />
					</span>
					<input
						type="text"
						placeholder="Tìm kiếm"
						className="w-full text-lg pl-11 pr-3 py-2 rounded-lg bg-[#2A3942] text-white placeholder-gray-400 focus:outline-none"
					/>
				</div>
				<button
					className="ml-2 p-3 rounded hover:bg-[#2A3942] text-gray-300"
					onClick={() => setOpenAddFriend(true)}
				>
					<FaUserPlus size={18} />
				</button>
				<button
					className="p-3 rounded hover:bg-[#2A3942] text-gray-300"
					onClick={() => setOpenCreateGroup(true)}
				>
					<MdGroupAdd size={18} />
				</button>
			</div>
			{/* Chat list */}
			<div className="flex-1 overflow-y-auto">
				{/* Example chat item */}
				<ChatItem
					avatar="DN"
					name="10d Frontend"
					time="Vài giây"
					lastMessage="Đặng Trung Nghĩa: Duy Nhat ngu vai"
				/>
			</div>

			{/* Modal Add Friend */}
			<Modal open={openAddFriend} onClose={() => setOpenAddFriend(false)} title="Thêm bạn">
				<div className="flex flex-col gap-4">
					<input
						type="text"
						placeholder="Nhập tên người dùng..."
						className="w-full text-lg px-4 py-2 rounded bg-[#2A3942] text-white placeholder-gray-400 focus:outline-none"
					/>
					<button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded">Tìm kiếm</button>
				</div>
			</Modal>

			{/* Modal Create Group */}
			<Modal open={openCreateGroup} onClose={() => setOpenCreateGroup(false)} title="Tạo nhóm">
				{/* Nội dung modal tạo nhóm */}
				<div className="flex flex-col gap-4">
					<input
						type="text"
						placeholder="Nhập tên nhóm..."
						className="w-full text-lg px-4 py-2 rounded bg-[#2A3942] text-white placeholder-gray-400 focus:outline-none"
					/>
					<button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded">Tạo nhóm</button>
				</div>
			</Modal>
		</div>
	);
};

export default Sidebar;
