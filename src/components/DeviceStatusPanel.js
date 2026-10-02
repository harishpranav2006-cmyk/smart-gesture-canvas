import { soundService } from '../services/soundService.js';

/**
 * DeviceStatusPanel Component
 * Displays detailed hardware parameters and provides interactive Connect, Disconnect,
 * Reconnect, and Test Device diagnostic buttons.
 */
export class DeviceStatusPanel {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.deviceNameEl = document.getElementById('dev-name-val');
    this.statusTextEl = document.getElementById('dev-status-val');
    this.batteryValEl = document.getElementById('dev-battery-val');
    this.signalValEl = document.getElementById('dev-signal-val');
    this.firmwareValEl = document.getElementById('dev-firmware-val');
    this.inputValEl = document.getElementById('dev-input-val');
    this.diagnosticLogEl = document.getElementById('dev-diagnostic-output');

    this.connectBtn = document.getElementById('btn-dev-connect');
    this.disconnectBtn = document.getElementById('btn-dev-disconnect');
    this.reconnectBtn = document.getElementById('btn-dev-reconnect');
    this.testBtn = document.getElementById('btn-dev-test');

    this.bindEvents();
  }

  bindEvents() {
    this.hardware.on('connection', status => {
      this.renderStatus(status);
    });

    this.hardware.on('battery', battery => {
      if (this.batteryValEl) {
        this.batteryValEl.textContent = `${battery.level}% (${battery.estimate})`;
      }
    });

    if (this.connectBtn) {
      this.connectBtn.addEventListener('click', async () => {
        soundService.playKeyClick();
        this.setButtonsDisabled(true);
        await this.hardware.connect();
        soundService.playSuccess();
        this.setButtonsDisabled(false);
      });
    }

    if (this.disconnectBtn) {
      this.disconnectBtn.addEventListener('click', async () => {
        soundService.playKeyClick();
        await this.hardware.disconnect();
        soundService.playAlert();
      });
    }

    if (this.reconnectBtn) {
      this.reconnectBtn.addEventListener('click', async () => {
        soundService.playKeyClick();
        this.setButtonsDisabled(true);
        await this.hardware.reconnect();
        soundService.playSuccess();
        this.setButtonsDisabled(false);
      });
    }

    if (this.testBtn) {
      this.testBtn.addEventListener('click', async () => {
        soundService.playKeyClick();
        this.testBtn.disabled = true;
        this.testBtn.textContent = 'Testing...';
        
        const report = await this.hardware.testDevice();
        soundService.playSuccess();

        if (this.diagnosticLogEl) {
          this.diagnosticLogEl.innerHTML = `
            <div style="background:var(--bg-surface-elevated);padding:0.75rem;border-radius:var(--radius-sm);border:1px solid var(--border-medium);font-size:0.8rem;font-family:var(--font-mono);color:#38bdf8;">
              ✓ Diagnostic Passed: ${report.deviceName} | Latency: ${report.pingLatency} | Optical: ${report.opticalSensor}
            </div>
          `;
        }

        this.testBtn.disabled = false;
        this.testBtn.innerHTML = '<span>⚡</span> Test Device';
      });
    }

    // Initial render
    this.renderStatus(this.hardware.getStatus());
  }

  setButtonsDisabled(disabled) {
    if (this.connectBtn) this.connectBtn.disabled = disabled;
    if (this.reconnectBtn) this.reconnectBtn.disabled = disabled;
  }

  renderStatus(status) {
    if (!this.statusTextEl) return;

    this.statusTextEl.textContent = status.state;
    this.statusTextEl.style.color = status.connected ? 'var(--color-success)' : (status.state === 'Connecting' ? 'var(--color-warning)' : 'var(--color-danger)');

    if (this.deviceNameEl) this.deviceNameEl.textContent = status.deviceName;
    if (this.batteryValEl) this.batteryValEl.textContent = `${status.batteryLevel}% (${status.batteryEstimate})`;
    if (this.signalValEl) this.signalValEl.textContent = `${status.signalStrength} (${status.rssi} dBm)`;
    if (this.firmwareValEl) this.firmwareValEl.textContent = status.firmwareVersion;
    if (this.inputValEl) this.inputValEl.textContent = status.inputType;

    // Toggle button visibility based on connection state
    if (this.connectBtn) {
      this.connectBtn.style.display = status.connected ? 'none' : 'inline-flex';
    }
    if (this.disconnectBtn) {
      this.disconnectBtn.style.display = status.connected ? 'inline-flex' : 'none';
    }
  }
}
