import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import {
    ImageIcon, SendIcon, XIcon, SmileIcon, ReplyIcon, MicIcon,
    VideoIcon, PaperclipIcon, MapPinIcon, ClockIcon, PlusIcon, ZapIcon, LanguagesIcon, Loader2Icon
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import VoiceRecorder from "./VoiceRecorder";
import VideoRecorder from "./VideoRecorder";
import LocationPicker from "./LocationPicker";
import FilePreview from "./FilePreview";
import QuickRepliesPanel from "./QuickRepliesPanel";
import { useDebounce } from "../hooks/useDebounce";
import { axiosInstance } from "../lib/axios";
import imageCompression from "browser-image-compression";  // ⚡ Image compression


// Typing timeout reference (outside component to persist across renders)
let typingTimeoutRef = null;

// Disappearing message options (in minutes)
const DISAPPEAR_OPTIONS = [
    { label: "5 minutes", value: 5 },
    { label: "15 minutes", value: 15 },
    { label: "1 hour", value: 60 },
    { label: "6 hours", value: 360 },
    { label: "24 hours", value: 1440 },
];

function MessageInput() {
    const { playRandomKeyStrokeSound } = useKeyboardSound();
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showDisappearOptions, setShowDisappearOptions] = useState(false);
    const [disappearAfter, setDisappearAfter] = useState(null);
    const [fileAttachment, setFileAttachment] = useState(null);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);  // ⚡ Compression state

    const fileInputRef = useRef(null);
    const documentInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const attachMenuRef = useRef(null);
    const inputRef = useRef(null);

    const { sendMessage, isSoundEnabled, selectedUser, emitTyping, emitStopTyping, replyingTo, clearReplyingTo } = useChatStore();

    // Debounce text for template shortcut detection
    const debouncedText = useDebounce(text, 300);
    const [templateSuggestion, setTemplateSuggestion] = useState(null);

    // Detect template shortcut (e.g., /hello) and show suggestion
    useEffect(() => {
        const detectShortcut = async () => {
            // Check if text starts with / and has at least 2 characters
            if (debouncedText.startsWith("/") && debouncedText.length >= 2) {
                const shortcut = debouncedText.trim();
                try {
                    const res = await axiosInstance.get("/templates");
                    const template = res.data.find(t => t.shortcut?.toLowerCase() === shortcut.toLowerCase());
                    if (template) {
                        setTemplateSuggestion(template);
                    } else {
                        setTemplateSuggestion(null);
                    }
                } catch {
                    setTemplateSuggestion(null);
                }
            } else {
                setTemplateSuggestion(null);
            }
        };
        detectShortcut();
    }, [debouncedText]);

    // Close pickers when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when replying
    useEffect(() => {
        if (replyingTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyingTo]);

    const handleTyping = () => {
        if (!selectedUser) return;
        emitTyping(selectedUser._id);
        if (typingTimeoutRef) clearTimeout(typingTimeoutRef);
        typingTimeoutRef = setTimeout(() => {
            emitStopTyping(selectedUser._id);
        }, 2000);
    };

    const resetForm = () => {
        setText("");
        setImagePreview(null);
        setFileAttachment(null);
        setShowEmojiPicker(false);
        setDisappearAfter(null);
        clearReplyingTo();
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (documentInputRef.current) documentInputRef.current.value = "";
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview && !fileAttachment) return;
        if (isSoundEnabled) playRandomKeyStrokeSound();

        if (typingTimeoutRef) clearTimeout(typingTimeoutRef);
        emitStopTyping(selectedUser._id);

        sendMessage({
            text: text.trim(),
            image: imagePreview,
            file: fileAttachment?.data,
            fileName: fileAttachment?.name,
            fileType: fileAttachment?.type,
            fileSize: fileAttachment?.size,
            replyTo: replyingTo?._id,
            disappearAfter: disappearAfter,
        });
        resetForm();
    };

    const handleVoiceSend = (audioBase64, duration) => {
        sendMessage({
            audio: audioBase64,
            audioDuration: duration,
            replyTo: replyingTo?._id,
            disappearAfter: disappearAfter,
        });
        resetForm();
        setShowVoiceRecorder(false);
    };

    const handleVideoSend = (videoBase64, duration) => {
        sendMessage({
            video: videoBase64,
            videoDuration: duration,
            replyTo: replyingTo?._id,
            disappearAfter: disappearAfter,
        });
        resetForm();
        setShowVideoRecorder(false);
    };

    const handleLocationSend = (location) => {
        sendMessage({
            location: location,
            replyTo: replyingTo?._id,
            disappearAfter: disappearAfter,
        });
        resetForm();
        setShowLocationPicker(false);
    };

    // ⚡ Image compression before upload - reduces file size by 50-90%
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file?.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        setIsCompressing(true);
        setShowAttachMenu(false);

        try {
            // Compression options
            const options = {
                maxSizeMB: 0.5,           // Max 500KB
                maxWidthOrHeight: 1920,   // Max dimensions
                useWebWorker: true,       // Use Web Worker (non-blocking)
                fileType: "image/jpeg",   // Convert to JPEG for better compression
            };

            const originalSize = file.size / 1024; // KB

            // Only compress if file is larger than 500KB
            let processedFile = file;
            if (file.size > 500 * 1024) {
                processedFile = await imageCompression(file, options);
                const compressedSize = processedFile.size / 1024; // KB
                console.log(`⚡ Image compressed: ${originalSize.toFixed(0)}KB → ${compressedSize.toFixed(0)}KB (${((1 - compressedSize / originalSize) * 100).toFixed(0)}% reduction)`);
            }

            // Convert to base64 for preview and upload
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(processedFile);
        } catch (error) {
            console.error("Compression failed:", error);
            toast.error("Failed to process image");
        } finally {
            setIsCompressing(false);
        }
    };

    const handleDocumentChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFileAttachment({
                data: reader.result,
                name: file.name,
                type: file.type,
                size: file.size,
            });
        };
        reader.readAsDataURL(file);
        setShowAttachMenu(false);
    };

    const handleEmojiClick = (emojiData) => {
        setText(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const getReplyPreviewText = () => {
        if (replyingTo?.text) return replyingTo.text;
        if (replyingTo?.audio) return "🎤 Voice message";
        if (replyingTo?.video) return "🎥 Video message";
        if (replyingTo?.image) return "📷 Image";
        if (replyingTo?.file) return "📎 " + (replyingTo.fileName || "File");
        if (replyingTo?.location) return "📍 Location";
        return "Message";
    };

    // Show special recorders/pickers
    if (showVoiceRecorder) {
        return (
            <div className="p-4 border-t border-slate-700/50">
                <div className="max-w-3xl mx-auto">
                    <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoiceRecorder(false)} />
                </div>
            </div>
        );
    }

    if (showVideoRecorder) {
        return (
            <div className="p-4 border-t border-slate-700/50">
                <div className="max-w-3xl mx-auto">
                    <VideoRecorder onSend={handleVideoSend} onCancel={() => setShowVideoRecorder(false)} />
                </div>
            </div>
        );
    }

    if (showLocationPicker) {
        return (
            <div className="p-4 border-t border-slate-700/50">
                <div className="max-w-3xl mx-auto">
                    <LocationPicker onSend={handleLocationSend} onCancel={() => setShowLocationPicker(false)} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-t border-slate-700/50">
            {/* Reply preview */}
            {replyingTo && (
                <div className="max-w-3xl mx-auto mb-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 flex items-start gap-3 border-l-2 border-cyan-500">
                        <ReplyIcon className="w-5 h-5 text-cyan-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-cyan-400 mb-1">Replying to message</p>
                            <p className="text-sm text-slate-300 truncate">{getReplyPreviewText()}</p>
                        </div>
                        <button onClick={clearReplyingTo} className="text-slate-400 hover:text-slate-200 transition-colors">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Template shortcut suggestion */}
            {templateSuggestion && (
                <div className="max-w-3xl mx-auto mb-3">
                    <div className="bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 rounded-lg p-3 border border-cyan-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ZapIcon className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs text-cyan-400">Template found: <span className="font-medium">{templateSuggestion.name}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setText(templateSuggestion.text);
                                        setTemplateSuggestion(null);
                                        inputRef.current?.focus();
                                    }}
                                    className="px-3 py-1 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                >
                                    Use Template
                                </button>
                                <button
                                    onClick={() => setTemplateSuggestion(null)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">{templateSuggestion.text}</p>
                    </div>
                </div>
            )}

            {/* Disappearing message indicator */}
            {disappearAfter && (
                <div className="max-w-3xl mx-auto mb-3">
                    <div className="bg-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-300">
                            Message will disappear after {DISAPPEAR_OPTIONS.find(o => o.value === disappearAfter)?.label}
                        </span>
                        <button onClick={() => setDisappearAfter(null)} className="ml-auto text-amber-400 hover:text-amber-200">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Image preview */}
            {imagePreview && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center">
                    <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                        <button
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* File preview */}
            {fileAttachment && (
                <div className="max-w-3xl mx-auto mb-3">
                    <FilePreview
                        fileUrl={null}
                        fileName={fileAttachment.name}
                        fileType={fileAttachment.type}
                        fileSize={fileAttachment.size}
                        onRemove={() => setFileAttachment(null)}
                        isPreview={true}
                    />
                </div>
            )}

            {/* Main input form */}
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-2 relative">
                {/* Attachment Menu */}
                <div className="relative" ref={attachMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-3 py-2 transition-colors ${showAttachMenu ? "text-cyan-500" : ""}`}
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 bg-slate-800 border border-slate-700 rounded-lg p-2 min-w-[160px] shadow-xl z-50">
                            <button
                                type="button"
                                onClick={() => { fileInputRef.current?.click(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ImageIcon className="w-4 h-4 text-green-400" />
                                <span className="text-sm">Image</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowVideoRecorder(true); setShowAttachMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <VideoIcon className="w-4 h-4 text-purple-400" />
                                <span className="text-sm">Video</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { documentInputRef.current?.click(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <PaperclipIcon className="w-4 h-4 text-blue-400" />
                                <span className="text-sm">Document</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowLocationPicker(true); setShowAttachMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <MapPinIcon className="w-4 h-4 text-red-400" />
                                <span className="text-sm">Location</span>
                            </button>
                            <hr className="my-2 border-slate-700" />
                            <div className="px-3 py-1">
                                <p className="text-xs text-slate-500 mb-2">Disappearing</p>
                                {DISAPPEAR_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => { setDisappearAfter(opt.value); setShowAttachMenu(false); }}
                                        className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${disappearAfter === opt.value ? "bg-cyan-600 text-white" : "text-slate-400 hover:bg-slate-700"}`}
                                    >
                                        <ClockIcon className="w-3 h-3 inline mr-1" />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Emoji Picker */}
                <div className="relative" ref={emojiPickerRef}>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-3 py-2 transition-colors ${showEmojiPicker ? "text-cyan-500" : ""}`}
                    >
                        <SmileIcon className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50">
                            <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width={300} height={350} searchPlaceholder="Search..." previewConfig={{ showPreview: false }} />
                        </div>
                    )}
                </div>

                {/* Text Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => { setText(e.target.value); isSoundEnabled && playRandomKeyStrokeSound(); handleTyping(); }}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-200"
                    placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                />

                {/* Hidden file inputs */}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" ref={documentInputRef} onChange={handleDocumentChange} className="hidden" />

                {/* Quick Replies Button */}
                <button
                    type="button"
                    onClick={() => setShowQuickReplies(true)}
                    className="bg-slate-800/50 text-slate-400 hover:text-yellow-400 rounded-lg px-3 transition-colors"
                    title="Quick replies"
                >
                    <ZapIcon className="w-5 h-5" />
                </button>

                {/* Voice Message Button */}
                <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    className="bg-slate-800/50 text-slate-400 hover:text-red-400 rounded-lg px-3 transition-colors"
                    title="Voice message"
                >
                    <MicIcon className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={!text.trim() && !imagePreview && !fileAttachment}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>

            {/* Quick Replies Panel */}
            <QuickRepliesPanel
                isOpen={showQuickReplies}
                onClose={() => setShowQuickReplies(false)}
                onSelectTemplate={(templateText) => {
                    setText(templateText);
                    inputRef.current?.focus();
                }}
            />
        </div>
    );
}

export default MessageInput;
