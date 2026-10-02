import { soundService } from '../services/soundService.js';

/**
 * LiveGestureMonitor Component
 * Displays real-time animated hand/gesture visualization, confidence score,
 * tracking state, and orientation angles.
 */
export class LiveGestureMonitor {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.container = document.getElementById('live-gesture-monitor');
    this.gestureNameEl = document.getElementById('monitor-gesture-name');
    this.confidenceEl = document.getElementById('monitor-confidence-val');
    this.confidenceBar = document.getElementById('monitor-confidence-bar');
    this.trackingStateEl = document.getElementById('monitor-tracking-state');
    this.handIconEl = document.getElementById('monitor-hand-icon');
    this.imuPitchEl = document.getElementById('monitor-imu-pitch');
    this.imuRollEl = document.getElementById('monitor-imu-roll');

    this.gestureIconMap = {
      'Open Palm': '✋',
      'Fist': '✊',
      'Pinch': '🤏',
      'Point': '👉',
      'Swipe Left': '👈',
      'Swipe Right': '👉',
      'Double Tap': '✌️',
      'Click': '👆',
      'Move': '🖐️'
    };

    this.bindEvents();
  }

  bindEvents() {
    this.hardware.on('gesture', gesture => {
      this.renderGesture(gesture);
    });

    this.hardware.on('connection', status => {
      if (this.trackingStateEl) {
        this.trackingStateEl.textContent = status.connected ? 'Active' : 'Offline';
        this.trackingStateEl.style.color = status.connected ? 'var(--color-success)' : 'var(--color-danger)';
      }
    });

    // Initial render
    this.renderGesture(this.hardware.getGesture());
  }

  renderGesture(gesture) {
    if (!this.gestureNameEl) return;

    this.gestureNameEl.textContent = gesture.gesture;
    this.confidenceEl.textContent = `${gesture.confidence}%`;
    
    if (this.confidenceBar) {
      this.confidenceBar.style.width = `${gesture.confidence}%`;
    }

    // Update hand icon with gentle animation
    const icon = this.gestureIconMap[gesture.gesture] || '✋';
    if (this.handIconEl) {
      this.handIconEl.textContent = icon;
      this.handIconEl.style.transform = 'scale(1.2)';
      setTimeout(() => {
        if (this.handIconEl) this.handIconEl.style.transform = 'scale(1.0)';
      }, 150);
    }

    // Telemetry Pitch & Roll
    if (gesture.imu) {
      if (this.imuPitchEl) this.imuPitchEl.textContent = `${gesture.imu.pitch > 0 ? '+' : ''}${gesture.imu.pitch}°`;
      if (this.imuRollEl) this.imuRollEl.textContent = `${gesture.imu.roll > 0 ? '+' : ''}${gesture.imu.roll}°`;
    }
  }
}
