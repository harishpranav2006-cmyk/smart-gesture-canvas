/**
 * Hardware Service Architecture & Interface Definitions
 * 
 * SMART GESTURE CANVAS - DEVICE INTERFACE LAYER
 * 
 * This file specifies the contract between the frontend dashboard and the hardware layer.
 * Currently, MockHardwareService implements this interface for demo & testing.
 * When physical hardware is ready, implement RealHardwareService using Web Bluetooth,
 * Web Serial, or WebSockets following this exact specification.
 * 
 * @typedef {Object} DeviceStatus
 * @property {boolean} connected - Whether the device is connected
 * @property {'Connected'|'Connecting'|'Disconnected'|'Reconnecting'|'Error'} state - State enum
 * @property {string} deviceName - Name of device ('Smart Gesture Controller')
 * @property {string} firmwareVersion - E.g. 'Demo v1.0' / 'HW-Rev2.1'
 * @property {string} signalStrength - 'Strong' | 'Good' | 'Weak'
 * @property {number} rssi - Received signal strength in dBm (e.g. -42)
 * @property {string} inputType - 'Optical Gesture Matrix + 6-DoF IMU'
 * @property {number} batteryLevel - Battery percentage 0 to 100
 * @property {string} batteryEstimate - Formatted remaining time e.g. '6h 24m'
 * @property {boolean} isCharging - Whether currently charging
 * @property {number} latencyMs - Roundtrip latency in milliseconds
 * 
 * @typedef {Object} GestureEvent
 * @property {string} gesture - 'Open Palm' | 'Fist' | 'Pinch' | 'Point' | 'Swipe Left' | 'Swipe Right' | 'Double Tap' | 'Click' | 'Move'
 * @property {number} confidence - Confidence percentage (0 to 100)
 * @property {number} timestamp - Epoch timestamp
 * @property {{x: number, y: number, z?: number}} [rawPosition] - Normalized 0.0 - 1.0 or pixel coordinates
 * @property {{pitch: number, roll: number, yaw: number}} [imu] - Orientation telemetry
 * 
 * @typedef {Object} CursorPosition
 * @property {number} x - Normalized X (0.0 to 1.0) or canvas pixels
 * @property {number} y - Normalized Y (0.0 to 1.0) or canvas pixels
 * @property {boolean} isDown - Gesture drawing/click state (e.g. Pinch or Click)
 * @property {number} speed - Relative velocity
 * 
 * @typedef {Object} CalibrationStep
 * @property {number} step - Current step (1, 2, 3, 4)
 * @property {number} totalSteps - Total steps (4)
 * @property {string} title - Step title
 * @property {string} instruction - Action for user to perform
 * @property {string} targetGesture - Gesture expected in this step
 * @property {number} progress - Progress percentage for this step (0 to 100)
 * @property {boolean} completed - Whether step is passed
 */

export const GESTURE_TYPES = {
  OPEN_PALM: 'Open Palm',
  FIST: 'Fist',
  PINCH: 'Pinch',
  POINT: 'Point',
  SWIPE_LEFT: 'Swipe Left',
  SWIPE_RIGHT: 'Swipe Right',
  DOUBLE_TAP: 'Double Tap',
  CLICK: 'Click',
  MOVE: 'Move'
};

export const CONNECTION_STATES = {
  CONNECTED: 'Connected',
  CONNECTING: 'Connecting',
  DISCONNECTED: 'Disconnected',
  RECONNECTING: 'Reconnecting',
  ERROR: 'Error'
};
