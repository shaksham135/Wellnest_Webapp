import { Preferences } from '@capacitor/preferences';

const isNative = !!(window.Capacitor && window.Capacitor.getPlatform() !== 'web');

const storageService = {
  /**
   * Set a value in both Native Preferences and LocalStorage
   */
  async setItem(key, value) {
    localStorage.setItem(key, value);
    if (isNative) {
      await Preferences.set({ key, value });
    }
  },

  /**
   * Get a value, trying Native Preferences first if on native, then falling back to LocalStorage
   */
  async getItem(key) {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      if (value) {
        // Sync back to localStorage for synchronous access in components
        localStorage.setItem(key, value);
        return value;
      }
    }
    return localStorage.getItem(key);
  },

  /**
   * Remove a value from both storages
   */
  async removeItem(key) {
    localStorage.removeItem(key);
    if (isNative) {
      await Preferences.remove({ key });
    }
  },

  /**
   * Clear all auth related storage
   */
  async clearAuth() {
    const keys = ['token', 'userId', 'role', 'isVerified'];
    localStorage.clear(); // Safe to clear all in web-context usually
    if (isNative) {
      for (const key of keys) {
        await Preferences.remove({ key });
      }
    }
  },

  /**
   * Check if any auth token exists natively
   */
  async hasToken() {
    const token = await this.getItem('token');
    return !!token;
  }
};

export default storageService;
