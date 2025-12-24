import { useState, useEffect } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { SearchIcon, UsersIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

/**
 * ExploreGroups - Browse and join public groups
 * 
 * Features:
 * - Search public groups
 * - View group info (name, description, member count)
 * - Join button for non-members
 * - Already joined indicator
 */
function ExploreGroups() {
    const [publicGroups, setPublicGroups] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [joiningGroupId, setJoiningGroupId] = useState(null);

    const { getPublicGroups, joinPublicGroup, setSelectedGroup } = useGroupStore();

    // Debounce search query to reduce filtering overhead
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Fetch public groups on mount
    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoading(true);
            const groups = await getPublicGroups();
            setPublicGroups(groups);
            setIsLoading(false);
        };
        fetchGroups();
    }, [getPublicGroups]);

    const handleJoinGroup = async (group) => {
        setJoiningGroupId(group._id);
        const result = await joinPublicGroup(group._id);
        if (result) {
            // Update local state
            setPublicGroups(publicGroups.map(g =>
                g._id === group._id ? { ...g, isMember: true } : g
            ));
            // Select the joined group
            setSelectedGroup(result);
        }
        setJoiningGroupId(null);
    };

    // Filter groups based on debounced search
    const filteredGroups = publicGroups.filter(group =>
        group.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-2 text-cyan-400 mb-3">
                    <GlobeIcon className="w-5 h-5" />
                    <h2 className="font-semibold">Explore Public Groups</h2>
                </div>

                {/* Search */}
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search public groups..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                        <Loader2Icon className="w-6 h-6 animate-spin" />
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                        <GlobeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{searchQuery ? "No groups found" : "No public groups available"}</p>
                    </div>
                ) : (
                    filteredGroups.map((group) => (
                        <div
                            key={group._id}
                            className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                {/* Group Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                                    {group.groupPic ? (
                                        <img
                                            src={group.groupPic}
                                            alt={group.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <UsersIcon className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Group Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-slate-200 font-medium truncate">
                                        {group.name}
                                    </h3>
                                    {group.description && (
                                        <p className="text-slate-400 text-sm line-clamp-2">
                                            {group.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <UsersIcon className="w-3 h-3" />
                                            {group.members?.length || 0} members
                                        </span>
                                        <span>by {group.admin?.fullName}</span>
                                    </div>
                                </div>

                                {/* Join Button */}
                                <div className="flex-shrink-0">
                                    {group.isMember ? (
                                        <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg">
                                            Joined
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleJoinGroup(group)}
                                            disabled={joiningGroupId === group._id}
                                            className="text-sm bg-cyan-600 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                                        >
                                            {joiningGroupId === group._id ? (
                                                <Loader2Icon className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Join"
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ExploreGroups;
