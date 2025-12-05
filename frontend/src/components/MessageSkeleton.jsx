
function MessageSkeleton() {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className={`chat ${item % 2 === 0 ? "chat-start" : "chat-end"}`}>
                    <div className="chat-image avatar">
                        <div className="size-10 rounded-full">
                            <div className="skeleton w-full h-full rounded-full bg-slate-800/50"></div>
                        </div>
                    </div>
                    <div className="chat-header mb-1">
                        <div className="skeleton w-16 h-4 bg-slate-800/50 rounded-lg"></div>
                    </div>
                    <div className="chat-bubble bg-transparent p-0">
                        <div className="skeleton h-16 w-[200px] bg-slate-800/50 rounded-lg"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MessageSkeleton;
