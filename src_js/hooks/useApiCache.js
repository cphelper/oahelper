import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing API requests with caching and deduplication
 * @param {number} cacheDuration - Cache duration in milliseconds
 * @param {string} storageType - 'session' or 'local'
 */
export const useApiCache = (cacheDuration = 5 * 60 * 1000, storageType = 'session') => {
    const pendingRequests = useRef(new Map());
    const storage = storageType === 'session' ? sessionStorage : localStorage;

    /**
     * Fetch data with caching and deduplication
     * @param {string} cacheKey - Unique key for caching
     * @param {Function} fetchFn - Async function that returns data
     * @param {number} timeout - Request timeout in milliseconds
     */
    const fetchWithCache = useCallback(async (cacheKey, fetchFn, timeout = 10000) => {
        // Check cache first
        const cached = storage.getItem(cacheKey);
        const cacheTime = storage.getItem(`${cacheKey}_time`);
        
        if (cached && cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < cacheDuration) {
                try {
                    return JSON.parse(cached);
                } catch (error) {
                    console.error('Cache parse error:', error);
                    // Clear invalid cache
                    storage.removeItem(cacheKey);
                    storage.removeItem(`${cacheKey}_time`);
                }
            }
        }

        // Check for pending request
        if (pendingRequests.current.has(cacheKey)) {
            return pendingRequests.current.get(cacheKey);
        }

        // Create new request with timeout
        const requestPromise = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const result = await fetchFn(controller.signal);
                clearTimeout(timeoutId);

                // Cache the result
                storage.setItem(cacheKey, JSON.stringify(result));
                storage.setItem(`${cacheKey}_time`, Date.now().toString());

                return result;
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            } finally {
                pendingRequests.current.delete(cacheKey);
            }
        })();

        pendingRequests.current.set(cacheKey, requestPromise);
        return requestPromise;
    }, [cacheDuration, storage]);

    /**
     * Clear cache for a specific key or all cache
     * @param {string} cacheKey - Optional key to clear, clears all if not provided
     */
    const clearCache = useCallback((cacheKey = null) => {
        if (cacheKey) {
            storage.removeItem(cacheKey);
            storage.removeItem(`${cacheKey}_time`);
        } else {
            // Clear all cache entries
            const keys = Object.keys(storage);
            keys.forEach(key => {
                if (key.endsWith('_time') || !key.includes('_time')) {
                    storage.removeItem(key);
                }
            });
        }
    }, [storage]);

    /**
     * Check if cache exists and is valid
     * @param {string} cacheKey - Cache key to check
     */
    const isCacheValid = useCallback((cacheKey) => {
        const cached = storage.getItem(cacheKey);
        const cacheTime = storage.getItem(`${cacheKey}_time`);
        
        if (!cached || !cacheTime) return false;
        
        const age = Date.now() - parseInt(cacheTime);
        return age < cacheDuration;
    }, [cacheDuration, storage]);

    return {
        fetchWithCache,
        clearCache,
        isCacheValid
    };
};

export default useApiCache;
