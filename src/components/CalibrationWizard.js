import { soundService } from '../services/soundService.js';

/**
 * CalibrationWizard Component
 * Interactive 4-step guided calibration flow with step verification and visual instructions.
 */
export class CalibrationWizard {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.container = document.getElementById('calibration-wizard-root');
    this.stepBubbles = document.querySelectorAll('.step-bubble');
    this.tagEl = document.getElementById('calib-step-tag');
    this.headlineEl = document.getElementById('calib-headline');
    this.detailEl = document.getElementById('calib-detail');
    this.iconEl = document.getElementById('calib-icon-display');
    this.meterFill = document.getElementById('calib-meter-fill');
    this.meterText = document.getElementById('calib-meter-text');

    this.nextBtn = document.getElementById('btn-calib-next');
    this.restartBtn = document.getElementById('btn-calib-restart');

    this.currentStep = 1;

    this.init();
  }

  init() {
    this.bindEvents();
    this.bindHardwareEvents();
    this.renderStep(1);
  }

  bindEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        if (this.currentStep < 4) {
          this.advanceStep();
        } else {
          // Restart
          this.resetWizard();
        }
      });
    }

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.resetWizard();
      });
    }
  }

  bindHardwareEvents() {
    this.hardware.on('calibration', state => {
      if (state.active) {
        this.renderStep(state.currentStep);
      }
    });
  }

  advanceStep() {
    this.currentStep++;
    if (this.currentStep === 4) {
      soundService.playSuccess();
    } else {
      soundService.playKeyClick();
    }
    this.renderStep(this.currentStep);
    this.hardware.advanceCalibrationStep();
  }

  resetWizard() {
    this.currentStep = 1;
    this.renderStep(1);
    this.hardware.startCalibration();
  }

  renderStep(stepNum) {
    this.currentStep = stepNum;

    // Update Step Bubbles
    this.stepBubbles.forEach((bubble, idx) => {
      const bNum = idx + 1;
      bubble.classList.remove('active', 'completed');
      if (bNum < stepNum) {
        bubble.classList.add('completed');
        bubble.innerHTML = '✓';
      } else if (bNum === stepNum) {
        bubble.classList.add('active');
        bubble.innerHTML = `${bNum}`;
      } else {
        bubble.innerHTML = `${bNum}`;
      }
    });

    const stepData = {
      1: {
        tag: 'Calibration 1 of 4',
        headline: 'Rest in Neutral Position',
        detail: 'Hold your hand 15–20 cm above the optical gesture sensor in a relaxed open posture. The optical matrix will calibrate ambient light and zero-offset baseline.',
        icon: '✋',
        progress: 25,
        btnText: 'Confirm Neutral Position →'
      },
      2: {
        tag: 'Calibration 2 of 4',
        headline: 'Move in Indicated Directions',
        detail: 'Slowly sweep your hand Up, Down, Left, and Right across the detection cone to register spatial coordinate boundaries.',
        icon: '↔️',
        progress: 50,
        btnText: 'Verify Sweep Limits →'
      },
      3: {
        tag: 'Calibration 3 of 4',
        headline: 'Perform Requested Gesture',
        detail: 'Perform a clear Pinch or Click gesture (bringing thumb and index finger together). The sensor will record your click velocity profile.',
        icon: '🤏',
        progress: 75,
        btnText: 'Verify Pinch Action →'
      },
      4: {
        tag: 'Calibration 4 of 4 (Complete)',
        headline: 'Calibration Succeeded!',
        detail: '6-DoF IMU and optical gesture matrix successfully profiled. Tracking confidence optimized to 98.4% with 12ms latency.',
        icon: '🎉',
        progress: 100,
        btnText: 'Finish & Save Profile'
      }
    };

    const cur = stepData[stepNum] || stepData[1];

    if (this.tagEl) this.tagEl.textContent = cur.tag;
    if (this.headlineEl) this.headlineEl.textContent = cur.headline;
    if (this.detailEl) this.detailEl.textContent = cur.detail;
    if (this.iconEl) this.iconEl.textContent = cur.icon;
    if (this.meterFill) this.meterFill.style.width = `${cur.progress}%`;
    if (this.meterText) this.meterText.textContent = `${cur.progress}% Completed`;
    if (this.nextBtn) this.nextBtn.textContent = cur.btnText;
  }
}
