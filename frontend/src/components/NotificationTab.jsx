import { useEffect } from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { BellIcon, CheckIcon, Trash2Icon, Loader2Icon, UsersIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import EmptyState from "./ui/EmptyState";

/**
 * NotificationTab - Full tab for viewing notifications
 * Replaces the dropdown notification bell
 */
function NotificationTab() {
    const {
        notifications,
        isLoading,
        getNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        acceptInvite,
        declineInvite,
        subscribeToNotifications,
        unsubscribeFromNotifications
    } = useNotificationStore();
    const { getMyGroups } = useGroupStore();
    const { setActiveTab } = useChatStore();

    useEffect(() => {
        getNotifications();
        subscribeToNotifications();
        return () => unsubscribeFromNotifications();
    }, [getNotifications, subscribeToNotifications, unsubscribeFromNotifications]);

    const handleAcceptInvite = async (notification) => {
        await acceptInvite(notification.groupId);
        await getMyGroups();
    };

    const handleDeclineInvite = async (notification) => {
        await declineInvite(notification.groupId);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "group_invite":
                return <UsersIcon className="w-5 h-5 text-cyan-400" />;
            case "group_join":
                return <UsersIcon className="w-5 h-5 text-green-400" />;
            default:
                return <BellIcon className="w-5 h-5 text-slate-400" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2Icon className="w-8 h-8 text-cyan-500 animate-spin" />
                <p className="text-slate-400 mt-2">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <BellIcon className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-medium text-slate-200">Notifications</h2>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                        <CheckIcon className="w-3 h-3" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <EmptyState
                        icon={BellIcon}
                        title="No notifications"
                        description="You're all caught up! New notifications will appear here."
                    />
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-4 hover:bg-slate-700/30 transition-colors ${!notification.isRead ? "bg-slate-700/20" : ""
                                    }`}
                            >
                                <div className="flex gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-200 text-sm">
                                            {notification.message}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>

                                        {/* Action buttons for group invites */}
                                        {notification.type === "group_invite" && notification.actionStatus === "pending" && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleAcceptInvite(notification)}
                                                    className="px-3 py-1.5 bg-cyan-600 text-white text-xs rounded-lg hover:bg-cyan-500 transition-colors"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineInvite(notification)}
                                                    className="px-3 py-1.5 bg-slate-600 text-slate-200 text-xs rounded-lg hover:bg-slate-500 transition-colors"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}

                                        {/* Status badge for processed invites */}
                                        {notification.type === "group_invite" && notification.actionStatus !== "pending" && (
                                            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${notification.actionStatus === "accepted"
                                                ? "bg-green-600/20 text-green-400"
                                                : "bg-red-600/20 text-red-400"
                                                }`}>
                                                {notification.actionStatus === "accepted" ? "Accepted" : "Declined"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-shrink-0 flex items-start gap-1">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                                                title="Mark as read"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationTab;
