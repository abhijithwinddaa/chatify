import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "../components/MessagesLoadingSkeleton";
import MessageStatus from "./MessageStatus";
import TypingIndicator from "./TypingIndicator";

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
    } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

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
        };
    }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, markAsRead]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isSelectedUserTyping]);

    return (
        <>
            <ChatHeader />
            <div className="flex-1 px-6 overflow-y-auto py-8">
                {messages.length > 0 && !isMessagesLoading ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                            >
                                <div
                                    className={`chat-bubble relative ${msg.senderId === authUser._id
                                        ? "bg-cyan-600 text-white"
                                        : "bg-slate-800 text-slate-200"
                                        }`}
                                >
                                    {msg.image && (
                                        <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                                    )}
                                    {msg.text && <p className="mt-2">{msg.text}</p>}
                                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1 justify-end">
                                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                        {/* Show status ticks only for messages sent by current user */}
                                        {msg.senderId === authUser._id && (
                                            <MessageStatus status={msg.status || "sent"} />
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
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
        </>
    );
}

export default ChatContainer;


