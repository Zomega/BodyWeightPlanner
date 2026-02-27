/**
 * Handles persistence of user data to localStorage.
 */
export const StorageService = {
  STORAGE_KEY: 'bwp_user_data',
  SETTINGS_KEY: 'bwp_global_settings',

  save(data, key = this.STORAGE_KEY) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  load(key = this.STORAGE_KEY) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load from localStorage', e);
      return null;
    }
  },

  saveSettings(settings) {
    const current = this.load(this.SETTINGS_KEY) || {};
    const updated = { ...current, ...settings };
    this.save(updated, this.SETTINGS_KEY);
  },

  loadSettings() {
    return this.load(this.SETTINGS_KEY) || {};
  },

  clear(key = this.STORAGE_KEY) {
    localStorage.removeItem(key);
  },

  getAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('bwp_') || key.startsWith('bmi_')) {
        const value = localStorage.getItem(key);
        try {
          // Attempt to parse nested JSON so the export is readable
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = value;
        }
      }
    }
    return data;
  },

  exportToJSON() {
    const data = this.getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `body-weight-planner-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          Object.keys(data).forEach((key) => {
            let value = data[key];
            if (typeof value === 'object' && value !== null) {
              value = JSON.stringify(value);
            }
            localStorage.setItem(key, value);
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
};
