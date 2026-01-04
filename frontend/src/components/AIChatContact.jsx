import { Sparkles } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

/**
 * Chatify AI Chat Contact - Appears at the top of the chats list
 * Clicking this opens a dedicated AI chat experience
 */
const AIChatContact = ({ onSelect }) => {
    const { selectedUser, setSelectedUser } = useChatStore();

    // Special AI "user" object
    const aiUser = {
        _id: "chatify-ai",
        fullName: "Chatify AI",
        profilePic: null,
        isAI: true
    };

    const isSelected = selectedUser?._id === "chatify-ai";

    const handleClick = () => {
        setSelectedUser(aiUser);
        if (onSelect) onSelect();
    };

    return (
        <div
            onClick={handleClick}
            className={`
                flex items-center gap-3 p-3 cursor-pointer transition-all
                border-b border-base-300/30
                ${isSelected
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20"
                    : "hover:bg-base-300/30"
                }
            `}
        >
            {/* AI Avatar */}
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base-content">Chatify AI</h3>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
                        AI
                    </span>
                </div>
                <p className="text-sm text-base-content/60 truncate">
                    Ask me about your chats
                </p>
            </div>
        </div>
    );
};

export default AIChatContact;
