import { X as XIcon, Trash2Icon, AlertTriangleIcon, SearchIcon, PinIcon, StarIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from '../store/useChatStore';
import { useEffect, useState, useRef } from "react";

function ChatHeader() {
    const { selectedUser, setSelectedUser, clearChat, searchMessages, getPinnedMessages, getStarredMessages } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const isOnline = onlineUsers.includes(selectedUser._id);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showPinnedModal, setShowPinnedModal] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === "Escape") {
                if (showSearch) {
                    setShowSearch(false);
                    setSearchQuery("");
                    setSearchResults([]);
                } else if (showPinnedModal) {
                    setShowPinnedModal(false);
                } else if (showClearModal) {
                    setShowClearModal(false);
                } else {
                    setSelectedUser(null);
                }
            }
        };
        window.addEventListener("keydown", handleEscKey);

        // cleanup
        return () => {
            window.removeEventListener("keydown", handleEscKey);
        };
    }, [setSelectedUser, showClearModal, showSearch, showPinnedModal]);

    // Focus search input when opened
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    const handleClearChat = async () => {
        await clearChat(selectedUser._id);
        setShowClearModal(false);
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                const results = await searchMessages(selectedUser._id, searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedUser._id, searchMessages]);

    const handleShowPinned = async () => {
        const pinned = await getPinnedMessages(selectedUser._id);
        setPinnedMessages(pinned);
        setShowPinnedModal(true);
    };

    return (
        <>
            <div className='flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 max-h-[84px] px-6 flex-1'>
                <div className='flex items-center space-x-3'>
                    <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                        <div className="w-12 rounded-full">
                            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} loading="lazy" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-200 font-medium">{selectedUser.fullName}</h3>
                        <p className="text-slate-400 text-sm">{isOnline ? "Online" : "Offline"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search toggle */}
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`p-2 hover:bg-slate-700/50 rounded-lg transition-all ${showSearch ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                        title="Search messages"
                    >
                        <SearchIcon className="w-5 h-5" />
                    </button>
                    {/* Pinned messages */}
                    <button
                        onClick={handleShowPinned}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-all"
                        title="Pinned messages"
                    >
                        <PinIcon className="w-5 h-5" />
                    </button>
                    {/* Clear chat */}
                    <button
                        onClick={() => setShowClearModal(true)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                        title="Clear chat"
                    >
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setSelectedUser(null)}>
                        <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-700/50">
                    <div className="max-w-3xl mx-auto relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg py-2 pl-10 pr-4 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="max-w-3xl mx-auto mt-2 bg-slate-700/50 rounded-lg max-h-60 overflow-y-auto">
                            {searchResults.map((msg) => (
                                <div key={msg._id} className="p-3 hover:bg-slate-600/50 border-b border-slate-600/30 last:border-0">
                                    <p className="text-slate-200 text-sm">{msg.text}</p>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {new Date(msg.createdAt).toLocaleDateString()} at {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                    {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <p className="text-slate-400 text-sm text-center mt-2">No messages found</p>
                    )}
                </div>
            )}

            {/* Pinned Messages Modal */}
            {showPinnedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-700/50 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <PinIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-white font-semibold text-lg">Pinned Messages</h3>
                                </div>
                                <button onClick={() => setShowPinnedModal(false)} className="text-white/80 hover:text-white">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 max-h-80 overflow-y-auto">
                            {pinnedMessages.length === 0 ? (
                                <p className="text-slate-400 text-center py-4">No pinned messages</p>
                            ) : (
                                <div className="space-y-3">
                                    {pinnedMessages.map((msg) => (
                                        <div key={msg._id} className="bg-slate-700/50 rounded-lg p-3">
                                            <p className="text-slate-200">{msg.text || "📷 Image"}</p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Chat Confirmation Modal */}
            {showClearModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-700/50 overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-500 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertTriangleIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Clear Chat</h3>
                                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-slate-300 mb-2">
                                Are you sure you want to clear all messages with <span className="font-semibold text-white">{selectedUser.fullName}</span>?
                            </p>
                            <p className="text-slate-400 text-sm">
                                This will remove all messages from your view. The other person will still be able to see the messages.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearChat}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2Icon className="w-4 h-4" />
                                Clear Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    )
}

export default ChatHeader