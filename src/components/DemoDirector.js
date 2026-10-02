import { soundService } from '../services/soundService.js';

/**
 * DemoDirector Component
 * A floating presenter's toolbar enabling on-demand manual triggering of gestures,
 * battery warning states, and hardware events during presentations and demos.
 */
export class DemoDirector {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.container = document.getElementById('demo-director-bar');
    this.toggleAutoBtn = document.getElementById('btn-director-toggle-auto');

    this.init();
  }

  init() {
    if (!this.container) return;

    // Gesture Override Buttons
    const gestureBtns = document.querySelectorAll('.director-gesture-btn');
    gestureBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const gesture = btn.dataset.gesture;
        soundService.playKeyClick();
        this.hardware.triggerManualGesture(gesture);
        soundService.playGestureTone(gesture);

        gestureBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 1200);
      });
    });

    // Battery Override Buttons
    const batt15Btn = document.getElementById('btn-director-batt-15');
    const batt85Btn = document.getElementById('btn-director-batt-85');

    if (batt15Btn) {
      batt15Btn.addEventListener('click', () => {
        soundService.playAlert();
        this.hardware.triggerBatteryOverride(15);
      });
    }

    if (batt85Btn) {
      batt85Btn.addEventListener('click', () => {
        soundService.playSuccess();
        this.hardware.triggerBatteryOverride(87);
      });
    }

    // Toggle Auto Simulation
    if (this.toggleAutoBtn) {
      this.toggleAutoBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        const active = this.hardware.toggleAutoSimulation();
        this.toggleAutoBtn.textContent = active ? 'Simulation: Auto (ON)' : 'Simulation: Manual (Paused)';
        this.toggleAutoBtn.classList.toggle('active', active);
      });
    }
  }
}
