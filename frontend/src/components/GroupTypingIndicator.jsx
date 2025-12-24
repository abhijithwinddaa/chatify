import { memo, useMemo } from "react";

/**
 * GroupTypingIndicator Component
 * 
 * Displays an animated "typing..." indicator with names of users who are typing.
 * Shows up to 2 names, then "and X others" for more.
 * 
 * ⚡ Optimizations:
 * - React.memo: Only re-renders when typingUsers prop changes
 * - useMemo: Caches displayText calculation
 */
function GroupTypingIndicator({ typingUsers }) {
    // ⚡ useMemo: Only recalculate when typingUsers changes
    const displayText = useMemo(() => {
        const userNames = Object.values(typingUsers || {}).filter(Boolean);

        if (userNames.length === 0) return null;

        if (userNames.length === 1) {
            return `${userNames[0]} is typing`;
        } else if (userNames.length === 2) {
            return `${userNames[0]} and ${userNames[1]} are typing`;
        } else {
            return `${userNames[0]}, ${userNames[1]} and ${userNames.length - 2} more are typing`;
        }
    }, [typingUsers]);

    if (!displayText) return null;

    return (
        <div className="chat chat-start">
            <div className="chat-bubble bg-slate-800 text-slate-400 flex items-center gap-2 py-3 px-4">
                <span className="text-sm font-medium">{displayText}</span>
                <div className="flex gap-1">
                    <span
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                    />
                    <span
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                    />
                    <span
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                    />
                </div>
            </div>
        </div>
    );
}

// ⚡ React.memo: Only re-renders when typingUsers prop changes
export default memo(GroupTypingIndicator);
