export interface GiphySticker {
	id: string;
	title: string;
	emoji?: string; // Fallback emoji
	url?: string; // Image URL for animated stickers
}

export interface StickerPack {
	name: string;
	stickers: GiphySticker[];
}

// Animated sticker packs with emoji stickers (better compatibility)
const STICKER_PACKS: StickerPack[] = [
	{
		name: "Gần đây",
		stickers: [
			{ id: "1", title: "Haha", url: "😂", emoji: "😂" },
			{ id: "2", title: "Yêu", url: "❤️", emoji: "❤️" },
			{ id: "3", title: "Tuyệt vời", url: "👍", emoji: "👍" },
			{ id: "4", title: "Ngạc nhiên", url: "😮", emoji: "😮" },
			{ id: "5", title: "Buồn", url: "😢", emoji: "😢" },
			{ id: "6", title: "Tức giận", url: "😡", emoji: "😡" },
		]
	},
	{
		name: "Mặt cười",
		stickers: [
			{ id: "7", title: "Cười tươi", url: "😄", emoji: "😄" },
			{ id: "8", title: "Cười ngất", url: "😂", emoji: "😂" },
			{ id: "9", title: "Thương", url: "😍", emoji: "😍" },
			{ id: "10", title: "Thoải mái", url: "😌", emoji: "😌" },
			{ id: "11", title: "Tự tin", url: "😎", emoji: "😎" },
			{ id: "12", title: "Hôn", url: "😘", emoji: "😘" },
			{ id: "13", title: "Lười", url: "😪", emoji: "😪" },
			{ id: "14", title: "Đau đầu", url: "😵", emoji: "😵" },
		]
	},
	{
		name: "Động vật",
		stickers: [
			{ id: "15", title: "Mèo cười", url: "😸", emoji: "😸" },
			{ id: "16", title: "Chó vui", url: "🐕", emoji: "🐕" },
			{ id: "17", title: "Gấu", url: "🐻", emoji: "🐻" },
			{ id: "18", title: "Pandas", url: "🐼", emoji: "🐼" },
			{ id: "19", title: "Chim", url: "🐦", emoji: "🐦" },
			{ id: "20", title: "Thỏ", url: "🐰", emoji: "🐰" },
		]
	},
	{
		name: "Yêu thương",
		stickers: [
			{ id: "21", title: "Trái tim", url: "❤️", emoji: "❤️" },
			{ id: "22", title: "Hôn", url: "💋", emoji: "💋" },
			{ id: "23", title: "Ôm", url: "🤗", emoji: "🤗" },
			{ id: "24", title: "Sánh vai", url: "👯", emoji: "👯" },
			{ id: "25", title: "Hạnh phúc", url: "😊", emoji: "😊" },
			{ id: "26", title: "Thương thương", url: "🥰", emoji: "🥰" },
		]
	},
	{
		name: "Lễ hội",
		stickers: [
			{ id: "27", title: "Sinh nhật", url: "🎂", emoji: "🎂" },
			{ id: "28", title: "Pháo hoa", url: "🎉", emoji: "🎉" },
			{ id: "29", title: "Quà", url: "🎁", emoji: "🎁" },
			{ id: "30", title: "Cây Noel", url: "🎄", emoji: "🎄" },
			{ id: "31", title: "Pháo", url: "🎆", emoji: "🎆" },
			{ id: "32", title: "Đèn lồng", url: "🏮", emoji: "🏮" },
		]
	},
	{
		name: "Cảm xúc",
		stickers: [
			{ id: "33", title: "Sợ", url: "😨", emoji: "😨" },
			{ id: "34", title: "Khóc", url: "😭", emoji: "😭" },
			{ id: "35", title: "Tức giận", url: "😠", emoji: "😠" },
			{ id: "36", title: "Bối rối", url: "😕", emoji: "😕" },
			{ id: "37", title: "Mặc cảm", url: "😔", emoji: "😔" },
			{ id: "38", title: "Nhạo", url: "😏", emoji: "😏" },
		]
	}
];

class GiphyService {
	getAllStickerPacks(): StickerPack[] {
		return STICKER_PACKS;
	}

	getStickerPack(index: number): StickerPack | null {
		return STICKER_PACKS[index] || null;
	}

	searchStickers(query: string): GiphySticker[] {
		if (!query.trim()) {
			return STICKER_PACKS[0].stickers;
		}

		const results: GiphySticker[] = [];
		STICKER_PACKS.forEach(pack => {
			pack.stickers.forEach(sticker => {
				if (sticker.title.toLowerCase().includes(query.toLowerCase())) {
					results.push(sticker);
				}
			});
		});
		return results;
	}

	getTrendingStickers(): GiphySticker[] {
		return STICKER_PACKS[0].stickers;
	}
}

export default new GiphyService();
