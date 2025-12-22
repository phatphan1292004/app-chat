import { useState, useRef, useEffect } from "react";
import { FaPhone, FaVideo, FaInfoCircle, FaSmile, FaPaperclip, FaImage } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { IoMdSend } from "react-icons/io";
import EmojiPickerModal from "./EmojiPickerModal";
import MessageItem from "./MessageItem";
import MenuDropdown from "./MenuDropdown";
import { useChat } from "../hooks/useChat";

interface ChatViewProps {
	currentRoom?: string | null;
	currentUser?: string | null;
	chatType?: "room" | "people";
}

const ChatView: React.FC<ChatViewProps> = ({ 
	currentRoom = null, 
	currentUser = null,
	chatType = "room"
}) => {
	const { messages, sendMessage: sendMessageViaSocket, addReaction } = useChat({
		currentRoom,
		currentUser,
		chatType,
	});

	const [inputValue, setInputValue] = useState("");
	const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [expandedImageId, setExpandedImageId] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const hoverHideTimeout = useRef<number | null>(null);

	const handleSendMessage = () => {
		if (inputValue.trim()) {
			sendMessageViaSocket(inputValue);
			setInputValue("");
		}
	};

	const handleAddReaction = (messageId: number, emoji: string) => {
		addReaction(messageId, emoji);
		setHoveredMessageId(null);
	};

	const handleEmojiSelect = (emoji: string) => {
		setInputValue(inputValue + emoji);
	};

	const handleHoverStart = (messageId: number) => {
		if (hoverHideTimeout.current) {
			clearTimeout(hoverHideTimeout.current);
			hoverHideTimeout.current = null;
		}
		setHoveredMessageId(messageId);
	};

	const handleHoverEnd = () => {
		if (hoverHideTimeout.current) {
			clearTimeout(hoverHideTimeout.current);
		}
		hoverHideTimeout.current = window.setTimeout(() => {
			setHoveredMessageId(null);
			hoverHideTimeout.current = null;
		}, 250);
	};

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const imageData = event.target?.result as string;
				sendMessageViaSocket(imageData);
			};
			reader.readAsDataURL(file);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const displayName = currentRoom || currentUser || "Chat";

	return (
		<div className="flex flex-col h-full">
			{/* Chat Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold mr-3">
						{(displayName || "").substring(0, 2).toUpperCase()}
					</div>
					<div>
						<h2 className="font-semibold text-black">{displayName}</h2>
						<p className="text-xs text-gray-500">{chatType === "room" ? "Nhóm chat" : "Cuộc trò chuyện cá nhân"}</p>
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
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full text-gray-400">
						Chưa có tin nhắn
					</div>
				) : (
					messages.map((message) => (
						<MessageItem
							key={message.id}
							message={message}
							index={messages.indexOf(message)}
							isHovered={hoveredMessageId === message.id}
							openMenuId={openMenuId}
							onHoverStart={handleHoverStart}
							onHoverEnd={handleHoverEnd}
							onAddReaction={handleAddReaction}
							onOpenMenu={(id) =>
								setOpenMenuId(openMenuId === id ? null : id)
							}
							onExpandImage={setExpandedImageId}
							MenuDropdown={MenuDropdown}
						/>
					))
				)}
				<div ref={messagesEndRef} className="h-1" />
			</div>

			{/* Input Area */}
			<div className="bg-white border-t border-gray-200">
				{/* Hàng trên: các nút chức năng */}
				<div className="flex items-center gap-3 px-4 py-1 border-b border-gray-200">
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaPaperclip size={20} />
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
						title="Chọn ảnh"
					>
						<FaImage size={20} />
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleImageUpload}
						className="hidden"
					/>
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
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSendMessage();
							}
						}}
						placeholder={`Nhập tin nhắn tới ${displayName}`}
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

				{/* Image Viewer Modal */}
				{expandedImageId !== null && (
					<div
						className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
						onClick={() => setExpandedImageId(null)}
					>
						<div
							className="relative max-w-4xl max-h-[90vh]"
							onClick={(e) => e.stopPropagation()}
						>
							<img
								src={
									messages.find((m) => m.id === expandedImageId)
										?.content || ""
								}
								alt="expanded"
								className="w-full h-full object-contain rounded-lg"
							/>
							<button
								onClick={() => setExpandedImageId(null)}
								className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200 transition"
								title="Đóng"
							>
								<AiOutlineClose className="w-6 h-6 text-black" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatView;
