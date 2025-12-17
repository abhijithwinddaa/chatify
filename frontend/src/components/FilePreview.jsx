import { FileTextIcon, FileSpreadsheetIcon, FileIcon, ImageIcon, DownloadIcon, XIcon } from "lucide-react";

/**
 * FilePreview Component
 * 
 * Displays file attachments with:
 * - File type icon
 * - File name
 * - File size
 * - Download button
 */

// Get icon based on file type
const getFileIcon = (fileType) => {
    if (!fileType) return FileIcon;

    if (fileType.includes("pdf")) return FileTextIcon;
    if (fileType.includes("word") || fileType.includes("document")) return FileTextIcon;
    if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv")) return FileSpreadsheetIcon;
    if (fileType.includes("image")) return ImageIcon;

    return FileIcon;
};

// Format file size
const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Get file extension for display
const getFileExtension = (fileName, fileType) => {
    if (fileName) {
        const ext = fileName.split(".").pop();
        if (ext) return ext.toUpperCase();
    }
    if (fileType) {
        if (fileType.includes("pdf")) return "PDF";
        if (fileType.includes("word")) return "DOC";
        if (fileType.includes("sheet") || fileType.includes("excel")) return "XLS";
        if (fileType.includes("zip")) return "ZIP";
    }
    return "FILE";
};

function FilePreview({ fileUrl, fileName, fileType, fileSize, onRemove, isPreview = false }) {
    const Icon = getFileIcon(fileType);
    const extension = getFileExtension(fileName, fileType);

    const handleDownload = () => {
        if (fileUrl) {
            window.open(fileUrl, "_blank");
        }
    };

    return (
        <div className={`flex items-center gap-3 bg-slate-700/50 rounded-lg p-3 ${isPreview ? "max-w-xs" : "min-w-[200px] max-w-[280px]"}`}>
            {/* File type icon with extension badge */}
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="absolute -bottom-1 -right-1 px-1 text-[10px] font-bold bg-cyan-500 text-white rounded">
                    {extension}
                </span>
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">
                    {fileName || "Document"}
                </p>
                <p className="text-xs text-slate-400">
                    {formatFileSize(fileSize)}
                </p>
            </div>

            {/* Action button */}
            {isPreview ? (
                <button
                    onClick={onRemove}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Remove file"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            ) : (
                <button
                    onClick={handleDownload}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Download file"
                >
                    <DownloadIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default FilePreview;
