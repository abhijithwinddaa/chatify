import React from "react";

/**
 * EmptyState Component - Reusable empty state placeholder
 * 
 * @param {React.Component} icon - Lucide icon component
 * @param {string} title - Main heading
 * @param {string} description - Supporting text
 * @param {React.ReactNode} action - Optional action button/element
 */
function EmptyState({ icon: Icon, title, description, action = null }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {Icon && <Icon className="w-16 h-16 text-slate-500 mb-4" />}
            {title && <h3 className="text-slate-300 font-medium mb-2">{title}</h3>}
            {description && <p className="text-slate-500 text-sm">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export default React.memo(EmptyState);
