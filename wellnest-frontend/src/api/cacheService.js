const cache = new Map();

/**
 * Universal in-memory cache for API responses.
 * Used to provide instant rendering when navigating between SPA routes.
 */
const cacheService = {
  /**
   * Get cached data for a specific key (usually the API URL)
   */
  get(key) {
    if (!key) return null;
    return cache.get(key);
  },

  /**
   * Set data in cache
   */
  set(key, data) {
    if (!key) return;
    cache.set(key, data);
  },

  /**
   * Remove a specific key from cache
   */
  remove(key) {
    cache.delete(key);
  },

  /**
   * Clear all cached data (e.g., on logout)
   */
  clear() {
    cache.clear();
    console.log("Universal API Cache cleared.");
  }
};

export default cacheService;
