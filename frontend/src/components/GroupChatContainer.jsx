import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { XIcon, UsersIcon, ImageIcon, SendIcon, SettingsIcon, SmileIcon, Trash2Icon, AlertTriangleIcon, PencilIcon, CheckIcon, PinIcon, StarIcon, ReplyIcon, ForwardIcon, BarChart3Icon, LanguagesIcon } from "lucide-react";
import toast from "react-hot-toast";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import GroupSettingsModal from "./GroupSettingsModal";
import ForwardMessageModal from "./ForwardMessageModal";
import GroupTypingIndicator from "./GroupTypingIndicator";
import CreatePollModal from "./CreatePollModal";
import PollCard from "./PollCard";
import EmojiPicker from "emoji-picker-react";
import { axiosInstance } from "../lib/axios";

// Quick reaction emojis
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * GroupChatContainer Component
 * 
 * Displays group chat interface with:
 * - Group header with avatar and member count
 * - Message list with sender info
 * - Message input for sending group messages
 * 
 * ⚡ Optimizations:
 * - React.memo: Prevents re-render when props haven't changed
 * - useCallback: Memoizes handlers
 * - loading="lazy": Images load only when visible
 */
function GroupChatContainer() {
    const { selectedGroup, groupMessages, isLoadingMessages, getGroupMessages, sendGroupMessage, setSelectedGroup, markGroupMessagesAsRead, deleteGroupMessage, clearGroupChat, editGroupMessage, groupTypingUsers } = useGroupStore();
    const { addReaction, togglePin, toggleStar } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState("");
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [showCreatePollModal, setShowCreatePollModal] = useState(false);
    const [polls, setPolls] = useState([]);
    const editInputRef = useRef(null);
    const reactionPickerRef = useRef(null);

    // Fetch polls for this group
    const fetchPolls = async () => {
        try {
            const res = await axiosInstance.get(`/polls/group/${selectedGroup._id}`);
            setPolls(res.data);
        } catch (err) {
            console.log("Error fetching polls:", err);
        }
    };

    useEffect(() => {
        if (selectedGroup?._id) {
            getGroupMessages(selectedGroup._id);
            markGroupMessagesAsRead(selectedGroup._id);
            fetchPolls(); // Load polls
        }
    }, [selectedGroup?._id, getGroupMessages, markGroupMessagesAsRead]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [groupMessages]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                if (editingMessageId) {
                    handleCancelEdit();
                } else if (replyingTo) {
                    setReplyingTo(null);
                } else if (showClearModal) {
                    setShowClearModal(false);
                } else if (showSettingsModal) {
                    setShowSettingsModal(false);
                } else {
                    setSelectedGroup(null);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [setSelectedGroup, showClearModal, showSettingsModal, editingMessageId, replyingTo]);

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

    const handleSendMessage = async (messageData) => {
        await sendGroupMessage(selectedGroup._id, {
            ...messageData,
            replyTo: replyingTo?._id
        });
        setReplyingTo(null);
    };

    // ⚡ useCallback: Prevent recreation on every render
    const handleDeleteMessage = useCallback((messageId) => {
        deleteGroupMessage(messageId);
    }, [deleteGroupMessage]);

    const handleClearChat = async () => {
        await clearGroupChat(selectedGroup._id);
        setShowClearModal(false);
    };

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
        await editGroupMessage(messageId, editText.trim());
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

    // ⚡ useCallback: Caches function
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

    if (!selectedGroup) return null;

    return (
        <>
            {/* Group Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                        {selectedGroup.groupPic ? (
                            <img
                                src={selectedGroup.groupPic}
                                alt={selectedGroup.name}
                                className="size-full object-cover"
                                loading="lazy"  // ⚡ Lazy loading
                            />
                        ) : (
                            <UsersIcon className="w-6 h-6 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-slate-200 font-medium">{selectedGroup.name}</h3>
                        <p className="text-slate-500 text-sm">
                            {selectedGroup.members?.length || 0} members
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowClearModal(true)}
                        className="text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors p-2 rounded-lg"
                        title="Clear group chat"
                    >
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowCreatePollModal(true)}
                        className="text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors p-2 rounded-lg"
                        title="Create Poll"
                    >
                        <BarChart3Icon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                        title="Group Settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                        title="Close"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 px-6 overflow-y-auto py-8">
                {isLoadingMessages ? (
                    <MessagesLoadingSkeleton />
                ) : groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <UsersIcon className="w-16 h-16 mb-4" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Active Polls Section */}
                        {polls.length > 0 && (
                            <div className="mb-6 space-y-3">
                                <h4 className="text-sm font-medium text-slate-400 mb-2">📊 Active Polls</h4>
                                {polls.filter(p => !p.isEnded).map((poll) => (
                                    <PollCard
                                        key={poll._id}
                                        poll={poll}
                                        currentUserId={authUser?._id}
                                        onVote={fetchPolls}
                                        onEnd={fetchPolls}
                                    />
                                ))}
                            </div>
                        )}
                        {groupMessages.map((msg) => {
                            const isOwnMessage = msg.senderId?._id === authUser._id || msg.senderId === authUser._id;
                            const senderName = isOwnMessage ? "You" : (msg.senderId?.fullName || "Unknown");
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
                                    {/* Sender Avatar - Left side for others */}
                                    {!isOwnMessage && (
                                        <div className="chat-image avatar">
                                            <div className="size-8 rounded-full">
                                                <img
                                                    src={msg.senderId?.profilePic || "/avatar.png"}
                                                    alt={senderName}
                                                    loading="lazy"  // ⚡ Lazy loading
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative">
                                        {/* Action buttons on hover - absolutely positioned */}
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

                                            {/* Sender Name (for others' messages) */}
                                            {!isOwnMessage && (
                                                <p className="text-xs text-cyan-400 font-medium mb-1">
                                                    {senderName}
                                                </p>
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
                                                    className="rounded-lg h-48 object-cover mb-2"
                                                    loading="lazy"  // ⚡ Lazy loading
                                                />
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
                                                    {msg.text && <p>{msg.text}</p>}
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

                                            <p className="text-xs mt-1 opacity-75 text-right flex items-center gap-1 justify-end">
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
                                            </p>
                                        </div>
                                    </div>

                                    {/* Own Avatar - Right side for own messages */}
                                    {isOwnMessage && (
                                        <div className="chat-image avatar">
                                            <div className="size-8 rounded-full">
                                                <img
                                                    src={authUser?.profilePic || "/avatar.png"}
                                                    alt="You"
                                                    loading="lazy"  // ⚡ Lazy loading
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Group Typing Indicator */}
                        {selectedGroup && groupTypingUsers[selectedGroup._id] && Object.keys(groupTypingUsers[selectedGroup._id]).length > 0 && (
                            <GroupTypingIndicator typingUsers={groupTypingUsers[selectedGroup._id]} />
                        )}
                        <div ref={messageEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input - reuse with custom handler */}
            <GroupMessageInput
                onSend={handleSendMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                groupId={selectedGroup?._id}
            />

            {/* Group Settings Modal */}
            <GroupSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                group={selectedGroup}
            />

            {/* Clear Group Chat Confirmation Modal */}
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
                                    <h3 className="text-white font-semibold text-lg">Clear Group Chat</h3>
                                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-slate-300 mb-2">
                                Are you sure you want to clear all messages in <span className="font-semibold text-white">{selectedGroup.name}</span>?
                            </p>
                            <p className="text-slate-400 text-sm">
                                This will remove all messages from your view. Other group members will still be able to see the messages.
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

            {/* Forward Message Modal */}
            <ForwardMessageModal
                isOpen={!!forwardingMessage}
                onClose={() => setForwardingMessage(null)}
                message={forwardingMessage}
            />

            {/* Create Poll Modal */}
            <CreatePollModal
                isOpen={showCreatePollModal}
                onClose={() => setShowCreatePollModal(false)}
                groupId={selectedGroup?._id}
                onSuccess={fetchPolls}
            />
        </>
    );
}

/**
 * GroupMessageInput - Message input for group chats
 * Similar to regular MessageInput but sends to group
 */
function GroupMessageInput({ onSend, replyingTo, onCancelReply, groupId }) {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { isSoundEnabled } = useChatStore();
    const { emitGroupTyping, emitGroupStopTyping } = useGroupStore();

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when replying
    useEffect(() => {
        if (replyingTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyingTo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        // Clear typing timeout and emit stop
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (groupId) emitGroupStopTyping(groupId);

        await onSend({
            text: text.trim(),
            image: imagePreview,
        });

        setText("");
        setImagePreview(null);
        setShowEmojiPicker(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Handle typing indicator
    const handleTyping = () => {
        if (!groupId) return;

        emitGroupTyping(groupId);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to emit stop typing after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
            emitGroupStopTyping(groupId);
        }, 2000);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file?.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleEmojiClick = (emojiData) => {
        setText(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    return (
        <div className="p-4 border-t border-slate-700/50">
            {/* Reply preview */}
            {replyingTo && (
                <div className="max-w-3xl mx-auto mb-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 flex items-start gap-3 border-l-2 border-cyan-500">
                        <ReplyIcon className="w-5 h-5 text-cyan-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-cyan-400 mb-1">Replying to {replyingTo.senderId?.fullName || "message"}</p>
                            <p className="text-sm text-slate-300 truncate">
                                {replyingTo.text || "📷 Image"}
                            </p>
                        </div>
                        <button
                            onClick={onCancelReply}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {imagePreview && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                        />
                        <button
                            onClick={() => {
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                            type="button"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex space-x-4 relative">
                {/* Emoji Picker */}
                <div className="relative" ref={emojiPickerRef}>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 py-2 transition-colors ${showEmojiPicker ? "text-cyan-500" : ""}`}
                    >
                        <SmileIcon className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50">
                            <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                theme="dark"
                                width={300}
                                height={400}
                                searchPlaceholder="Search emoji..."
                                previewConfig={{ showPreview: false }}
                            />
                        </div>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        handleTyping();
                    }}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-200"
                    placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                />

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${imagePreview ? "text-cyan-500" : ""
                        }`}
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <button
                    type="submit"
                    disabled={!text.trim() && !imagePreview}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}

// ⚡ React.memo: Prevents re-render if props haven't changed
export default memo(GroupChatContainer);
