/**
 * StorageService - LocalStorage persistence for user profile and accessibility preferences
 */
const DEFAULT_PREFERENCES = {
  interfaceScale: 'medium', // small | medium | large
  highContrast: false,
  reducedMotion: false,
  buttonSize: 'normal',     // normal | large | extra-large
  gestureSensitivity: 'medium', // low | medium | high
  soundFeedback: true,
  speechFeedback: true,
  tremorSmoothing: 'medium',
  keyboardSize: 'large',
  keyboardScanMode: false,
  scanSpeedMs: 1200,
  interactionMode: 'Gesture Control'
};

const DEFAULT_PROFILE = {
  name: 'Community User',
  interactionMode: 'Gesture Control',
  preferredSize: 'Large',
  sensitivity: 'Medium',
  notes: 'Optimized for single-hand optical gesture sensing'
};

class StorageService {
  getPreferences() {
    try {
      const data = localStorage.getItem('sgc_preferences');
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : { ...DEFAULT_PREFERENCES };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  savePreferences(prefs) {
    try {
      localStorage.setItem('sgc_preferences', JSON.stringify(prefs));
    } catch (e) {
      console.warn('Could not save preferences', e);
    }
  }

  getProfile() {
    try {
      const data = localStorage.getItem('sgc_profile');
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : { ...DEFAULT_PROFILE };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  saveProfile(profile) {
    try {
      localStorage.setItem('sgc_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save profile', e);
    }
  }
}

export const storageService = new StorageService();
