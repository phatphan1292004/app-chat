export interface Message {
	id: number;
	sender: string;
	avatar: string;
	content: string;
	timestamp: string;
	isOwn: boolean;
	reactions?: Record<string, number>;
	isSticker?: boolean;
}
