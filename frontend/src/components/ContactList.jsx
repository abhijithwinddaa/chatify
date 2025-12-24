import { useEffect, memo, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import UserListItem from "./ui/UserListItem";

/**
 * ContactList Component
 * 
 * ⚡ Optimizations:
 * - React.memo: Only re-renders when contacts/selectedUser/onlineUsers change
 * - useCallback: Prevents function recreation on every render
 */
function ContactList() {
    const { getAllContacts, allContacts, setSelectedUser, selectedUser, isUsersLoading } = useChatStore();
    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getAllContacts();
    }, [getAllContacts]);

    // ⚡ useCallback: Same function reference unless setSelectedUser changes
    const handleSelectContact = useCallback((contact) => {
        setSelectedUser(contact);
    }, [setSelectedUser]);

    if (isUsersLoading) return <UsersLoadingSkeleton />;

    return (
        <div className="px-2 py-2">
            {allContacts.map((contact) => {
                const isOnline = onlineUsers.includes(contact._id);
                return (
                    <UserListItem
                        key={contact._id}
                        user={contact}
                        isSelected={selectedUser?._id === contact._id}
                        isOnline={isOnline}
                        onClick={() => handleSelectContact(contact)}
                        subtitle={isOnline ? "Online" : "Offline"}
                    />
                );
            })}
        </div>
    );
}

// ⚡ React.memo: Prevents re-render if props haven't changed
export default memo(ContactList);
