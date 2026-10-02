import { soundService } from '../services/soundService.js';
import { speechService } from '../services/speechService.js';
import { storageService } from '../services/storageService.js';

/**
 * AccessibilityPanel Component
 * Controls Interface Scale, High Contrast, Reduced Motion, Button Size,
 * Gesture Sensitivity, and Sound/Speech feedback toggles.
 */
export class AccessibilityPanel {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.modal = document.getElementById('accessibility-modal');
    this.openModalBtn = document.getElementById('btn-open-settings-modal');
    this.closeModalBtn = document.getElementById('btn-close-settings-modal');

    // Controls
    this.scaleSelect = document.getElementById('setting-ui-scale');
    this.contrastToggle = document.getElementById('setting-high-contrast');
    this.motionToggle = document.getElementById('setting-reduced-motion');
    this.btnSizeSelect = document.getElementById('setting-btn-size');
    this.sensitivitySelect = document.getElementById('setting-gesture-sensitivity');
    this.soundToggle = document.getElementById('setting-sound-feedback');
    this.speechToggle = document.getElementById('setting-speech-feedback');

    this.prefs = storageService.getPreferences();
    this.init();
  }

  init() {
    this.applyPreferences(this.prefs);
    this.bindEvents();
  }

  bindEvents() {
    // Open/Close Native Dialog
    if (this.openModalBtn && this.modal) {
      this.openModalBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.modal.showModal();
      });
    }

    if (this.closeModalBtn && this.modal) {
      this.closeModalBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.modal.close();
      });
    }

    // Backdrop click dismisses dialog
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        const rect = this.modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
          && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          this.modal.close();
        }
      });
    }

    // Scale Select
    if (this.scaleSelect) {
      this.scaleSelect.value = this.prefs.interfaceScale;
      this.scaleSelect.addEventListener('change', e => {
        this.prefs.interfaceScale = e.target.value;
        this.applyPreferences(this.prefs);
      });
    }

    // High Contrast Toggle
    if (this.contrastToggle) {
      this.contrastToggle.checked = this.prefs.highContrast;
      this.contrastToggle.addEventListener('change', e => {
        this.prefs.highContrast = e.target.checked;
        this.applyPreferences(this.prefs);
      });
    }

    // Reduced Motion Toggle
    if (this.motionToggle) {
      this.motionToggle.checked = this.prefs.reducedMotion;
      this.motionToggle.addEventListener('change', e => {
        this.prefs.reducedMotion = e.target.checked;
        this.applyPreferences(this.prefs);
      });
    }

    // Button Size Select
    if (this.btnSizeSelect) {
      this.btnSizeSelect.value = this.prefs.buttonSize;
      this.btnSizeSelect.addEventListener('change', e => {
        this.prefs.buttonSize = e.target.value;
        this.applyPreferences(this.prefs);
      });
    }

    // Sensitivity Select
    if (this.sensitivitySelect) {
      this.sensitivitySelect.value = this.prefs.gestureSensitivity;
      this.sensitivitySelect.addEventListener('change', e => {
        this.prefs.gestureSensitivity = e.target.value;
        this.applyPreferences(this.prefs);
      });
    }

    // Sound Feedback Toggle
    if (this.soundToggle) {
      this.soundToggle.checked = this.prefs.soundFeedback;
      this.soundToggle.addEventListener('change', e => {
        this.prefs.soundFeedback = e.target.checked;
        this.applyPreferences(this.prefs);
      });
    }

    // Speech Feedback Toggle
    if (this.speechToggle) {
      this.speechToggle.checked = this.prefs.speechFeedback;
      this.speechToggle.addEventListener('change', e => {
        this.prefs.speechFeedback = e.target.checked;
        this.applyPreferences(this.prefs);
      });
    }
  }

  applyPreferences(prefs) {
    storageService.savePreferences(prefs);

    // 1. Interface Scale
    const scaleValues = { small: '0.88', medium: '1', large: '1.16' };
    document.documentElement.style.setProperty('--ui-scale', scaleValues[prefs.interfaceScale] || '1');

    // 2. High Contrast
    if (prefs.highContrast) {
      document.body.classList.add('theme-high-contrast');
    } else {
      document.body.classList.remove('theme-high-contrast');
    }

    // 3. Reduced Motion
    if (prefs.reducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    // 4. Button Size
    document.body.classList.remove('btn-size-large', 'btn-size-xlarge');
    if (prefs.buttonSize === 'large') {
      document.body.classList.add('btn-size-large');
    } else if (prefs.buttonSize === 'extra-large') {
      document.body.classList.add('btn-size-xlarge');
    }

    // 5. Sound Feedback
    soundService.setEnabled(prefs.soundFeedback);

    // 6. Speech Feedback
    speechService.setEnabled(prefs.speechFeedback);

    // 7. Sensitivity to Hardware
    if (this.hardware && this.hardware.setSensitivity) {
      this.hardware.setSensitivity(prefs.gestureSensitivity);
    }
  }
}
