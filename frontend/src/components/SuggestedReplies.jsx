import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";

const SuggestedReplies = ({ messages, onSelect }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const { authUser } = useAuthStore();

    // Fetch suggestions when messages change
    useEffect(() => {
        const lastMessage = messages?.[messages.length - 1];

        // Only suggest if last message is from the other person
        if (lastMessage && lastMessage.senderId !== authUser._id && lastMessage.text) {
            fetchSuggestions();
        } else {
            setSuggestions([]);
            setIsVisible(false);
        }
    }, [messages]);

    const fetchSuggestions = async () => {
        if (!messages || messages.length === 0) return;

        setIsLoading(true);
        try {
            const recentMessages = messages.slice(-5).map(m => ({
                text: m.text || "",
                isOwn: m.senderId === authUser._id
            }));

            const res = await axiosInstance.post("/ai/suggested-replies", {
                userId: authUser._id,
                recentMessages
            });

            if (res.data.suggestions && res.data.suggestions.length > 0) {
                setSuggestions(res.data.suggestions);
                setIsVisible(true);
            }
        } catch (error) {
            console.error("Failed to get suggestions:", error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible || suggestions.length === 0) return null;

    return (
        <div className="px-4 py-2 border-t border-base-300/50 bg-base-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs text-base-content/60">
                    <Sparkles className="w-3 h-3" />
                    <span>Suggested replies</span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="btn btn-ghost btn-xs btn-circle"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            onSelect(suggestion);
                            setIsVisible(false);
                        }}
                        className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors border border-primary/20"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SuggestedReplies;
