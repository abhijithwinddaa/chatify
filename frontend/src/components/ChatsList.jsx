import { useChatStore } from "../store/useChatStore";
import { useEffect, memo, useCallback } from "react";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import UserListItem from "./ui/UserListItem";
import UnreadBadge from "./ui/UnreadBadge";

/**
 * ChatsList Component
 * 
 * ⚡ Optimizations:
 * - React.memo: Only re-renders when chats/selectedUser/onlineUsers change
 * - useCallback: Prevents function recreation on every render
 */
function ChatsList() {
    const { chats, getMyChatPartners, isUsersLoading, setSelectedUser, selectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getMyChatPartners();
    }, [getMyChatPartners]);

    // ⚡ useCallback: Same function reference unless setSelectedUser changes
    const handleSelectUser = useCallback((chat) => {
        setSelectedUser(chat);
    }, [setSelectedUser]);

    if (isUsersLoading) return <UsersLoadingSkeleton />
    if (chats.length === 0) return <NoChatsFound />

    return (
        <div className="px-2 py-2">
            {chats.map(chat => {
                const isOnline = onlineUsers.includes(chat._id);
                return (
                    <UserListItem
                        key={chat._id}
                        user={chat}
                        isSelected={selectedUser?._id === chat._id}
                        isOnline={isOnline}
                        onClick={() => handleSelectUser(chat)}
                        subtitle={chat.lastMessage || (isOnline ? "Online" : "Offline")}
                        badge={<UnreadBadge count={chat.unreadCount} />}
                    />
                );
            })}
        </div>
    )
}

// ⚡ React.memo: Prevents re-render if props haven't changed
export default memo(ChatsList);
