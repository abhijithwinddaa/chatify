import { useState } from "react";
import { CheckIcon, ClockIcon, UserIcon, UsersIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * PollCard Component
 * 
 * Displays a poll with voting functionality
 */
function PollCard({ poll, currentUserId, onVote, onEnd, isAdmin, isLoading }) {
    const [selectedOption, setSelectedOption] = useState(null);

    const { question, options, totalVotes, isEnded, endsAt, allowMultipleVotes, isAnonymous, createdBy } = poll;

    // Check if poll has expired
    const isExpired = endsAt && new Date() > new Date(endsAt);
    const isPollClosed = isEnded || isExpired;

    // Check if current user has voted on each option
    const getUserVotes = () => {
        const votes = [];
        options.forEach((opt, idx) => {
            if (opt.votes?.includes(currentUserId)) {
                votes.push(idx);
            }
        });
        return votes;
    };

    const userVotes = getUserVotes();
    const hasVoted = userVotes.length > 0;

    const handleVote = (optionIndex) => {
        if (isPollClosed || isLoading) return;
        setSelectedOption(optionIndex);
        onVote(poll._id, optionIndex);
    };

    // Calculate percentage for each option
    const getPercentage = (voteCount) => {
        if (totalVotes === 0) return 0;
        return Math.round((voteCount / totalVotes) * 100);
    };

    return (
        <div className="bg-slate-700/50 rounded-lg p-4 min-w-[280px] max-w-[340px]">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-200">
                            {createdBy?.fullName || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400">
                            {poll.createdAt && formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                {isPollClosed && (
                    <span className="px-2 py-0.5 bg-slate-600 text-slate-300 text-xs rounded-full">
                        Ended
                    </span>
                )}
            </div>

            {/* Question */}
            <p className="text-slate-200 font-medium mb-3">{question}</p>

            {/* Options */}
            <div className="space-y-2">
                {options.map((option, index) => {
                    const voteCount = option.votes?.length || 0;
                    const percentage = getPercentage(voteCount);
                    const isSelected = userVotes.includes(index);
                    const isCurrentlyVoting = selectedOption === index && isLoading;

                    return (
                        <button
                            key={index}
                            onClick={() => handleVote(index)}
                            disabled={isPollClosed || isLoading}
                            className={`w-full relative overflow-hidden rounded-lg border transition-all ${isSelected
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-slate-600 hover:border-slate-500"
                                } ${isPollClosed ? "cursor-default" : "cursor-pointer"}`}
                        >
                            {/* Progress bar background */}
                            {(hasVoted || isPollClosed) && (
                                <div
                                    className={`absolute inset-0 ${isSelected ? "bg-cyan-500/20" : "bg-slate-600/30"}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}

                            {/* Content */}
                            <div className="relative flex items-center justify-between p-3">
                                <div className="flex items-center gap-2">
                                    {isSelected && (
                                        <CheckIcon className="w-4 h-4 text-cyan-400" />
                                    )}
                                    {isCurrentlyVoting && (
                                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span className={`text-sm ${isSelected ? "text-cyan-300" : "text-slate-300"}`}>
                                        {option.text}
                                    </span>
                                </div>
                                {(hasVoted || isPollClosed) && (
                                    <span className="text-sm text-slate-400 font-medium">
                                        {percentage}%
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </span>
                    {allowMultipleVotes && (
                        <span className="text-cyan-400">Multiple</span>
                    )}
                    {isAnonymous && (
                        <span className="text-purple-400">Anonymous</span>
                    )}
                </div>

                {endsAt && !isPollClosed && (
                    <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDistanceToNow(new Date(endsAt), { addSuffix: true })}
                    </span>
                )}
            </div>

            {/* End Poll Button (for creator/admin) */}
            {!isPollClosed && (isAdmin || createdBy?._id === currentUserId) && (
                <button
                    onClick={() => onEnd(poll._id)}
                    disabled={isLoading}
                    className="mt-3 w-full py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    End Poll
                </button>
            )}
        </div>
    );
}

export default PollCard;
