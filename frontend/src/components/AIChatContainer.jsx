import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, Bot, User, Search, FileText, Code, HelpCircle, ArrowLeft } from "lucide-react";
import { useAIStore } from "../store/useAIStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

/**
 * Dedicated AI Chat Container - Shows when Chatify AI is selected as a contact
 * Full chat experience with the AI
 */
const AIChatContainer = () => {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { messages, isLoading, askAI, clearConversation } = useAIStore();
    const { authUser } = useAuthStore();
    const { setSelectedUser } = useChatStore();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const question = input.trim();
        setInput("");

        try {
            await askAI(question, authUser._id, null, null);
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
        { icon: FileText, label: "Summarize", prompt: "@summarizer Summarize my recent chats" },
        { icon: Search, label: "Find", prompt: "@finder " },
        { icon: Code, label: "Code Help", prompt: "@coder " },
        { icon: HelpCircle, label: "Help", prompt: "@helper " }
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-base-300 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Chatify AI</h3>
                        <p className="text-xs text-base-content/60">
                            Your intelligent chat assistant
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearConversation}
                        className="btn btn-ghost btn-sm gap-1"
                        title="Clear conversation"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Bot className="w-10 h-10 text-primary" />
                        </div>
                        <h4 className="font-semibold text-lg mb-2">Welcome to Chatify AI!</h4>
                        <p className="text-base-content/60 mb-6 max-w-sm mx-auto">
                            I can search your conversations, summarize chats, find information, and help with code.
                        </p>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(action.prompt)}
                                    className="btn btn-sm btn-outline gap-2"
                                >
                                    <action.icon className="w-4 h-4" />
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        {/* Example Questions */}
                        <div className="text-left max-w-md mx-auto bg-base-200/50 rounded-lg p-4">
                            <p className="text-sm font-medium text-base-content/70 mb-3">Try asking:</p>
                            <ul className="text-sm text-base-content/60 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    "Summarize my chat with John from today"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    "When did we discuss the project deadline?"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    "@finder budget meeting notes"
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    "What's the latest news about AI?"
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
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
                            <div className={`p-4 rounded-2xl ${msg.role === "user"
                                    ? "bg-primary text-primary-content rounded-tr-sm"
                                    : "bg-base-200 rounded-tl-sm"
                                } ${msg.isError ? "border border-error/30" : ""}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                {/* Persona Badge */}
                                {msg.persona && msg.persona !== "Chatify AI" && (
                                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-secondary/20 text-secondary">
                                        {msg.persona}
                                    </span>
                                )}

                                {/* Sources */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-base-content/10">
                                        <p className="text-xs font-medium mb-1 opacity-60">Sources:</p>
                                        {msg.sources.slice(0, 3).map((s, i) => (
                                            <p key={i} className="text-xs opacity-50 truncate">
                                                • {s.text?.slice(0, 60)}...
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
                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-base-200 p-4 rounded-2xl rounded-tl-sm">
                                <div className="flex gap-1.5">
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
            <div className="p-4 border-t border-base-300 bg-base-100/50">
                <div className="flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your chats, search messages, or get help..."
                        className="input input-bordered flex-1 focus:input-primary"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="btn btn-primary px-6"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-xs text-center mt-2 text-base-content/40">
                    Commands: @summarizer • @finder • @helper • @coder
                </p>
            </div>
        </div>
    );
};

export default AIChatContainer;
