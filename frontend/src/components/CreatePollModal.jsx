import { useState } from "react";
import { XIcon, PlusIcon, Trash2Icon, BarChart3Icon, ClockIcon } from "lucide-react";

/**
 * CreatePollModal Component
 * 
 * Modal for creating a new poll in a group chat
 */
function CreatePollModal({ isOpen, onClose, onSubmit, isLoading }) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [hasTimeLimit, setHasTimeLimit] = useState(false);
    const [timeLimit, setTimeLimit] = useState(24); // hours

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, ""]);
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate
        if (!question.trim()) return;
        const validOptions = options.filter(opt => opt.trim());
        if (validOptions.length < 2) return;

        const pollData = {
            question: question.trim(),
            options: validOptions,
            allowMultipleVotes: allowMultiple,
            isAnonymous,
            endsAt: hasTimeLimit ? new Date(Date.now() + timeLimit * 60 * 60 * 1000) : null,
        };

        onSubmit(pollData);
    };

    const resetForm = () => {
        setQuestion("");
        setOptions(["", ""]);
        setAllowMultiple(false);
        setIsAnonymous(false);
        setHasTimeLimit(false);
        setTimeLimit(24);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <BarChart3Icon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold text-slate-200">Create Poll</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Question */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Question
                        </label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            maxLength={300}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Options
                        </label>
                        <div className="space-y-2">
                            {options.map((opt, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        maxLength={100}
                                        className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {options.length < 10 && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="mt-2 flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add option
                            </button>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={allowMultiple}
                                onChange={(e) => setAllowMultiple(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-300">Allow multiple votes</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-300">Anonymous poll</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasTimeLimit}
                                onChange={(e) => setHasTimeLimit(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-300">Set time limit</span>
                        </label>

                        {hasTimeLimit && (
                            <div className="flex items-center gap-2 ml-7">
                                <ClockIcon className="w-4 h-4 text-slate-400" />
                                <select
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value={1}>1 hour</option>
                                    <option value={6}>6 hours</option>
                                    <option value={12}>12 hours</option>
                                    <option value={24}>24 hours</option>
                                    <option value={48}>2 days</option>
                                    <option value={168}>1 week</option>
                                </select>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !question.trim() || options.filter(o => o.trim()).length < 2}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <BarChart3Icon className="w-4 h-4" />
                                Create Poll
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreatePollModal;
