import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { BellIcon } from "lucide-react";

function ActiveTabSwitch() {
    const { activeTab, setActiveTab, setSelectedUser } = useChatStore();
    const { setSelectedGroup } = useGroupStore();
    const { unreadCount } = useNotificationStore();

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Clear selections when switching tabs
        if (tab !== "groups") {
            setSelectedGroup(null);
        }
        if (tab === "groups") {
            setSelectedUser(null);
        }
    };

    return (
        <div className="tabs tabs-boxed bg-transparent p-2 m-2">
            <button
                onClick={() => handleTabChange("chats")}
                className={`tab ${activeTab === "chats" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                    }`}
            >
                Chats
            </button>
            <button
                className={`tab ${activeTab === "contacts" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                    }`}
                onClick={() => handleTabChange("contacts")}
            >
                Contacts
            </button>
            <button
                className={`tab ${activeTab === "groups" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                    }`}
                onClick={() => handleTabChange("groups")}
            >
                Groups
            </button>
            <button
                className={`tab ${activeTab === "explore" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                    }`}
                onClick={() => handleTabChange("explore")}
            >
                Explore
            </button>
            {/* Notifications Tab */}
            <button
                className={`tab relative ${activeTab === "notifications" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                    }`}
                onClick={() => handleTabChange("notifications")}
            >
                <BellIcon className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
        </div>
    )
}

export default ActiveTabSwitch

