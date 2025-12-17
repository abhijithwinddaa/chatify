import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import { UsersIcon, Loader2Icon, ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";

/**
 * JoinByLinkPage - Page for joining groups via invite link
 * 
 * URL: /join/:inviteCode
 * Shows group preview and join button
 */
function JoinByLinkPage() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { authUser } = useAuthStore();
    const { setSelectedGroup } = useGroupStore();

    const [group, setGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroupInfo = async () => {
            setIsLoading(true);
            try {
                const res = await axiosInstance.get(`/groups/invite/${inviteCode}`);
                setGroup(res.data);
            } catch (err) {
                setError(err.response?.data?.message || "Invalid or expired invite link");
            } finally {
                setIsLoading(false);
            }
        };

        if (inviteCode) {
            fetchGroupInfo();
        }
    }, [inviteCode]);

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            const res = await axiosInstance.post(`/groups/join-by-code/${inviteCode}`);
            toast.success("You've joined the group!");
            setSelectedGroup(res.data);
            navigate("/chat");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to join group");
        } finally {
            setIsJoining(false);
        }
    };

    // If not logged in, redirect to login with return URL
    if (!authUser) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
                    <UsersIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-200 mb-2">Join Group</h1>
                    <p className="text-slate-400 mb-6">Please log in to join this group</p>
                    <button
                        onClick={() => navigate(`/login?redirect=/join/${inviteCode}`)}
                        className="w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium"
                    >
                        Log In to Continue
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2Icon className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="text-red-400 text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-slate-200 mb-2">Oops!</h1>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/chat")}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
                {/* Group Avatar */}
                <div className="flex justify-center mb-6">
                    <div className="size-24 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                        {group.groupPic ? (
                            <img
                                src={group.groupPic}
                                alt={group.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <UsersIcon className="w-12 h-12 text-slate-400" />
                        )}
                    </div>
                </div>

                {/* Group Info */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-200 mb-2">{group.name}</h1>
                    {group.description && (
                        <p className="text-slate-400 mb-3">{group.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <UsersIcon className="w-4 h-4" />
                        <span>{group.memberCount} members</span>
                        {group.isPublic && (
                            <span className="ml-2 text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">Public</span>
                        )}
                    </div>
                </div>

                {/* Admin Info */}
                {group.admin && (
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg mb-6">
                        <img
                            src={group.admin.profilePic || "/avatar.png"}
                            alt={group.admin.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <p className="text-slate-200 font-medium">{group.admin.fullName}</p>
                            <p className="text-slate-500 text-xs">Group Admin</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {group.isMember ? (
                    <div className="space-y-3">
                        <p className="text-center text-green-400 mb-2">✓ You're already a member</p>
                        <button
                            onClick={() => {
                                setSelectedGroup(group);
                                navigate("/chat");
                            }}
                            className="w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium"
                        >
                            Open Group Chat
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isJoining ? (
                            <>
                                <Loader2Icon className="w-5 h-5 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            "Join Group"
                        )}
                    </button>
                )}

                {/* Back Button */}
                <button
                    onClick={() => navigate("/chat")}
                    className="w-full mt-3 py-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default JoinByLinkPage;
