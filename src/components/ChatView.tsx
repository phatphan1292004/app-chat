import React, { useState } from "react";
import { FaPhone, FaVideo, FaInfoCircle, FaSmile, FaPaperclip, FaImage } from "react-icons/fa";

interface Message {
	id: number;
	sender: string;
	avatar: string;
	content: string;
	timestamp: string;
	isOwn: boolean;
}

const ChatView = () => {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 1,
			sender: "Phat Phan",
			avatar: "PP",
			content: "Hello",
			timestamp: "23:24",
			isOwn: false,
		},
		{
			id: 2,
			sender: "You",
			avatar: "Y",
			content: "Hello Phat Phan",
			timestamp: "23:24",
			isOwn: true,
		},
		{
			id: 3,
			sender: "Phat Phan",
			avatar: "PP",
			content: "Làm bài đi",
			timestamp: "23:24",
			isOwn: false,
		},
		{
			id: 4,
			sender: "Phat Phan",
			avatar: "PP",
			content: "ok bạn nhé",
			timestamp: "23:25",
			isOwn: false,
		},
	]);
	const [inputValue, setInputValue] = useState("");

	const handleSendMessage = () => {
		if (inputValue.trim()) {
			const newMessage: Message = {
				id: messages.length + 1,
				sender: "You",
				avatar: "YN",
				content: inputValue,
				timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				isOwn: true,
			};
			setMessages([...messages, newMessage]);
			setInputValue("");
		}
	};

	return (
		<div className="flex flex-col h-full bg-white">
			{/* Chat Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold mr-3">
						PP
					</div>
					<div>
						<h2 className="font-semibold text-black">Phát Phan</h2>
						<p className="text-xs text-gray-500">xxx</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaPhone size={20} />
					</button>
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaVideo size={20} />
					</button>
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaInfoCircle size={20} />
					</button>
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
				{messages.map((message, index) => {
					const prevMessage = index > 0 ? messages[index - 1] : null;
					const isSameSender = prevMessage && prevMessage.sender === message.sender;
					
					return (
						<div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
							{!message.isOwn && (
								<div className="w-8 h-8 mr-3 flex-shrink-0">
									{!isSameSender && (
										<div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
											{message.avatar}
										</div>
									)}
								</div>
							)}
							<div className={`max-w-xs ${message.isOwn ? "bg-blue-100 text-black border border-blue-200 shadow-md" : "bg-gray-100 text-black border border-gray-200 shadow-md"} px-4 py-2 rounded-lg`}>
								{!message.isOwn && !isSameSender && <p className="text-xs text-gray-600 mb-1 font-semibold">{message.sender}</p>}
								<p className="text-sm">{message.content}</p>
							</div>
							{message.isOwn && (
								<div className="w-8 h-8 ml-2 flex-shrink-0">
									{!isSameSender && (
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
											YOU
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Input Area */}
			<div className="bg-white border-t border-gray-200 px-6 py-4">
				<div className="flex items-center gap-3">
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaPaperclip size={20} />
					</button>
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaImage size={20} />
					</button>
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
						placeholder="Nhập tin nhắn tới 10d Frontend"
						className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
					/>
					<button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
						<FaSmile size={20} />
					</button>
					<button
						onClick={handleSendMessage}
						className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition font-semibold text-sm"
					>
						Gửi
					</button>
				</div>
			</div>
		</div>
	);
};

export default ChatView;
