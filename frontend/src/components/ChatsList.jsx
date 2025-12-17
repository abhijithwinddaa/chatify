import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import UserListItem from "./ui/UserListItem";
import UnreadBadge from "./ui/UnreadBadge";

function ChatsList() {
    const { chats, getMyChatPartners, isUsersLoading, setSelectedUser, selectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getMyChatPartners();
    }, [getMyChatPartners]);

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
                        onClick={() => setSelectedUser(chat)}
                        subtitle={chat.lastMessage || (isOnline ? "Online" : "Offline")}
                        badge={<UnreadBadge count={chat.unreadCount} />}
                    />
                );
            })}
        </div>
    )
}

export default ChatsList


