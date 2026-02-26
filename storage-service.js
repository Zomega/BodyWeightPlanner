/**
 * Handles persistence of user data to localStorage.
 */
export const StorageService = {
  STORAGE_KEY: 'bwp_user_data',

  save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load from localStorage', e);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },
};
