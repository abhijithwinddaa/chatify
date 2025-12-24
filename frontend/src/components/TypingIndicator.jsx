import { memo } from "react";

/**
 * TypingIndicator Component
 * 
 * Displays an animated "typing..." indicator with three bouncing dots.
 * Shown when the other user is typing a message.
 * 
 * ⚡ Optimizations:
 * - React.memo: Component never changes, so memo prevents any re-renders
 */
function TypingIndicator() {
    return (
        <div className="chat chat-start">
            <div className="chat-bubble bg-slate-800 text-slate-400 flex items-center gap-1 py-3 px-4">
                <span className="text-sm">typing</span>
                <div className="flex gap-1">
                    <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                    />
                    <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                    />
                    <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                    />
                </div>
            </div>
        </div>
    );
}

// ⚡ React.memo: Pure component, never needs to re-render
export default memo(TypingIndicator);
