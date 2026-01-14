import { useState, useEffect } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import giphyService, { type GiphySticker } from "../services/giphyService";
import { AiOutlineSearch } from "react-icons/ai";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { encodeEmoji } from "../utils";

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
}) => {
  const [activeTab, setActiveTab] = useState<"sticker" | "emoji" | "gif">(
    "sticker"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [stickers, setStickers] = useState<GiphySticker[]>([]);
  const [currentPackIndex, setCurrentPackIndex] = useState(0);
  const stickerPacks = giphyService.getAllStickerPacks();

  const loadStickers = () => {
    if (searchQuery.trim()) {
      setStickers(giphyService.searchStickers(searchQuery));
    } else {
      setStickers(stickerPacks[currentPackIndex]?.stickers || []);
    }
  };

  useEffect(() => {
    if (activeTab === "sticker" && isOpen) {
      loadStickers();
    }
  }, [activeTab, isOpen, currentPackIndex]);

  if (!isOpen) return null;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  const handleStickerClick = (sticker: GiphySticker) => {
    // Encode emoji để backend lưu được
    const stickerContent = sticker.emoji || sticker.url || "😊";
    const encodedEmoji = encodeEmoji(stickerContent);
    // Thêm prefix [STICKER] để utils nhận biết và hiển thị to
    onEmojiSelect(`[STICKER]${encodedEmoji}`);
    onClose();
  };

  const currentPack = stickerPacks[currentPackIndex];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-96 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 px-4 pt-3">
          <button
            onClick={() => setActiveTab("sticker")}
            className={`px-4 py-2 font-semibold text-sm transition border-b-2 ${
              activeTab === "sticker"
                ? "text-blue-600 border-blue-600"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            STICKER
          </button>
          <button
            onClick={() => setActiveTab("emoji")}
            className={`px-4 py-2 font-semibold text-sm transition border-b-2 ${
              activeTab === "emoji"
                ? "text-blue-600 border-blue-600"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            EMOJI
          </button>
          <button
            onClick={() => setActiveTab("gif")}
            className={`px-4 py-2 font-semibold text-sm transition border-b-2 ${
              activeTab === "gif"
                ? "text-gray-700 border-gray-800"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            GIF
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === "sticker" ? (
            <div className="p-4">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sticker"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Pack Title */}
              {!searchQuery && (
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  {currentPack?.name}
                </h3>
              )}

              {/* Stickers Grid */}
              {stickers.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerClick(sticker)}
                      className="w-28 h-28 rounded-lg overflow-hidden hover:scale-110 hover:shadow-lg transition cursor-pointer bg-white border border-gray-200 flex items-center justify-center group relative"
                      title={sticker.title}
                    >
                      <span className="text-6xl">{sticker.emoji}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  Không tìm thấy sticker
                </div>
              )}

              {/* Pack Navigation */}
              {!searchQuery && (
                <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-200 gap-2">
                  <button
                    onClick={() =>
                      setCurrentPackIndex(Math.max(0, currentPackIndex - 1))
                    }
                    disabled={currentPackIndex === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1 flex-wrap justify-center flex-1">
                    {stickerPacks.map((pack, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPackIndex(index)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          index === currentPackIndex
                            ? "bg-blue-600 text-white border-2 border-blue-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {pack.name}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPackIndex(
                        Math.min(stickerPacks.length - 1, currentPackIndex + 1)
                      )
                    }
                    disabled={currentPackIndex === stickerPacks.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "emoji" ? (
            <div className="p-3">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.LIGHT}
                width="100%"
                height="280px"
                searchPlaceholder="Tìm kiếm emoji"
                previewConfig={{ showPreview: false }}
                lazyLoadEmojis={true}
              />
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">Tính năng GIF sẽ sớm có sẵn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmojiPickerModal;
