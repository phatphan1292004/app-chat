interface MenuItemProps {
	label: string;
	isDanger?: boolean;
	showArrow?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, isDanger, showArrow }) => (
	<button
		className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${
			isDanger ? "text-red-600" : "text-gray-700"
		}`}
	>
		{label}
		{showArrow && <span className="ml-auto text-gray-400">›</span>}
	</button>
);

interface MenuDropdownProps {
	isOwn: boolean;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ isOwn }) => (
	<div
		className={`absolute top-8 ${
			isOwn ? "right-0" : "left-0"
		} bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max`}
	>
		<MenuItem label="Copy tin nhắn" />
		<MenuItem label="Ghim tin nhắn" />
		<MenuItem label="Đánh dấu tin nhắn" />
		<MenuItem label="Chọn nhiều tin nhắn" />
		<hr className="my-1" />
		<MenuItem label="Xem chi tiết" />
		<MenuItem label="Tuỳ chọn khác" showArrow />
		<hr className="my-1" />
		<MenuItem label="Xóa chi ở phía tôi" isDanger />
	</div>
);

export default MenuDropdown;
