import React from "react";

/**
 * UserListItem Component - Reusable user/contact list item
 * 
 * @param {object} user - User object with _id, fullName, profilePic
 * @param {boolean} isSelected - Whether this item is currently selected
 * @param {boolean} isOnline - Whether user is online
 * @param {function} onClick - Click handler
 * @param {string} subtitle - Text to show below name
 * @param {React.ReactNode} badge - Optional badge element (e.g., UnreadBadge)
 * @param {boolean} showOnlineIndicator - Whether to show online/offline dot
 */
function UserListItem({
    user,
    isSelected = false,
    isOnline = false,
    onClick,
    subtitle,
    badge = null,
    showOnlineIndicator = true
}) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                ${isSelected ? "bg-slate-700/60" : "hover:bg-slate-700/40"}`}
            onClick={onClick}
        >
            {/* Avatar with online status */}
            <div className={`avatar ${showOnlineIndicator ? (isOnline ? "online" : "offline") : ""}`}>
                <div className="size-12 rounded-full">
                    <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="text-slate-200 font-medium truncate">{user.fullName}</h4>
                    {badge}
                </div>
                {subtitle && (
                    <p className="text-slate-500 text-xs truncate">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

export default React.memo(UserListItem);
