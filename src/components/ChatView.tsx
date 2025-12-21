import { useState } from "react";
import { FaPhone, FaVideo, FaInfoCircle, FaSmile, FaPaperclip, FaImage, FaReply, FaShare, FaEllipsisV } from "react-icons/fa";
import { IoMdSend } from 'react-icons/io'
import EmojiPickerModal from "./EmojiPickerModal";

interface Message {
	id: number;
	sender: string;
	avatar: string;
	content: string;
	timestamp: string;
	isOwn: boolean;
	reactions?: Record<string, number>;
	isSticker?: boolean; // Flag to indicate if content is a sticker URL
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const INITIAL_MESSAGES: Message[] = [
	{ id: 1, sender: "Phat Phan", avatar: "PP", content: "Hello", timestamp: "23:24", isOwn: false },
	{ id: 2, sender: "You", avatar: "Y", content: "Hello Phat Phan", timestamp: "23:24", isOwn: true },
	{ id: 3, sender: "Phat Phan", avatar: "PP", content: "Làm bài đi", timestamp: "23:24", isOwn: false },
	{ id: 4, sender: "Phat Phan", avatar: "PP", content: "ok bạn nhé", timestamp: "23:25", isOwn: false },
];

interface ActionButtonProps {
	icon: React.ComponentType<{ size: number }>;
	title: string;
	onClick?: (e: React.MouseEvent) => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, title, onClick }) => (
	<button 
		className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"
		title={title}
		onClick={onClick}
	>
		<Icon size={14} />
	</button>
);

