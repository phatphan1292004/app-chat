import React, { useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";

interface HeaderProps {
	onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
	const [showMenu, setShowMenu] = useState(false);

	const handleLogoutClick = () => {
		onLogout?.();
		setShowMenu(false);
	};

	return (
		<div className="h-18 w-full bg-[#222E35] top-0 right-0 sticky flex items-center justify-between px-4 border-b border-gray-600 select-none">
			<div className="text-white font-bold text-xl">Chat App</div>
			
			<div className="relative">
				<div 
					className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition"
					onClick={() => setShowMenu(!showMenu)}
				>
					YN
				</div>

				{showMenu && (
					<div className="absolute right-0 mt-2 w-48 bg-[#222E35] rounded-lg shadow-lg z-100">
						<div className="p-3 border-b border-gray-600">
							<p className="text-white font-semibold">YOU</p>
							<p className="text-gray-400 text-sm">user@example.com</p>
						</div>
						<button 
							onClick={handleLogoutClick}
							className="w-full flex items-center gap-3 px-4 py-3 text-red-400  text-left"
						>
							<FaSignOutAlt size={16} />
							Đăng xuất
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Header;
