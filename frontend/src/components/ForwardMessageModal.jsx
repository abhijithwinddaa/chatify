import { useState, useEffect } from "react";
import { XIcon, ForwardIcon, SearchIcon, UsersIcon, UserIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

/**
 * ForwardMessageModal
 * 
 * Modal to select a contact or group to forward a message to.
 * Shows contacts and groups with search functionality.
 */
function ForwardMessageModal({ isOpen, onClose, message }) {
    const { allContacts, getAllContacts, forwardMessage } = useChatStore();
    const { groups, getMyGroups } = useGroupStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("contacts"); // "contacts" or "groups"
    const [isForwarding, setIsForwarding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getAllContacts();
            getMyGroups();
        }
    }, [isOpen, getAllContacts, getMyGroups]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !message) return null;

    // Filter contacts by search
    const filteredContacts = allContacts.filter(contact =>
        contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter groups by search
    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleForward = async (receiverId, groupId) => {
        setIsForwarding(true);
        const result = await forwardMessage(message._id, receiverId, groupId);
        setIsForwarding(false);
        if (result) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-700/50 overflow-hidden animate-scale-in">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <ForwardIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">Forward Message</h3>
                                <p className="text-cyan-100 text-sm">Select a recipient</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Message Preview */}
                <div className="p-4 bg-slate-700/30 border-b border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">Message to forward:</p>
                    <p className="text-slate-200 truncate">
                        {message.text || (message.image ? "📷 Image" : "Voice message")}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts or groups..."
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg py-2 pl-10 pr-4 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-700/50">
                    <button
                        onClick={() => setActiveTab("contacts")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "contacts"
                                ? "text-cyan-400 border-b-2 border-cyan-400"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        <UserIcon className="w-4 h-4" />
                        Contacts ({filteredContacts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("groups")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "groups"
                                ? "text-cyan-400 border-b-2 border-cyan-400"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        <UsersIcon className="w-4 h-4" />
                        Groups ({filteredGroups.length})
                    </button>
                </div>

                {/* Recipient List */}
                <div className="max-h-72 overflow-y-auto">
                    {activeTab === "contacts" ? (
                        filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No contacts found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/50">
                                {filteredContacts.map((contact) => (
                                    <button
                                        key={contact._id}
                                        onClick={() => handleForward(contact._id, null)}
                                        disabled={isForwarding}
                                        className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                                    >
                                        <img
                                            src={contact.profilePic || "/avatar.png"}
                                            alt={contact.fullName}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="text-left flex-1">
                                            <p className="text-slate-200 font-medium">{contact.fullName}</p>
                                            <p className="text-slate-400 text-sm">{contact.email}</p>
                                        </div>
                                        <ForwardIcon className="w-4 h-4 text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        )
                    ) : (
                        filteredGroups.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No groups found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/50">
                                {filteredGroups.map((group) => (
                                    <button
                                        key={group._id}
                                        onClick={() => handleForward(null, group._id)}
                                        disabled={isForwarding}
                                        className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                            {group.groupPic ? (
                                                <img
                                                    src={group.groupPic}
                                                    alt={group.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UsersIcon className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-slate-200 font-medium">{group.name}</p>
                                            <p className="text-slate-400 text-sm">{group.members?.length || 0} members</p>
                                        </div>
                                        <ForwardIcon className="w-4 h-4 text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Loading Overlay */}
                {isForwarding && (
                    <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForwardMessageModal;