interface MenuDropdownProps {
	isOwn: boolean;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ isOwn }) => (
	<div className={`absolute top-8 ${isOwn ? "right-0" : "left-0"} bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max`}>
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

interface MenuItemProps {
	label: string;
	isDanger?: boolean;
	showArrow?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, isDanger, showArrow }) => (
	<button className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${isDanger ? "text-red-600" : "text-gray-700"}`}>
		{label}
		{showArrow && <span className="ml-auto text-gray-400">›</span>}
	</button>
);

const ChatView = () => {
	const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
	const [inputValue, setInputValue] = useState("");
	const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const handleSendMessage = () => {
		if (inputValue.trim()) {
			// Check if content is a sticker (starts with emoji or is a URL)
			const isStickerUrl = inputValue.trim().startsWith("https://media.tenor.com");
			const isEmoji = /^[\p{Emoji}]+$/u.test(inputValue.trim());
			const isSticker = isStickerUrl || isEmoji;
			
			const newMessage: Message = {
				id: messages.length + 1,
				sender: "You",
				avatar: "YN",
				content: inputValue,
				timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				isOwn: true,
				reactions: {},
				isSticker: isSticker,
			};
			setMessages([...messages, newMessage]);
			setInputValue("");
		}
	};

	const handleAddReaction = (messageId: number, emoji: string) => {
		setMessages(messages.map(msg => {
			if (msg.id === messageId) {
				const reactions = msg.reactions || {};
				reactions[emoji] = (reactions[emoji] || 0) + 1;
				return { ...msg, reactions };
			}
			return msg;
		}));
		setHoveredMessageId(null);
	};

	const handleEmojiSelect = (emoji: string) => {
		setInputValue(inputValue + emoji);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Chat Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold mr-3">
						PP
					</div>
					<div>
						<h2 className="font-semibold text-black">Phát Phan</h2>
						<p className="text-xs text-gray-500">xxx</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button className="p-2 hover:bg-primary-1/10 rounded-lg text-gray-600 transition">
						<FaPhone size={18} />
					</button>
					<button className="p-2 hover:bg-primary-1/10 rounded-lg text-gray-600 transition">
						<FaVideo size={18} />
					</button>
					<button className="p-2 hover:bg-primary-1/10 rounded-lg text-gray-600 transition">
						<FaInfoCircle size={18} />
					</button>
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gray-100">
				{messages.map((message, index) => {
					const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
					const isHovered = hoveredMessageId === message.id;
					
					return (
						<div 
							key={message.id} 
							className={`flex ${message.isOwn ? "justify-end" : "justify-start"} relative`}
							onMouseEnter={() => setHoveredMessageId(message.id)}
							onMouseLeave={() => setHoveredMessageId(null)}
						>
							{!message.isOwn && (
								<div className="w-8 h-8 mr-3 flex-shrink-0">
									{showAvatar && (
										<div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
											{message.avatar}
										</div>
									)}
								</div>
							)}
							<div className="relative">
								{message.isSticker ? (
									// Sticker display (emoji)
									<div className={`text-8xl flex items-center justify-center w-24 h-24 hover:scale-110 transition cursor-pointer`}>
										{message.content}
									</div>
								) : (
									// Text message display
									<div className={`max-w-xs ${message.isOwn ? "bg-primary-2 text-black border border-primary-2 shadow-md" : "bg-white text-black border border-gray-200 shadow-md"} px-4 py-2 rounded-lg`}>
										{!message.isOwn && showAvatar && <p className="text-xs text-gray-600 mb-1 font-semibold">{message.sender}</p>}
										<p className="text-sm">{message.content}</p>
										
										{/* Reactions Display */}
										{message.reactions && Object.keys(message.reactions).length > 0 && (
											<div className="flex gap-1 mt-2 flex-wrap">
												{Object.entries(message.reactions).map(([emoji, count]) => (
												<span key={emoji} className="bg-gray-200 rounded-full px-2 py-1 text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-300">
													{emoji} {count}
												</span>
												))}
											</div>
										)}
									</div>
								)}
							
								{/* Message Actions */}
								{isHovered && (
									<>
										{/* Emoji Picker */}
										<div className={`absolute ${index < 2 ? "-bottom-12" : "-top-12"} ${message.isOwn ? "right-0" : "left-0"} bg-white border border-gray-200 rounded-full px-3 py-2 shadow-lg flex gap-2 z-20`}>
											{EMOJIS.map(emoji => (
												<button
													key={emoji}
													className="text-lg hover:scale-125 transition cursor-pointer"
													onClick={() => handleAddReaction(message.id, emoji)}
													title={emoji}
												>
													{emoji}
												</button>
											))}
										</div>
										
										{/* Action Bar */}
										<div className={`absolute top-0 ${message.isOwn ? "right-full mr-2" : "left-full ml-2"} flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-lg`}>
											<ActionButton icon={FaReply} title="Trả lời" />
											<ActionButton icon={FaShare} title="Chuyển tiếp" />
											<ActionButton 
												icon={FaEllipsisV} 
												title="Menu"
												onClick={(e) => {
													e.stopPropagation();
													setOpenMenuId(openMenuId === message.id ? null : message.id);
												}}
											/>
										</div>
										
										{/* Dropdown Menu */}
										{openMenuId === message.id && <MenuDropdown isOwn={message.isOwn} />}
									</>
								)}
							</div>
							{message.isOwn && showAvatar && (
								<div className="w-8 h-8 ml-2 flex-shrink-0 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
									YOU
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Input Area */}
			<div className="bg-white border-t border-gray-200">
				{/* Hàng trên: các nút chức năng */}
				<div className="flex items-center gap-3 px-4 py-1 border-b border-gray-200">
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaPaperclip size={20} />
					</button>
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaImage size={20} />
					</button>
					<button 
						onClick={() => setShowEmojiPicker(true)}
						className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
					>
						<FaSmile size={20} />
					</button>
				</div>
				{/* Hàng dưới: input và gửi */}
				<div className="flex items-center gap-3 py-2 pl-2 pr-4">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
						placeholder="Nhập tin nhắn tới 10d Frontend"
						className="flex-1 px-4 py-2 rounded-full text-black placeholder-gray-500 focus:outline-none"
					/>
					<button
						onClick={handleSendMessage}
						className="text-primary-1 p-1 hover:bg-primary-1/10 rounded-sm transition flex items-center justify-center"
					>
						<IoMdSend size={22} />
					</button>
				</div>

				{/* Emoji Picker Modal */}
				<EmojiPickerModal
					isOpen={showEmojiPicker}
					onClose={() => setShowEmojiPicker(false)}
					onEmojiSelect={handleEmojiSelect}
				/>
			</div>
		</div>
	);
};

export default ChatView;
