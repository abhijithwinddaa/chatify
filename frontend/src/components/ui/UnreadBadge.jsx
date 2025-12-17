import React from "react";

/**
 * UnreadBadge Component - Displays unread count badge
 * 
 * @param {number} count - Number to display
 * @param {number} max - Maximum before showing "max+"
 * @param {string} size - Size variant: "sm" | "md" | "lg"
 * @param {string} color - Color variant: "cyan" | "red"
 */
function UnreadBadge({ count, max = 99, size = "md", color = "cyan" }) {
    if (!count || count <= 0) return null;

    const sizes = {
        sm: "min-w-[16px] h-4 text-xs px-1",
        md: "min-w-[20px] h-5 text-xs px-1.5",
        lg: "min-w-[22px] h-[22px] text-sm px-2"
    };

    const colors = {
        cyan: "bg-cyan-500",
        red: "bg-red-500"
    };

    return (
        <span
            className={`${colors[color]} text-white font-bold rounded-full flex items-center justify-center ${sizes[size]}`}
        >
            {count > max ? `${max}+` : count}
        </span>
    );
}

export default React.memo(UnreadBadge);
