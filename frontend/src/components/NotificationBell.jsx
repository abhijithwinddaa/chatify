import { useState, useEffect, useRef } from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useGroupStore } from "../store/useGroupStore";
import { BellIcon, CheckIcon, XIcon, UsersIcon, TrashIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * NotificationBell - Bell icon with dropdown for notifications
 * 
 * Features:
 * - Badge showing unread count
 * - Dropdown with notification list
 * - Accept/Decline buttons for group invites
 * - Mark as read, delete actions
 */
function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        getNotifications,
        markAllAsRead,
        deleteNotification,
        acceptInvite,
        declineInvite,
        subscribeToNotifications,
        unsubscribeFromNotifications
    } = useNotificationStore();

    const { getMyGroups } = useGroupStore();

    // Fetch notifications and subscribe on mount
    useEffect(() => {
        getNotifications();
        subscribeToNotifications();

        return () => {
            unsubscribeFromNotifications();
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleAcceptInvite = async (groupId) => {
        const group = await acceptInvite(groupId);
        if (group) {
            // Refresh groups list
            getMyGroups();
        }
    };

    const handleDeclineInvite = async (groupId) => {
        await declineInvite(groupId);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "group_invite":
                return "👥";
            case "group_join":
                return "✅";
            case "group_added":
                return "➕";
            case "group_removed":
                return "❌";
            default:
                return "🔔";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-[9999]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-700">
                        <h3 className="font-medium text-slate-200">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-cyan-400 hover:text-cyan-300"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-slate-400">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                                <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${!notification.isRead ? "bg-slate-700/20" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon or Avatar */}
                                        <div className="flex-shrink-0">
                                            {notification.fromUser?.profilePic ? (
                                                <img
                                                    src={notification.fromUser.profilePic}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-lg">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-200">
                                                {notification.message}
                                            </p>

                                            {/* Group name if available */}
                                            {notification.groupId && (
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <UsersIcon className="w-3 h-3" />
                                                    {notification.groupId.name}
                                                </p>
                                            )}

                                            {/* Time */}
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>

                                            {/* Action buttons for invites */}
                                            {notification.type === "group_invite" && notification.actionStatus === "pending" && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleAcceptInvite(notification.groupId?._id)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-cyan-600 text-white text-xs rounded-lg hover:bg-cyan-500 transition-colors"
                                                    >
                                                        <CheckIcon className="w-3 h-3" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineInvite(notification.groupId?._id)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-slate-600 text-slate-200 text-xs rounded-lg hover:bg-slate-500 transition-colors"
                                                    >
                                                        <XIcon className="w-3 h-3" />
                                                        Decline
                                                    </button>
                                                </div>
                                            )}

                                            {/* Status for handled invites */}
                                            {notification.type === "group_invite" && notification.actionStatus === "accepted" && (
                                                <span className="inline-block mt-2 text-xs text-green-400">✓ Accepted</span>
                                            )}
                                            {notification.type === "group_invite" && notification.actionStatus === "declined" && (
                                                <span className="inline-block mt-2 text-xs text-slate-400">✗ Declined</span>
                                            )}
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors p-1"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
