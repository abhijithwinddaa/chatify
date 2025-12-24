import { useState, useRef, useEffect } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { XIcon, ImageIcon, Loader2Icon, UsersIcon, SearchIcon, GlobeIcon, LockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { validateGroupName } from "../lib/validators";

/**
 * CreateGroupModal Component
 * 
 * Modal dialog for creating a new group with:
 * - Group name input with debounced validation
 * - Group picture upload
 * - Member selection from contacts
 * - Create button
 */
function CreateGroupModal({ isOpen, onClose }) {
    const [groupName, setGroupName] = useState("");
    const [groupNameError, setGroupNameError] = useState("");
    const [description, setDescription] = useState("");
    const [groupPic, setGroupPic] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const fileInputRef = useRef(null);

    const { createGroup, isCreatingGroup } = useGroupStore();
    const { allContacts, getAllContacts, isUsersLoading } = useChatStore();

    // Debounced group name validation
    const debouncedGroupName = useDebounce(groupName, 300);
    // Debounced search query for contacts
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        const result = validateGroupName(debouncedGroupName);
        setGroupNameError(result.error);
    }, [debouncedGroupName]);

    // Fetch contacts when modal opens
    useEffect(() => {
        if (isOpen && allContacts.length === 0) {
            getAllContacts();
        }
    }, [isOpen, allContacts.length, getAllContacts]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setGroupPic(reader.result);
        reader.readAsDataURL(file);
    };

    const toggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim()) return;
        if (selectedMembers.length === 0) return;

        const result = await createGroup({
            name: groupName.trim(),
            description: description.trim(),
            groupPic,
            memberIds: selectedMembers,
            isPublic,
        });

        if (result) {
            // Reset form and close
            setGroupName("");
            setDescription("");
            setGroupPic(null);
            setSelectedMembers([]);
            setIsPublic(false);
            onClose();
        }
    };

    // Filter contacts based on debounced search
    const filteredContacts = allContacts.filter(contact =>
        contact.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-200">Create Group</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Group Picture */}
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="relative group"
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                                {groupPic ? (
                                    <img src={groupPic} alt="Group" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <UsersIcon className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Group Name */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-sm mb-2">Group Name *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className={`w-full bg-slate-700 border rounded-lg py-2 px-3 pr-10 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${groupNameError ? 'border-red-500' : groupName && !groupNameError ? 'border-green-500' : 'border-slate-600'
                                    }`}
                                placeholder="Enter group name"
                                maxLength={100}
                            />
                            {groupName && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {groupNameError ? (
                                        <XCircleIcon className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                    )}
                                </div>
                            )}
                        </div>
                        {groupNameError && (
                            <p className="mt-1 text-sm text-red-400">{groupNameError}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-sm mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                            placeholder="Optional description"
                            rows={2}
                            maxLength={500}
                        />
                    </div>

                    {/* Public/Private Toggle */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-sm mb-2">Group Visibility</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPublic(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${!isPublic
                                    ? "bg-slate-600 border-cyan-500 text-cyan-400"
                                    : "bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500"
                                    }`}
                            >
                                <LockIcon className="w-4 h-4" />
                                <span>Private</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPublic(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${isPublic
                                    ? "bg-cyan-600/20 border-cyan-500 text-cyan-400"
                                    : "bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500"
                                    }`}
                            >
                                <GlobeIcon className="w-4 h-4" />
                                <span>Public</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {isPublic
                                ? "Anyone can find and join this group"
                                : "Only invited members can join this group"
                            }
                        </p>
                    </div>

                    {/* Member Selection */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-sm mb-2">
                            Add Members * ({selectedMembers.length} selected)
                        </label>

                        {/* Search */}
                        <div className="relative mb-3">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-10 pr-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Search contacts..."
                            />
                        </div>

                        {/* Contacts List */}
                        <div className="max-h-48 overflow-y-auto bg-slate-700/50 rounded-lg">
                            {isUsersLoading ? (
                                <div className="p-4 text-center text-slate-400">Loading...</div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="p-4 text-center text-slate-400">No contacts found</div>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <button
                                        key={contact._id}
                                        onClick={() => toggleMember(contact._id)}
                                        className={`w-full flex items-center gap-3 p-3 hover:bg-slate-600/50 transition-colors ${selectedMembers.includes(contact._id) ? "bg-cyan-600/20" : ""
                                            }`}
                                    >
                                        <img
                                            src={contact.profilePic || "/avatar.png"}
                                            alt={contact.fullName}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <span className="flex-1 text-left text-slate-200">
                                            {contact.fullName}
                                        </span>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedMembers.includes(contact._id)
                                            ? "bg-cyan-500 border-cyan-500"
                                            : "border-slate-500"
                                            }`}>
                                            {selectedMembers.includes(contact._id) && (
                                                <span className="text-white text-xs">✓</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
                        className="flex-1 bg-cyan-600 text-white py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isCreatingGroup ? (
                            <Loader2Icon className="w-5 h-5 animate-spin" />
                        ) : (
                            "Create Group"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateGroupModal;
