import { useEffect, memo, useCallback, useMemo } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { UsersIcon } from "lucide-react";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import EmptyState from "./ui/EmptyState";
import UnreadBadge from "./ui/UnreadBadge";

/**
 * GroupList Component
 * 
 * Displays a list of user's groups in the sidebar.
 * Clicking a group selects it for viewing messages.
 * 
 * ⚡ Optimizations:
 * - React.memo: Only re-renders when groups/selectedGroup/onlineUsers change
 * - useCallback: Prevents function recreation on every render
 * - useMemo: Caches online member calculation
 * - loading="lazy": Images load only when visible
 */
function GroupList() {
    const { groups, isLoadingGroups, getMyGroups, setSelectedGroup, selectedGroup } = useGroupStore();
    const { setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getMyGroups();
    }, [getMyGroups]);

    // ⚡ useCallback: Same function reference unless dependencies change
    const handleSelectGroup = useCallback((group) => {
        // Deselect any individual user when selecting a group
        setSelectedUser(null);
        setSelectedGroup(group);
    }, [setSelectedUser, setSelectedGroup]);

    // ⚡ useMemo: Only recalculate when groups or onlineUsers change
    const groupsWithOnlineCount = useMemo(() => {
        return groups.map(group => ({
            ...group,
            onlineCount: group.members?.filter(m => onlineUsers.includes(m._id)).length || 0
        }));
    }, [groups, onlineUsers]);

    if (isLoadingGroups) {
        return <UsersLoadingSkeleton />;
    }

    if (groups.length === 0) {
        return (
            <EmptyState
                icon={UsersIcon}
                title="No Groups Yet"
                description="Create a group to start chatting with multiple people at once."
            />
        );
    }

    return (
        <div className="overflow-y-auto flex-1">
            {groupsWithOnlineCount.map((group) => (
                <button
                    key={group._id}
                    onClick={() => handleSelectGroup(group)}
                    className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors ${selectedGroup?._id === group._id ? "bg-slate-800/70" : ""
                        }`}
                >
                    {/* Group Avatar */}
                    <div className="relative">
                        <div className="size-12 rounded-full overflow-hidden bg-slate-700">
                            {group.groupPic ? (
                                <img
                                    src={group.groupPic}
                                    alt={group.name}
                                    className="size-full object-cover"
                                    loading="lazy"  // ⚡ Lazy loading
                                />
                            ) : (
                                <div className="size-full flex items-center justify-center">
                                    <UsersIcon className="w-6 h-6 text-slate-400" />
                                </div>
                            )}
                        </div>
                        {/* Online indicator */}
                        {group.onlineCount > 0 && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                        )}
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-slate-200 font-medium truncate">
                                {group.name}
                            </h3>
                            {/* Unread count badge */}
                            <UnreadBadge count={group.unreadCount} />
                        </div>
                        <p className="text-slate-500 text-sm truncate">
                            {group.lastMessage || `${group.members?.length || 0} members`}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}

// ⚡ React.memo: Prevents re-render if props haven't changed
export default memo(GroupList);
