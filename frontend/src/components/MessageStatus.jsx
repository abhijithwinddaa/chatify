import { memo } from "react";
import { CheckIcon, CheckCheckIcon } from "lucide-react";

/**
 * MessageStatus Component
 * 
 * Displays message delivery status with WhatsApp-like tick indicators:
 * - Single gray tick (✓) = Sent
 * - Double gray ticks (✓✓) = Delivered
 * - Double blue ticks (✓✓) = Read
 * 
 * ⚡ Optimizations:
 * - React.memo: Only re-renders when status prop changes
 * 
 * @param {Object} props
 * @param {string} props.status - Message status: "sent" | "delivered" | "read"
 */
function MessageStatus({ status }) {
    // Status styling based on message state
    const statusConfig = {
        sent: {
            icon: <CheckIcon className="w-4 h-4" />,
            color: "text-slate-400",
        },
        delivered: {
            icon: <CheckCheckIcon className="w-4 h-4" />,
            color: "text-slate-400",
        },
        read: {
            icon: <CheckCheckIcon className="w-4 h-4" />,
            color: "text-cyan-400",
        },
    };

    const config = statusConfig[status] || statusConfig.sent;

    return (
        <span className={`inline-flex items-center ${config.color}`}>
            {config.icon}
        </span>
    );
}

// ⚡ React.memo: Only re-renders when status changes
export default memo(MessageStatus);
