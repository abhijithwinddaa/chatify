import { useEffect, useRef } from "react";
import { XIcon } from "lucide-react";

/**
 * ConfirmDialog - Custom styled confirmation dialog
 * 
 * Replaces the browser's native confirm() with a styled modal
 */
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Yes", cancelText = "No", danger = false }) {
    const dialogRef = useRef(null);

    // Focus trap and ESC key handling
    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.focus();
        }

        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="bg-slate-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-200">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Message */}
                <p className="text-slate-300 mb-6">{message}</p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-lg transition-colors font-medium ${danger
                                ? "bg-red-600 text-white hover:bg-red-500"
                                : "bg-cyan-600 text-white hover:bg-cyan-500"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
