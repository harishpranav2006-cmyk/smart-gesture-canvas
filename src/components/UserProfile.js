import { storageService } from '../services/storageService.js';
import { soundService } from '../services/soundService.js';

/**
 * UserProfile Component
 * Displays and allows switching accessibility user profiles without personal info.
 */
export class UserProfile {
  constructor(accessibilityPanel) {
    this.a11y = accessibilityPanel;
    this.modeEl = document.getElementById('profile-mode-val');
    this.sizeEl = document.getElementById('profile-size-val');
    this.sensEl = document.getElementById('profile-sens-val');
    this.kbSizeEl = document.getElementById('profile-kbsize-val');

    this.profileSelect = document.getElementById('profile-preset-select');

    this.init();
  }

  init() {
    this.render();

    if (this.profileSelect) {
      this.profileSelect.addEventListener('change', e => {
        soundService.playKeyClick();
        this.applyPreset(e.target.value);
      });
    }
  }

  render() {
    const prefs = storageService.getPreferences();
    if (this.modeEl) this.modeEl.textContent = prefs.interactionMode;
    if (this.sizeEl) this.sizeEl.textContent = prefs.interfaceScale.charAt(0).toUpperCase() + prefs.interfaceScale.slice(1);
    if (this.sensEl) this.sensEl.textContent = prefs.gestureSensitivity.charAt(0).toUpperCase() + prefs.gestureSensitivity.slice(1);
    if (this.kbSizeEl) this.kbSizeEl.textContent = prefs.keyboardSize.charAt(0).toUpperCase() + prefs.keyboardSize.slice(1);
  }

  applyPreset(presetKey) {
    const prefs = storageService.getPreferences();

    if (presetKey === 'tremor') {
      prefs.gestureSensitivity = 'low';
      prefs.interfaceScale = 'large';
      prefs.buttonSize = 'extra-large';
      prefs.keyboardSize = 'large';
      prefs.keyboardScanMode = false;
    } else if (presetKey === 'scanning') {
      prefs.gestureSensitivity = 'medium';
      prefs.interfaceScale = 'medium';
      prefs.buttonSize = 'large';
      prefs.keyboardSize = 'large';
      prefs.keyboardScanMode = true;
    } else {
      // Standard
      prefs.gestureSensitivity = 'medium';
      prefs.interfaceScale = 'medium';
      prefs.buttonSize = 'normal';
      prefs.keyboardSize = 'large';
      prefs.keyboardScanMode = false;
    }

    if (this.a11y) {
      this.a11y.applyPreferences(prefs);
    }
    this.render();
  }
}
