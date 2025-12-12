// LocalStorage cache utilities
import { CACHE_DURATION } from './constants';

const CACHE_PREFIX = 'genshin_profile_';

/**
 * Save data to cache with expiration
 */
export function saveToCache(key, data) {
    try {
        const cacheData = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_DURATION,
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Failed to save to cache:', error);
    }
}

/**
 * Get data from cache if not expired
 */
export function getFromCache(key) {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const cacheData = JSON.parse(cached);

        // Check if expired
        if (Date.now() > cacheData.expiresAt) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return cacheData.data;
    } catch (error) {
        console.warn('Failed to read from cache:', error);
        return null;
    }
}

/**
 * Clear cache for a specific key
 */
export function clearCache(key) {
    try {
        localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
        console.warn('Failed to clear cache:', error);
    }
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Failed to clear all cache:', error);
    }
}
