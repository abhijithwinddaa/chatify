import React from "react";

/**
 * Avatar Component - Reusable avatar with optional online status indicator
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} size - Size variant: "sm" | "md" | "lg"
 * @param {boolean} isOnline - Whether user is online
 * @param {boolean} showStatus - Whether to show online/offline indicator
 */
function Avatar({ src, alt = "User", size = "md", isOnline = false, showStatus = true }) {
    const sizes = {
        sm: "size-8",
        md: "size-12",
        lg: "size-16"
    };

    return (
        <div className={`avatar ${showStatus ? (isOnline ? "online" : "offline") : ""}`}>
            <div className={`${sizes[size]} rounded-full`}>
                <img
                    src={src || "/avatar.png"}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                />
            </div>
        </div>
    );
}

export default React.memo(Avatar);
