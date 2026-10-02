import { soundService } from '../services/soundService.js';

/**
 * Header Component
 * Manages the top header, live telemetry chips, battery state, and accessibility triggers.
 */
export class Header {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.connectionDot = document.getElementById('header-conn-dot');
    this.connectionText = document.getElementById('header-conn-text');
    this.batteryBar = document.getElementById('header-battery-bar');
    this.batteryPercent = document.getElementById('header-battery-pct');
    this.gestureChip = document.getElementById('header-gesture-chip');
    this.srLive = document.getElementById('sr-announcements');

    this.bindEvents();
  }

  bindEvents() {
    // Listen to hardware connection updates
    this.hardware.on('connection', status => {
      this.updateConnectionUI(status);
    });

    // Listen to hardware battery updates
    this.hardware.on('battery', battery => {
      this.updateBatteryUI(battery);
    });

    // Listen to live gesture updates
    this.hardware.on('gesture', gesture => {
      this.updateGestureUI(gesture);
    });

    // Initial render
    this.updateConnectionUI(this.hardware.getStatus());
    this.updateBatteryUI(this.hardware.getBattery());
    this.updateGestureUI(this.hardware.getGesture());
  }

  updateConnectionUI(status) {
    if (!this.connectionDot || !this.connectionText) return;

    this.connectionDot.className = 'status-dot';
    if (status.state === 'Connected') {
      this.connectionDot.classList.add('connected');
      this.connectionText.textContent = 'Device Connected';
    } else if (status.state === 'Connecting') {
      this.connectionDot.classList.add('connecting');
      this.connectionText.textContent = 'Connecting...';
    } else {
      this.connectionDot.classList.add('disconnected');
      this.connectionText.textContent = 'Disconnected';
    }
  }

  updateBatteryUI(battery) {
    if (!this.batteryBar || !this.batteryPercent) return;

    const level = battery.level;
    this.batteryPercent.textContent = `${level}%`;
    this.batteryBar.style.width = `${level}%`;

    this.batteryBar.className = 'battery-level-bar';
    if (level >= 80) {
      this.batteryBar.classList.add('state-high');
    } else if (level >= 50) {
      this.batteryBar.classList.add('state-mid');
    } else if (level >= 20) {
      this.batteryBar.classList.add('state-low');
    } else {
      this.batteryBar.classList.add('state-critical');
    }
  }

  updateGestureUI(gesture) {
    if (!this.gestureChip) return;
    this.gestureChip.innerHTML = `
      <span class="status-dot connected" style="background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>
      <span>${gesture.gesture}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">(${gesture.confidence}%)</span>
    `;
  }

  announce(message) {
    if (this.srLive) {
      this.srLive.textContent = message;
    }
  }
}
