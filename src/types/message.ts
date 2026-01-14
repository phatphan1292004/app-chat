export interface Message {
	id: number;
	sender: string;
	avatar: string;
	content: string;
	timestamp: string;
	createAt?: string; // Ngày giờ gốc từ API để nhóm theo ngày
	isOwn: boolean;
	reactions?: Record<string, number>;
	isSticker?: boolean;
}
