import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { XIcon, UsersIcon } from "lucide-react";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

/**
 * GroupChatContainer Component
 * 
 * Displays group chat interface with:
 * - Group header with avatar and member count
 * - Message list with sender info
 * - Message input for sending group messages
 */
function GroupChatContainer() {
    const { selectedGroup, groupMessages, isLoadingMessages, getGroupMessages, sendGroupMessage, setSelectedGroup } = useGroupStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (selectedGroup?._id) {
            getGroupMessages(selectedGroup._id);
        }
    }, [selectedGroup?._id, getGroupMessages]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [groupMessages]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setSelectedGroup(null);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [setSelectedGroup]);

    const handleSendMessage = async (messageData) => {
        await sendGroupMessage(selectedGroup._id, messageData);
    };

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
                <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-2"
                >
                    <XIcon className="w-5 h-5" />
                </button>
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
                        {groupMessages.map((msg) => {
                            const isOwnMessage = msg.senderId?._id === authUser._id || msg.senderId === authUser._id;
                            const senderName = isOwnMessage ? "You" : (msg.senderId?.fullName || "Unknown");

                            return (
                                <div
                                    key={msg._id}
                                    className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                                >
                                    {/* Sender Avatar */}
                                    {!isOwnMessage && (
                                        <div className="chat-image avatar">
                                            <div className="size-8 rounded-full">
                                                <img
                                                    src={msg.senderId?.profilePic || "/avatar.png"}
                                                    alt={senderName}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className={`chat-bubble relative ${isOwnMessage
                                            ? "bg-cyan-600 text-white"
                                            : "bg-slate-800 text-slate-200"
                                            }`}
                                    >
                                        {/* Sender Name (for others' messages) */}
                                        {!isOwnMessage && (
                                            <p className="text-xs text-cyan-400 font-medium mb-1">
                                                {senderName}
                                            </p>
                                        )}

                                        {msg.image && (
                                            <img
                                                src={msg.image}
                                                alt="Shared"
                                                className="rounded-lg h-48 object-cover mb-2"
                                            />
                                        )}
                                        {msg.text && <p>{msg.text}</p>}
                                        <p className="text-xs mt-1 opacity-75 text-right">
                                            {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messageEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input - reuse with custom handler */}
            <GroupMessageInput onSend={handleSendMessage} />
        </>
    );
}

/**
 * GroupMessageInput - Message input for group chats
 * Similar to regular MessageInput but sends to group
 */
function GroupMessageInput({ onSend }) {
    const { useRef, useState } = require("react");
    const { ImageIcon, SendIcon, XIcon } = require("lucide-react");
    const toast = require("react-hot-toast").default;

    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const { isSoundEnabled } = useChatStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        await onSend({
            text: text.trim(),
            image: imagePreview,
        });

        setText("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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

    return (
        <div className="p-4 border-t border-slate-700/50">
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

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex space-x-4">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-200"
                    placeholder="Type your message..."
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

export default GroupChatContainer;
