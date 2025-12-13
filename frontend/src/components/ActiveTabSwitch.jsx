import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

function ActiveTabSwitch() {
    const { activeTab, setActiveTab, setSelectedUser } = useChatStore();
    const { setSelectedGroup } = useGroupStore();

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
        </div>
    )
}

export default ActiveTabSwitch
