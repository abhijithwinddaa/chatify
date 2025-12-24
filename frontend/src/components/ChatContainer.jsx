import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "../components/MessagesLoadingSkeleton";
import MessageStatus from "./MessageStatus";
import TypingIndicator from "./TypingIndicator";
import ForwardMessageModal from "./ForwardMessageModal";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import FilePreview from "./FilePreview";
import LocationPreview from "./LocationPreview";
import { Trash2Icon, PencilIcon, CheckIcon, XIcon, SmileIcon, PinIcon, StarIcon, ForwardIcon, ReplyIcon, ClockIcon } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

// Quick reaction emojis
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * ChatContainer Component
 * 
 * ⚡ Optimizations:
 * - React.memo: Prevents re-render when props haven't changed
 * - useMemo: Caches grouped reactions calculation
 * - useCallback: Prevents handler recreation
 * - loading="lazy": Images load only when visible
 */

function ChatContainer() {
    const {
        selectedUser,
        getMessagesByUserId,
        messages,
        isMessagesLoading,
        subscribeToMessages,
        unsubscribeFromMessages,
        markAsRead,
        typingUsers,
        deleteMessage,
        editMessage,
        addReaction,
        togglePin,
        toggleStar,
        replyingTo,
        setReplyingTo,
        clearReplyingTo,
    } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState("");
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const editInputRef = useRef(null);
    const reactionPickerRef = useRef(null);

    // Check if selected user is currently typing
    const isSelectedUserTyping = selectedUser && typingUsers[selectedUser._id];

    useEffect(() => {
        getMessagesByUserId(selectedUser._id);
        subscribeToMessages();

        // Mark messages from this user as read when opening the chat
        markAsRead(selectedUser._id);

        // clean up
        return () => {
            unsubscribeFromMessages();
            clearReplyingTo();
        };
    }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, markAsRead, clearReplyingTo]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isSelectedUserTyping]);

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingMessageId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingMessageId]);

    // Close reaction picker on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) {
                setShowReactionPicker(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ⚡ useCallback: Prevent recreation on every render
    const handleDeleteMessage = useCallback((messageId) => {
        deleteMessage(messageId);
    }, [deleteMessage]);

    // Start editing a message
    const handleStartEdit = (msg) => {
        setEditingMessageId(msg._id);
        setEditText(msg.text);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditText("");
    };

    // Save edited message
    const handleSaveEdit = async (messageId) => {
        if (!editText.trim()) {
            handleCancelEdit();
            return;
        }
        await editMessage(messageId, editText.trim());
        handleCancelEdit();
    };

    // Handle Enter key to save, Escape to cancel
    const handleEditKeyDown = (e, messageId) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit(messageId);
        } else if (e.key === "Escape") {
            handleCancelEdit();
        }
    };

    // ⚡ useCallback: Prevent recreation on every render
    const handleReaction = useCallback((messageId, emoji) => {
        addReaction(messageId, emoji);
        setShowReactionPicker(null);
    }, [addReaction]);

    // Check if user starred a message
    const isStarred = (msg) => {
        return msg.starredBy?.includes(authUser._id);
    };

    // ⚡ useMemo + useCallback: Caches calculation and prevents recreation
    const groupReactions = useCallback((reactions) => {
        if (!reactions || reactions.length === 0) return [];
        const grouped = {};
        reactions.forEach(r => {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = [];
            }
            grouped[r.emoji].push(r.userId);
        });
        return Object.entries(grouped).map(([emoji, users]) => ({ emoji, count: users.length, users }));
    }, []);

    return (
        <>
            <ChatHeader />
            <div className="flex-1 px-6 overflow-y-auto py-8">
                {messages.length > 0 && !isMessagesLoading ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg) => {
                            const isOwnMessage = msg.senderId === authUser._id;
                            const isEditing = editingMessageId === msg._id;
                            const canEdit = isOwnMessage && msg.text && !msg.image;
                            const reactions = groupReactions(msg.reactions);

                            return (
                                <div
                                    key={msg._id}
                                    className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                                    onMouseEnter={() => setHoveredMessageId(msg._id)}
                                    onMouseLeave={() => setHoveredMessageId(null)}
                                >
                                    <div className="relative">
                                        {/* Action buttons - absolutely positioned */}
                                        {hoveredMessageId === msg._id && !isEditing && (
                                            <div
                                                className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 ${isOwnMessage ? "right-full mr-2" : "left-full ml-2"}`}
                                                style={{ animation: "fadeIn 0.2s ease forwards" }}
                                            >
                                                {/* Reaction button */}
                                                <div className="relative" ref={showReactionPicker === msg._id ? reactionPickerRef : null}>
                                                    <button
                                                        onClick={() => setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id)}
                                                        className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                        title="Add reaction"
                                                    >
                                                        <SmileIcon className="w-4 h-4" />
                                                    </button>
                                                    {showReactionPicker === msg._id && (
                                                        <div className="absolute bottom-8 left-0 z-50 bg-slate-800 rounded-lg p-2 shadow-xl border border-slate-700 flex gap-1">
                                                            {QUICK_REACTIONS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleReaction(msg._id, emoji)}
                                                                    className="text-lg hover:scale-125 transition-transform p-1"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Reply button */}
                                                <button
                                                    onClick={() => setReplyingTo(msg)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                    title="Reply"
                                                >
                                                    <ReplyIcon className="w-4 h-4" />
                                                </button>
                                                {/* Forward button */}
                                                <button
                                                    onClick={() => setForwardingMessage(msg)}
                                                    className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                    title="Forward"
                                                >
                                                    <ForwardIcon className="w-4 h-4" />
                                                </button>
                                                {/* Pin button */}
                                                <button
                                                    onClick={() => togglePin(msg._id)}
                                                    className={`p-1.5 hover:bg-slate-700/50 rounded-lg transition-all ${msg.isPinned ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
                                                    title={msg.isPinned ? "Unpin" : "Pin"}
                                                >
                                                    <PinIcon className="w-4 h-4" />
                                                </button>
                                                {/* Star button */}
                                                <button
                                                    onClick={() => toggleStar(msg._id)}
                                                    className={`p-1.5 hover:bg-slate-700/50 rounded-lg transition-all ${isStarred(msg) ? "text-yellow-400" : "text-slate-400 hover:text-yellow-400"}`}
                                                    title={isStarred(msg) ? "Unstar" : "Star"}
                                                >
                                                    <StarIcon className="w-4 h-4" fill={isStarred(msg) ? "currentColor" : "none"} />
                                                </button>
                                                {/* Edit button - only for own text messages */}
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleStartEdit(msg)}
                                                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                        title="Edit message"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {/* Delete button */}
                                                <button
                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                                                    title="Delete for me"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div
                                            className={`chat-bubble relative ${isOwnMessage
                                                ? "bg-cyan-600 text-white"
                                                : "bg-slate-800 text-slate-200"
                                                }`}
                                        >
                                            {/* Pinned indicator */}
                                            {msg.isPinned && (
                                                <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                                                    <PinIcon className="w-3 h-3 text-white" />
                                                </div>
                                            )}

                                            {/* Reply preview */}
                                            {msg.replyTo && (
                                                <div className="bg-slate-700/50 rounded-lg p-2 mb-2 border-l-2 border-cyan-500 text-sm opacity-75">
                                                    <p className="truncate">{msg.replyTo.text || "📷 Image"}</p>
                                                </div>
                                            )}

                                            {/* Forwarded label */}
                                            {msg.isForwarded && (
                                                <p className="text-xs italic opacity-75 mb-1 flex items-center gap-1">
                                                    <ForwardIcon className="w-3 h-3" /> Forwarded
                                                </p>
                                            )}

                                            {msg.image && (
                                                <img
                                                    src={msg.image}
                                                    alt="Shared"
                                                    className="rounded-lg h-48 object-cover"
                                                    loading="lazy"  // ⚡ Lazy loading
                                                />
                                            )}

                                            {/* Voice message */}
                                            {msg.audio && (
                                                <AudioPlayer src={msg.audio} duration={msg.audioDuration} />
                                            )}

                                            {/* Video message */}
                                            {msg.video && (
                                                <VideoPlayer src={msg.video} thumbnail={msg.videoThumbnail} duration={msg.videoDuration} />
                                            )}

                                            {/* File attachment */}
                                            {msg.file && (
                                                <FilePreview fileUrl={msg.file} fileName={msg.fileName} fileType={msg.fileType} fileSize={msg.fileSize} />
                                            )}

                                            {/* Location */}
                                            {msg.location && msg.location.latitude && (
                                                <LocationPreview latitude={msg.location.latitude} longitude={msg.location.longitude} address={msg.location.address} />
                                            )}

                                            {/* Disappearing message indicator */}
                                            {msg.expiresAt && (
                                                <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                                                    <ClockIcon className="w-3 h-3" />
                                                    <span>Disappearing</span>
                                                </div>
                                            )}

                                            {/* Edit mode */}
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        ref={editInputRef}
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        onKeyDown={(e) => handleEditKeyDown(e, msg._id)}
                                                        className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full min-w-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                        rows={2}
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 text-slate-300 hover:text-white transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEdit(msg._id)}
                                                            className="p-1 text-cyan-300 hover:text-white transition-colors"
                                                            title="Save"
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {msg.text && <p className="mt-2">{msg.text}</p>}
                                                </>
                                            )}

                                            {/* Reactions display */}
                                            {reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {reactions.map(({ emoji, count }) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(msg._id, emoji)}
                                                            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-full px-2 py-0.5 text-sm flex items-center gap-1 transition-colors"
                                                        >
                                                            <span>{emoji}</span>
                                                            <span className="text-xs opacity-75">{count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <p className="text-xs mt-1 opacity-75 flex items-center gap-1 justify-end">
                                                {/* Show starred indicator */}
                                                {isStarred(msg) && (
                                                    <StarIcon className="w-3 h-3 text-yellow-400" fill="currentColor" />
                                                )}
                                                {/* Show edited indicator */}
                                                {msg.isEdited && (
                                                    <span className="italic mr-1">edited</span>
                                                )}
                                                {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                                {/* Show status ticks only for messages sent by current user */}
                                                {isOwnMessage && (
                                                    <MessageStatus status={msg.status || "sent"} />
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Show typing indicator when selected user is typing */}
                        {isSelectedUserTyping && <TypingIndicator />}
                        {/* 👇 scroll target */}
                        <div ref={messageEndRef} />
                    </div>
                ) : isMessagesLoading ? (
                    <MessagesLoadingSkeleton />
                ) : (
                    <NoChatHistoryPlaceholder name={selectedUser.fullName} />
                )}
            </div>

            <MessageInput />

            {/* Forward Message Modal */}
            <ForwardMessageModal
                isOpen={!!forwardingMessage}
                onClose={() => setForwardingMessage(null)}
                message={forwardingMessage}
            />
        </>
    );
}

// ⚡ React.memo: Prevents re-render if props haven't changed
export default memo(ChatContainer);
