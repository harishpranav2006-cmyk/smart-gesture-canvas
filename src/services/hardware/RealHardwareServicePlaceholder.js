/**
 * RealHardwareServicePlaceholder
 * 
 * SMART GESTURE CANVAS - REAL HARDWARE INTEGRATION POINT
 * 
 * To the Hardware Team:
 * When the physical glove / wristband / optical gesture sensor device is assembled,
 * implement this class following the exact same method and event signatures as MockHardwareService.
 * 
 * Supported Connection Protocols in Modern Web:
 * 1. Web Bluetooth API: navigator.bluetooth.requestDevice({ filters: [{ services: ['...'] }] })
 * 2. Web Serial API: navigator.serial.requestPort() -> 115200 baud UART streaming
 * 3. WebSockets / Local Daemon: new WebSocket('ws://localhost:8080/gestures')
 * 
 * Once implemented, update src/services/hardware/index.js to switch from MockHardwareService
 * to RealHardwareService. The rest of the dashboard UI will automatically work without any changes!
 */

import { GESTURE_TYPES, CONNECTION_STATES } from './types.js';

export class RealHardwareServicePlaceholder {
  constructor() {
    this.listeners = new Map();
    this.status = {
      connected: false,
      state: CONNECTION_STATES.DISCONNECTED,
      deviceName: 'Smart Gesture Hardware (Awaiting Connection)',
      firmwareVersion: 'HW-Target v1.0',
      signalStrength: 'None',
      rssi: 0,
      inputType: 'Physical Gesture Sensor',
      batteryLevel: 0,
      batteryEstimate: '--',
      isCharging: false,
      latencyMs: 0
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  async connect() {
    console.log('[RealHardwareService] Connect initiated. Ready to pair via Web Bluetooth or Web Serial.');
    /*
     * Example Web Bluetooth Implementation:
     * const device = await navigator.bluetooth.requestDevice({
     *   filters: [{ namePrefix: 'SmartGesture' }],
     *   optionalServices: ['battery_service', '0000ffe0-0000-1000-8000-00805f9b34fb']
     * });
     * const server = await device.gatt.connect();
     * ...
     */
    return { success: false, message: 'Physical hardware module not connected yet. Switch to Mock mode.' };
  }

  async disconnect() {
    console.log('[RealHardwareService] Disconnect.');
    this.status.connected = false;
    this.status.state = CONNECTION_STATES.DISCONNECTED;
    this.emit('connection', { ...this.status });
    return { success: true };
  }

  async reconnect() {
    await this.disconnect();
    return await this.connect();
  }

  async testDevice() {
    return { success: false, message: 'Hardware ping requires active connection.' };
  }

  getStatus() {
    return { ...this.status };
  }

  getBattery() {
    return { level: this.status.batteryLevel, estimate: this.status.batteryEstimate, isCharging: this.status.isCharging };
  }

  getGesture() {
    return { gesture: 'None', confidence: 0, timestamp: Date.now() };
  }

  getCursorPosition() {
    return { x: 0.5, y: 0.5, isDown: false, speed: 1.0 };
  }

  setSensitivity(level) {
    console.log('[RealHardwareService] Sensitivity updated to', level);
  }

  startCalibration() {
    console.log('[RealHardwareService] Sending zero-offset / calibrate command to MCU.');
  }

  advanceCalibrationStep() {}
  stopCalibration() {}
}
