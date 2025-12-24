import { useState, useEffect } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useDebounce } from "../hooks/useDebounce";
import {
    XIcon,
    UsersIcon,
    PencilIcon,
    TrashIcon,
    UserPlusIcon,
    UserMinusIcon,
    LogOutIcon,
    CameraIcon,
    CheckIcon,
    SearchIcon,
    LinkIcon,
    CopyIcon,
    RefreshCwIcon
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";

/**
 * GroupSettingsModal - Admin controls for group management
 * 
 * Features:
 * - View/edit group name and description
 * - Change group picture
 * - Add/remove members (admin only)
 * - Delete group (admin only)
 * - Leave group (for non-admins)
 */
function GroupSettingsModal({ isOpen, onClose, group }) {
    const { updateGroup, addMembers, removeMember, leaveGroup, deleteGroup, setSelectedGroup } = useGroupStore();
    const { allContacts, getAllContacts } = useChatStore();
    const { authUser, onlineUsers } = useAuthStore();

    const [activeTab, setActiveTab] = useState("info"); // info, members, add
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    const [newGroupPic, setNewGroupPic] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Debounce search query for better performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Confirm dialog states
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isRegeneratingLink, setIsRegeneratingLink] = useState(false);

    const isAdmin = group?.admin?._id === authUser._id || group?.admin === authUser._id;

    useEffect(() => {
        if (isOpen && group) {
            setEditedName(group.name || "");
            setEditedDescription(group.description || "");
            setNewGroupPic(null);
            setActiveTab("info");
            getAllContacts();
        }
    }, [isOpen, group, getAllContacts]);

    if (!isOpen || !group) return null;

    // Get member IDs for filtering
    const memberIds = group.members?.map(m => m._id || m) || [];

    // Filter contacts that are not already members using debounced search
    const availableContacts = allContacts.filter(
        contact => !memberIds.includes(contact._id)
    ).filter(
        contact => contact.fullName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const updateData = {
                name: editedName,
                description: editedDescription,
            };
            if (newGroupPic) {
                updateData.groupPic = newGroupPic;
            }
            await updateGroup(group._id, updateData);
            setIsEditing(false);
            toast.success("Group updated successfully");
        } catch (error) {
            toast.error("Failed to update group");
        }
        setIsLoading(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setNewGroupPic(reader.result);
        };
    };

    const handleAddMembers = async () => {
        if (selectedNewMembers.length === 0) {
            toast.error("Select at least one member to add");
            return;
        }
        setIsLoading(true);
        try {
            await addMembers(group._id, selectedNewMembers);
            setSelectedNewMembers([]);
            setActiveTab("members");
            toast.success("Members added successfully");
        } catch (error) {
            toast.error("Failed to add members");
        }
        setIsLoading(false);
    };

    const handleRemoveMember = async (memberId) => {
        setIsLoading(true);
        try {
            await removeMember(group._id, memberId);
            setMemberToRemove(null);
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
        setIsLoading(false);
    };

    const handleLeaveGroup = async () => {
        setIsLoading(true);
        try {
            await leaveGroup(group._id);
            setSelectedGroup(null);
            setShowLeaveConfirm(false);
            onClose();
            toast.success("Left the group");
        } catch (error) {
            toast.error("Failed to leave group");
        }
        setIsLoading(false);
    };

    const handleDeleteGroup = async () => {
        setIsLoading(true);
        try {
            await deleteGroup(group._id);
            setSelectedGroup(null);
            setShowDeleteConfirm(false);
            onClose();
            toast.success("Group deleted");
        } catch (error) {
            toast.error("Failed to delete group");
        }
        setIsLoading(false);
    };

    const toggleNewMember = (contactId) => {
        if (selectedNewMembers.includes(contactId)) {
            setSelectedNewMembers(prev => prev.filter(id => id !== contactId));
        } else {
            setSelectedNewMembers(prev => [...prev, contactId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-slate-200">Group Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "info"
                            ? "text-cyan-400 border-b-2 border-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        Info
                    </button>
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "members"
                            ? "text-cyan-400 border-b-2 border-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        Members ({group.members?.length || 0})
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab("add")}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "add"
                                ? "text-cyan-400 border-b-2 border-cyan-400"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Add Members
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                    {/* INFO TAB */}
                    {activeTab === "info" && (
                        <div className="space-y-4">
                            {/* Group Picture */}
                            <div className="flex justify-center">
                                <div className="relative group">
                                    <div className="size-24 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                                        {newGroupPic || group.groupPic ? (
                                            <img
                                                src={newGroupPic || group.groupPic}
                                                alt={group.name}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <UsersIcon className="w-12 h-12 text-slate-400" />
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <CameraIcon className="w-6 h-6 text-white" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Group Name */}
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Group Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200"
                                        maxLength={100}
                                    />
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-200">{group.name}</p>
                                        {isAdmin && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="text-cyan-400 hover:text-cyan-300"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Group Description */}
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Description</label>
                                {isEditing ? (
                                    <textarea
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 resize-none"
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Add a description..."
                                    />
                                ) : (
                                    <p className="text-slate-300">
                                        {group.description || "No description"}
                                    </p>
                                )}
                            </div>

                            {/* Save/Cancel buttons when editing */}
                            {isEditing && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedName(group.name);
                                            setEditedDescription(group.description || "");
                                            setNewGroupPic(null);
                                        }}
                                        className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={isLoading}
                                        className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50"
                                    >
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            )}

                            {/* Admin Badge */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-400">
                                    Created by: <span className="text-slate-200">{group.admin?.fullName || "Unknown"}</span>
                                    {isAdmin && <span className="ml-2 text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">Admin</span>}
                                </p>
                            </div>

                            {/* Invite Link Section */}
                            {/* Show for: admin (always) OR all members (if public group) */}
                            {(isAdmin || group.isPublic) && group.inviteCode && (
                                <div className="pt-4 border-t border-slate-700">
                                    <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                                        <LinkIcon className="w-4 h-4" />
                                        Invite Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/join/${group.inviteCode}`}
                                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join/${group.inviteCode}`);
                                                toast.success("Link copied!");
                                            }}
                                            className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
                                            title="Copy link"
                                        >
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={async () => {
                                                    setIsRegeneratingLink(true);
                                                    try {
                                                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/groups/${group._id}/regenerate-invite`, {
                                                            method: 'POST',
                                                            credentials: 'include'
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok) {
                                                            toast.success("Invite link regenerated!");
                                                            // Update local group state
                                                            group.inviteCode = data.inviteCode;
                                                        } else {
                                                            toast.error(data.message);
                                                        }
                                                    } catch (err) {
                                                        toast.error("Failed to regenerate link");
                                                    }
                                                    setIsRegeneratingLink(false);
                                                }}
                                                disabled={isRegeneratingLink}
                                                className="px-3 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50"
                                                title="Regenerate link"
                                            >
                                                <RefreshCwIcon className={`w-4 h-4 ${isRegeneratingLink ? 'animate-spin' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {group.isPublic ? "Anyone with this link can join" : "Only share with people you trust"}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-4">
                                {!isAdmin && (
                                    <button
                                        onClick={() => setShowLeaveConfirm(true)}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30"
                                    >
                                        <LogOutIcon className="w-5 h-5" />
                                        Leave Group
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                        Delete Group
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MEMBERS TAB */}
                    {activeTab === "members" && (
                        <div className="space-y-2">
                            {group.members?.map((member) => {
                                const memberId = member._id || member;
                                const memberIsAdmin = (group.admin?._id || group.admin) === memberId;
                                const isOnline = onlineUsers.includes(memberId);

                                return (
                                    <div
                                        key={memberId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                                                <div className="size-10 rounded-full">
                                                    <img
                                                        src={member.profilePic || "/avatar.png"}
                                                        alt={member.fullName}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-slate-200 font-medium">
                                                    {member.fullName}
                                                    {memberId === authUser._id && " (You)"}
                                                </p>
                                                {memberIsAdmin && (
                                                    <p className="text-xs text-cyan-400">Admin</p>
                                                )}
                                            </div>
                                        </div>
                                        {isAdmin && !memberIsAdmin && memberId !== authUser._id && (
                                            <button
                                                onClick={() => setMemberToRemove(member)}
                                                className="text-red-400 hover:text-red-300 p-2"
                                                title="Remove member"
                                            >
                                                <UserMinusIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ADD MEMBERS TAB */}
                    {activeTab === "add" && isAdmin && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-slate-200"
                                />
                            </div>

                            {/* Available Contacts */}
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {availableContacts.length === 0 ? (
                                    <p className="text-slate-400 text-center py-4">
                                        No contacts available to add
                                    </p>
                                ) : (
                                    availableContacts.map((contact) => (
                                        <div
                                            key={contact._id}
                                            onClick={() => toggleNewMember(contact._id)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedNewMembers.includes(contact._id)
                                                ? "bg-cyan-600/20 border border-cyan-500"
                                                : "bg-slate-700/50 hover:bg-slate-700"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full overflow-hidden">
                                                    <img
                                                        src={contact.profilePic || "/avatar.png"}
                                                        alt={contact.fullName}
                                                        className="size-full object-cover"
                                                    />
                                                </div>
                                                <p className="text-slate-200">{contact.fullName}</p>
                                            </div>
                                            {selectedNewMembers.includes(contact._id) && (
                                                <CheckIcon className="w-5 h-5 text-cyan-400" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Button */}
                            {selectedNewMembers.length > 0 && (
                                <button
                                    onClick={handleAddMembers}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                    Add {selectedNewMembers.length} Member{selectedNewMembers.length > 1 ? "s" : ""}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Dialogs */}
            <ConfirmDialog
                isOpen={showLeaveConfirm}
                onClose={() => setShowLeaveConfirm(false)}
                onConfirm={handleLeaveGroup}
                title="Leave Group"
                message="Are you sure you want to leave this group? You won't be able to see the messages anymore."
                confirmText="Yes, Leave"
                cancelText="No, Stay"
                danger={true}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteGroup}
                title="Delete Group"
                message="Are you sure you want to delete this group? This action cannot be undone and all messages will be lost."
                confirmText="Yes, Delete"
                cancelText="No, Keep"
                danger={true}
            />

            <ConfirmDialog
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={() => handleRemoveMember(memberToRemove?._id || memberToRemove)}
                title="Remove Member"
                message={`Are you sure you want to remove ${memberToRemove?.fullName || 'this member'} from the group?`}
                confirmText="Yes, Remove"
                cancelText="No, Keep"
                danger={true}
            />
        </div>
    );
}

export default GroupSettingsModal;

