import React from "react";
import { FaSignInAlt } from "react-icons/fa";

const Header = () => {
	return (
		<div className="h-16 bg-[#222E35] flex items-center justify-between px-4 border-b border-[#222E35] select-none">
			<div className="text-white font-bold text-xl">Chat App</div>
			
			<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
				<FaSignInAlt size={18} />
				Đăng nhập
			</button>
		</div>
	);
};

export default Header;
