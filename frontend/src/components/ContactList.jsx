import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import UserListItem from "./ui/UserListItem";

function ContactList() {
    const { getAllContacts, allContacts, setSelectedUser, selectedUser, isUsersLoading } = useChatStore();
    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getAllContacts();
    }, [getAllContacts]);

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
                        onClick={() => setSelectedUser(contact)}
                        subtitle={isOnline ? "Online" : "Offline"}
                    />
                );
            })}
        </div>
    );
}
export default ContactList;


