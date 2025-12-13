import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
    const { getAllContacts, allContacts, setSelectedUser, selectedUser, isUsersLoading } = useChatStore();
    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getAllContacts();
    }, [getAllContacts]);

    if (isUsersLoading) return <UsersLoadingSkeleton />;

    return (
        <div className="px-2 py-2">
            {allContacts.map((contact) => (
                <div
                    key={contact._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${selectedUser?._id === contact._id
                            ? "bg-slate-700/60"
                            : "hover:bg-slate-700/40"
                        }`}
                    onClick={() => setSelectedUser(contact)}
                >
                    <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                        <div className="size-12 rounded-full">
                            <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-slate-200 font-medium truncate">{contact.fullName}</h4>
                        <p className="text-slate-500 text-xs">
                            {onlineUsers.includes(contact._id) ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
export default ContactList;

