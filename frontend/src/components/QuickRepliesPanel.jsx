import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Trash2Icon, PencilIcon, MessageSquareIcon, SparklesIcon } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

/**
 * QuickRepliesPanel Component
 * 
 * Sidebar panel for managing and using quick reply templates
 */

const CATEGORIES = [
    { value: "greeting", label: "Greetings", icon: "👋" },
    { value: "closing", label: "Closing", icon: "👋" },
    { value: "response", label: "Responses", icon: "💬" },
    { value: "general", label: "General", icon: "📝" },
];

function QuickRepliesPanel({ isOpen, onClose, onSelectTemplate }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        text: "",
        category: "general",
        shortcut: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get("/templates");
            setTemplates(res.data);
        } catch (error) {
            toast.error("Failed to load templates");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formData.name.trim() || !formData.text.trim()) {
            toast.error("Name and text are required");
            return;
        }

        try {
            const res = await axiosInstance.post("/templates", formData);
            setTemplates([res.data, ...templates]);
            setFormData({ name: "", text: "", category: "general", shortcut: "" });
            setIsAdding(false);
            toast.success("Template created");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create");
        }
    };

    const handleUpdate = async (id) => {
        try {
            const res = await axiosInstance.put(`/templates/${id}`, formData);
            setTemplates(templates.map(t => t._id === id ? res.data : t));
            setEditingId(null);
            setFormData({ name: "", text: "", category: "general", shortcut: "" });
            toast.success("Template updated");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/templates/${id}`);
            setTemplates(templates.filter(t => t._id !== id));
            toast.success("Template deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleUseTemplate = async (template) => {
        // Track usage
        try {
            await axiosInstance.post(`/templates/${template._id}/use`);
        } catch (err) { /* ignore */ }

        onSelectTemplate(template.text);
        onClose();
    };

    const startEdit = (template) => {
        setEditingId(template._id);
        setFormData({
            name: template.name,
            text: template.text,
            category: template.category,
            shortcut: template.shortcut || "",
        });
        setIsAdding(false);
    };

    const filteredTemplates = selectedCategory === "all"
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold text-slate-200">Quick Replies</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Category filter */}
                <div className="flex gap-2 p-3 border-b border-slate-700 overflow-x-auto">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === "all"
                                ? "bg-cyan-500 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                    >
                        All
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === cat.value
                                    ? "bg-cyan-500 text-white"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Add/Edit Form */}
                    {(isAdding || editingId) && (
                        <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                            <input
                                type="text"
                                placeholder="Template name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-200"
                            />
                            <textarea
                                placeholder="Message text"
                                value={formData.text}
                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                rows={3}
                                className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none"
                            />
                            <div className="flex gap-2">
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="flex-1 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-1.5 text-sm text-slate-200"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="/shortcut"
                                    value={formData.shortcut}
                                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                                    className="w-24 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-1.5 text-sm text-slate-200"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                                    className="px-3 py-1 text-sm text-slate-400 hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                                    className="px-3 py-1 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                                >
                                    {editingId ? "Update" : "Add"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Templates list */}
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Loading...</div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No templates yet</p>
                        </div>
                    ) : (
                        filteredTemplates.map(template => (
                            <div
                                key={template._id}
                                className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                onClick={() => handleUseTemplate(template)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-200 text-sm">{template.name}</span>
                                            {template.shortcut && (
                                                <span className="text-xs text-cyan-400 bg-cyan-500/20 px-1.5 rounded">
                                                    {template.shortcut}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{template.text}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEdit(template); }}
                                            className="p-1 text-slate-400 hover:text-slate-200"
                                        >
                                            <PencilIcon className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(template._id); }}
                                            className="p-1 text-slate-400 hover:text-red-400"
                                        >
                                            <Trash2Icon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    {!isAdding && !editingId && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-500 flex items-center justify-center gap-2 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Template
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuickRepliesPanel;
