/**
 * Simple in-memory cache utility for performance optimization
 * Note: For production, consider using Redis or similar distributed cache
 */

class SimpleCache {
    constructor(defaultTTL = 300000) { // 5 minutes default
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, {
            value,
            expiry
        });
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                expiredEntries++;
                this.cache.delete(key);
            } else {
                validEntries++;
            }
        }

        return {
            totalEntries: validEntries + expiredEntries,
            validEntries,
            expiredEntries,
            cacheSize: this.cache.size
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Create singleton instances for different cache types
const claimTypesCache = new SimpleCache(300000); // 5 minutes
const userInfoCache = new SimpleCache(600000);   // 10 minutes
const configCache = new SimpleCache(900000);     // 15 minutes

// Cleanup expired entries every 5 minutes
setInterval(() => {
    claimTypesCache.cleanup();
    userInfoCache.cleanup();
    configCache.cleanup();
}, 300000);

module.exports = {
    SimpleCache,
    claimTypesCache,
    userInfoCache,
    configCache
}; 