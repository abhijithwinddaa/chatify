import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Delays updating a value until after a specified delay has passed
 * since the last change. Useful for reducing API calls and improving
 * performance when handling user input.
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} - The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup: Cancel the timer if value changes before delay completes
        // This is the key to debouncing - each new keystroke resets the timer
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 * 
 * Returns a debounced version of a callback function.
 * The callback will only execute after the specified delay
 * has passed since the last invocation.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} - The debounced callback
 * 
 * @example
 * const debouncedSave = useDebouncedCallback((text) => {
 *   saveToServer(text);
 * }, 500);
 * 
 * <input onChange={(e) => debouncedSave(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 300) {
    const [timeoutId, setTimeoutId] = useState(null);

    const debouncedFn = (...args) => {
        // Clear any existing timer
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set a new timer
        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return debouncedFn;
}

export default useDebounce;
