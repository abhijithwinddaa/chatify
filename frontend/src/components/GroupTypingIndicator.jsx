/**
 * GroupTypingIndicator Component
 * 
 * Displays an animated "typing..." indicator with names of users who are typing.
 * Shows up to 2 names, then "and X others" for more.
 */
function GroupTypingIndicator({ typingUsers }) {
    // typingUsers is an object { oderId: userName, ... }
    const userNames = Object.values(typingUsers || {}).filter(Boolean);

    if (userNames.length === 0) return null;

    // Format the display text
    let displayText = "";
    if (userNames.length === 1) {
        displayText = `${userNames[0]} is typing`;
    } else if (userNames.length === 2) {
        displayText = `${userNames[0]} and ${userNames[1]} are typing`;
    } else {
        displayText = `${userNames[0]}, ${userNames[1]} and ${userNames.length - 2} more are typing`;
    }

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

export default GroupTypingIndicator;
