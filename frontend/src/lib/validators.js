/**
 * Validation Utilities
 * 
 * Centralized regex patterns and validation functions for the application.
 * Used with debouncing for real-time form validation.
 */

// ==================== REGEX PATTERNS ====================

export const REGEX = {
    // Email: standard email format
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Name: 2-50 characters, letters and spaces only
    FULL_NAME: /^[a-zA-Z\s]{2,50}$/,

    // Password: at least 6 chars, 1 uppercase, 1 lowercase, 1 number
    PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,

    // Password: minimum 6 characters (basic)
    PASSWORD_BASIC: /^.{6,}$/,

    // Group name: 3-100 characters, letters, numbers, spaces, underscores
    GROUP_NAME: /^[\w\s]{3,100}$/,

    // Phone: Indian mobile numbers (10 digits starting with 6-9)
    PHONE_INDIA: /^[6-9]\d{9}$/,

    // URL: basic URL pattern
    URL: /^https?:\/\/.+/,

    // No special characters (only letters, numbers, spaces)
    ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate email format
 * @param {string} email 
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEmail(email) {
    if (!email || email.trim() === "") {
        return { isValid: false, error: "" }; // Empty = no error shown
    }
    if (!REGEX.EMAIL.test(email)) {
        return { isValid: false, error: "Please enter a valid email address" };
    }
    return { isValid: true, error: "" };
}

/**
 * Validate full name
 * @param {string} name 
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateFullName(name) {
    if (!name || name.trim() === "") {
        return { isValid: false, error: "" }; // Empty = no error shown
    }
    if (name.trim().length < 2) {
        return { isValid: false, error: "Name must be at least 2 characters" };
    }
    if (name.length > 50) {
        return { isValid: false, error: "Name must be less than 50 characters" };
    }
    if (!REGEX.FULL_NAME.test(name)) {
        return { isValid: false, error: "Name can only contain letters and spaces" };
    }
    return { isValid: true, error: "" };
}

/**
 * Validate password with strength checking
 * @param {string} password 
 * @returns {{ isValid: boolean, error: string, strength: 'weak' | 'medium' | 'strong' }}
 */
export function validatePassword(password) {
    if (!password || password === "") {
        return { isValid: false, error: "", strength: "weak" };
    }

    // Check minimum length first
    if (password.length < 6) {
        return {
            isValid: false,
            error: "Password must be at least 6 characters",
            strength: "weak"
        };
    }

    // Check for strong password requirements
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Count how many criteria are met
    const criteriaMet = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

    if (criteriaMet <= 1) {
        return {
            isValid: true, // Basic password is valid
            error: "Add uppercase, numbers, or symbols for stronger password",
            strength: "weak"
        };
    }

    if (criteriaMet === 2) {
        return {
            isValid: true,
            error: "",
            strength: "medium"
        };
    }

    return {
        isValid: true,
        error: "",
        strength: "strong"
    };
}

/**
 * Validate group name
 * @param {string} name 
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateGroupName(name) {
    if (!name || name.trim() === "") {
        return { isValid: false, error: "" };
    }
    if (name.trim().length < 3) {
        return { isValid: false, error: "Group name must be at least 3 characters" };
    }
    if (name.length > 100) {
        return { isValid: false, error: "Group name must be less than 100 characters" };
    }
    return { isValid: true, error: "" };
}

/**
 * Get password strength color for UI
 * @param {'weak' | 'medium' | 'strong'} strength 
 * @returns {string} - Tailwind color class
 */
export function getPasswordStrengthColor(strength) {
    switch (strength) {
        case "weak":
            return "text-red-400";
        case "medium":
            return "text-yellow-400";
        case "strong":
            return "text-green-400";
        default:
            return "text-slate-400";
    }
}

/**
 * Get password strength bar width
 * @param {'weak' | 'medium' | 'strong'} strength 
 * @returns {string} - Width percentage
 */
export function getPasswordStrengthWidth(strength) {
    switch (strength) {
        case "weak":
            return "33%";
        case "medium":
            return "66%";
        case "strong":
            return "100%";
        default:
            return "0%";
    }
}

/**
 * Get password strength background color
 * @param {'weak' | 'medium' | 'strong'} strength 
 * @returns {string} - Tailwind background class
 */
export function getPasswordStrengthBg(strength) {
    switch (strength) {
        case "weak":
            return "bg-red-500";
        case "medium":
            return "bg-yellow-500";
        case "strong":
            return "bg-green-500";
        default:
            return "bg-slate-600";
    }
}
