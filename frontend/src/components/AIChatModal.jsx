import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Trash2, Bot, User, Search, FileText, Code, HelpCircle } from "lucide-react";
import { useAIStore } from "../store/useAIStore";
import { useAuthStore } from "../store/useAuthStore";

const AIChatModal = ({ isOpen, onClose, conversationType = null, targetId = null, targetName = null }) => {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { messages, isLoading, askAI, clearConversation } = useAIStore();
    const { authUser } = useAuthStore();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const question = input.trim();
        setInput("");

        try {
            await askAI(question, authUser._id, conversationType, targetId);
        } catch (error) {
            console.error("AI error:", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickActions = [
        { icon: FileText, label: "Summarize", prompt: "@summarizer Summarize this chat" },
        { icon: Search, label: "Find", prompt: "@finder " },
        { icon: Code, label: "Code", prompt: "@coder " },
        { icon: HelpCircle, label: "Help", prompt: "@helper " }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-base-200 rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl border border-base-300">
                {/* Header */}
                <div className="p-4 border-b border-base-300 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Chatify AI</h3>
                            <p className="text-xs text-base-content/60">
                                {targetName ? `Searching in: ${targetName}` : "Ask about your chats"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearConversation}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Clear conversation"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <Bot className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                            <h4 className="font-medium mb-2">Ask me anything about your chats!</h4>
                            <p className="text-sm text-base-content/60 mb-4">
                                I can search, summarize, and find information in your conversations.
                            </p>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(action.prompt)}
                                        className="btn btn-sm btn-outline gap-1"
                                    >
                                        <action.icon className="w-3 h-3" />
                                        {action.label}
                                    </button>
                                ))}
                            </div>

                            {/* Example Questions */}
                            <div className="mt-6 text-left max-w-xs mx-auto">
                                <p className="text-xs font-medium text-base-content/60 mb-2">Try asking:</p>
                                <ul className="text-xs text-base-content/50 space-y-1">
                                    <li>• "Summarize my chat with John"</li>
                                    <li>• "When did we discuss the deadline?"</li>
                                    <li>• "@finder budget meeting"</li>
                                    <li>• "What's the latest news about AI?"</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user"
                                        ? "bg-primary"
                                        : "bg-gradient-to-r from-primary to-secondary"
                                    }`}>
                                    {msg.role === "user"
                                        ? <User className="w-4 h-4 text-white" />
                                        : <Bot className="w-4 h-4 text-white" />
                                    }
                                </div>

                                {/* Message */}
                                <div className={`p-3 rounded-2xl ${msg.role === "user"
                                        ? "bg-primary text-primary-content rounded-tr-sm"
                                        : "bg-base-300 rounded-tl-sm"
                                    } ${msg.isError ? "border border-error/30" : ""}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                                    {/* Persona Badge */}
                                    {msg.persona && msg.persona !== "Chatify AI" && (
                                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-secondary/20 text-secondary">
                                            {msg.persona}
                                        </span>
                                    )}

                                    {/* Sources */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-base-content/10">
                                            <p className="text-xs font-medium mb-1 opacity-60">Sources:</p>
                                            {msg.sources.slice(0, 3).map((s, i) => (
                                                <p key={i} className="text-xs opacity-50 truncate">
                                                    • {s.text?.slice(0, 50)}...
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-2 items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-base-300 p-3 rounded-2xl rounded-tl-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-base-300">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your chats..."
                            className="input input-bordered flex-1 focus:input-primary"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="btn btn-primary btn-circle"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-center mt-2 text-base-content/40">
                        Use @summarizer, @finder, @coder, @helper for specific modes
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;
