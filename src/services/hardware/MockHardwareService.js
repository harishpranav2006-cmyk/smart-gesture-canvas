import { GESTURE_TYPES, CONNECTION_STATES } from './types.js';

/**
 * MockHardwareService
 * 
 * Simulates a physical Smart Gesture Controller device with 6-DoF IMU and optical gesture sensor.
 * Emits live events for gestures, cursor coordinates, battery telemetry, and connection state changes.
 * Allows full manual override so presenters and developers can demonstrate any scenario on demand.
 */
export class MockHardwareService {
  constructor() {
    this.listeners = new Map();
    this.status = {
      connected: true,
      state: CONNECTION_STATES.CONNECTED,
      deviceName: 'Smart Gesture Controller (Rev 1)',
      firmwareVersion: 'Demo v1.0.4',
      signalStrength: 'Strong',
      rssi: -42,
      inputType: 'Optical Gesture Sensor + 6-DoF IMU',
      batteryLevel: 87,
      batteryEstimate: '6h 24m',
      isCharging: false,
      latencyMs: 14,
      sensorRateHz: 120
    };

    this.currentGesture = {
      gesture: GESTURE_TYPES.OPEN_PALM,
      confidence: 96,
      timestamp: Date.now(),
      rawPosition: { x: 0.5, y: 0.5, z: 0.2 },
      imu: { pitch: 2.1, roll: -1.4, yaw: 45.2 }
    };

    this.cursorPosition = {
      x: 0.5,
      y: 0.5,
      isDown: false,
      speed: 1.0
    };

    this.calibrationState = {
      active: false,
      currentStep: 1,
      totalSteps: 4,
      steps: [
        {
          step: 1,
          title: 'Neutral Baseline',
          instruction: 'Place your hand or device in a comfortable, resting neutral position directly above the sensor zone.',
          targetGesture: GESTURE_TYPES.OPEN_PALM,
          progress: 0,
          completed: false
        },
        {
          step: 2,
          title: 'Boundary Range',
          instruction: 'Gently sweep your hand horizontally and vertically across the detection area to establish boundary limits.',
          targetGesture: GESTURE_TYPES.MOVE,
          progress: 0,
          completed: false
        },
        {
          step: 3,
          title: 'Pinch & Grip Trigger',
          instruction: 'Perform a clean pinch gesture (thumb + index finger) or light grip to calibrate the assistive click threshold.',
          targetGesture: GESTURE_TYPES.PINCH,
          progress: 0,
          completed: false
        },
        {
          step: 4,
          title: 'Calibration Complete',
          instruction: 'Sensor profiling successful. Optical matrix and gyroscope calibrated with 98.4% tracking confidence.',
          targetGesture: 'Complete',
          progress: 100,
          completed: true
        }
      ]
    };

    this.sensitivity = 'medium'; // low | medium | high
    this.autoSimulation = true;
    this.timerIds = [];
    this.gestureSequence = [
      { gesture: GESTURE_TYPES.OPEN_PALM, confidence: 96 },
      { gesture: GESTURE_TYPES.MOVE, confidence: 94 },
      { gesture: GESTURE_TYPES.POINT, confidence: 95 },
      { gesture: GESTURE_TYPES.PINCH, confidence: 92 },
      { gesture: GESTURE_TYPES.OPEN_PALM, confidence: 97 },
      { gesture: GESTURE_TYPES.SWIPE_RIGHT, confidence: 93 },
      { gesture: GESTURE_TYPES.OPEN_PALM, confidence: 95 },
      { gesture: GESTURE_TYPES.DOUBLE_TAP, confidence: 91 },
      { gesture: GESTURE_TYPES.MOVE, confidence: 96 },
      { gesture: GESTURE_TYPES.CLICK, confidence: 94 }
    ];
    this.gestureIndex = 0;

    // Physics/wandering parameters for simulated cursor
    this.cursorSim = {
      angle: 0.8,
      speed: 0.003,
      cx: 0.5,
      cy: 0.5,
      radiusX: 0.28,
      radiusY: 0.22
    };

    this.startSimulationLoops();
  }

  // Event Pub/Sub
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
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`MockHardwareService error in listener for ${event}:`, err);
        }
      });
    }
  }

  // Simulation Loops
  startSimulationLoops() {
    this.clearSimulationLoops();

    // 1. Gesture cycling loop (every 3.8s when connected and autoSimulation is on)
    const gestureInterval = setInterval(() => {
      if (!this.status.connected || !this.autoSimulation || this.calibrationState.active) return;
      this.cycleNextSimulatedGesture();
    }, 3800);
    this.timerIds.push(gestureInterval);

    // 2. Cursor movement loop (60 FPS smooth animation for canvas & cursor playground)
    const cursorInterval = setInterval(() => {
      if (!this.status.connected) return;
      this.updateSimulatedCursor();
    }, 33); // ~30 fps update
    this.timerIds.push(cursorInterval);

    // 3. Battery subtle drain and ping latency fluctuation (every 12 seconds)
    const telemetryInterval = setInterval(() => {
      if (!this.status.connected) return;
      this.updateBatteryAndTelemetry();
    }, 12000);
    this.timerIds.push(telemetryInterval);
  }

  clearSimulationLoops() {
    this.timerIds.forEach(id => clearInterval(id));
    this.timerIds = [];
  }

  cycleNextSimulatedGesture() {
    this.gestureIndex = (this.gestureIndex + 1) % this.gestureSequence.length;
    const next = this.gestureSequence[this.gestureIndex];
    
    // Add small random noise to confidence
    const confidence = Math.min(99, Math.max(88, next.confidence + (Math.floor(Math.random() * 5) - 2)));
    
    this.currentGesture = {
      gesture: next.gesture,
      confidence: confidence,
      timestamp: Date.now(),
      rawPosition: { ...this.cursorPosition },
      imu: {
        pitch: parseFloat((Math.sin(Date.now() / 1000) * 12).toFixed(1)),
        roll: parseFloat((Math.cos(Date.now() / 1200) * 15).toFixed(1)),
        yaw: parseFloat(((Date.now() / 200) % 360).toFixed(1))
      }
    };

    // If gesture is Pinch or Click, cursor is considered active/pressed
    this.cursorPosition.isDown = (next.gesture === GESTURE_TYPES.PINCH || next.gesture === GESTURE_TYPES.CLICK);

    this.emit('gesture', this.currentGesture);
    this.emit('log', {
      type: 'gesture',
      message: `${this.currentGesture.gesture} detected`,
      detail: `${this.currentGesture.confidence}% confidence`,
      timestamp: this.currentGesture.timestamp
    });
  }

  updateSimulatedCursor() {
    // Lissajous smooth path
    const mult = this.sensitivity === 'high' ? 1.5 : (this.sensitivity === 'low' ? 0.7 : 1.0);
    this.cursorSim.angle += this.cursorSim.speed * mult;
    
    const x = this.cursorSim.cx + Math.cos(this.cursorSim.angle) * this.cursorSim.radiusX + Math.sin(this.cursorSim.angle * 2.3) * 0.06;
    const y = this.cursorSim.cy + Math.sin(this.cursorSim.angle * 1.5) * this.cursorSim.radiusY + Math.cos(this.cursorSim.angle * 3.1) * 0.05;

    // Clamp coordinates 0.05 - 0.95
    this.cursorPosition.x = Math.max(0.05, Math.min(0.95, x));
    this.cursorPosition.y = Math.max(0.05, Math.min(0.95, y));

    this.emit('cursor', { ...this.cursorPosition });
  }

  updateBatteryAndTelemetry() {
    // Slowly fluctuate latency
    this.status.latencyMs = Math.floor(10 + Math.random() * 8);

    // Subtle battery drain if not charging
    if (!this.status.isCharging && this.status.batteryLevel > 5) {
      if (Math.random() > 0.4) {
        this.status.batteryLevel = Math.max(1, this.status.batteryLevel - 1);
        this.status.batteryEstimate = this.calculateRemainingTime(this.status.batteryLevel);
        this.emit('battery', {
          level: this.status.batteryLevel,
          estimate: this.status.batteryEstimate,
          isCharging: this.status.isCharging
        });
      }
    }
  }

  calculateRemainingTime(level) {
    const totalMinutes = Math.round(level * 4.4); // ~7.3 hours at 100%
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }

  // Hardware Interface Methods
  async connect() {
    if (this.status.connected && this.status.state === CONNECTION_STATES.CONNECTED) {
      return { success: true, message: 'Already connected' };
    }

    this.status.connected = false;
    this.status.state = CONNECTION_STATES.CONNECTING;
    this.emit('connection', { ...this.status });
    this.emit('log', {
      type: 'system',
      message: 'Connecting to Smart Gesture Controller...',
      timestamp: Date.now()
    });

    // Simulate realistic 1.2s connection handshake
    return new Promise(resolve => {
      setTimeout(() => {
        this.status.connected = true;
        this.status.state = CONNECTION_STATES.CONNECTED;
        this.status.rssi = -38 - Math.floor(Math.random() * 10);
        this.status.signalStrength = 'Strong';
        
        this.emit('connection', { ...this.status });
        this.emit('log', {
          type: 'system',
          message: 'Device connected successfully',
          detail: `${this.status.deviceName} (${this.status.firmwareVersion})`,
          timestamp: Date.now()
        });
        
        resolve({ success: true, status: this.status });
      }, 1200);
    });
  }

  async disconnect() {
    this.status.connected = false;
    this.status.state = CONNECTION_STATES.DISCONNECTED;
    this.status.signalStrength = 'None';
    this.status.rssi = 0;

    this.emit('connection', { ...this.status });
    this.emit('log', {
      type: 'system',
      message: 'Device disconnected',
      timestamp: Date.now()
    });

    return { success: true, message: 'Device disconnected' };
  }

  async reconnect() {
    await this.disconnect();
    return await this.connect();
  }

  async testDevice() {
    this.emit('log', {
      type: 'diagnostic',
      message: 'Running hardware self-test diagnostic...',
      timestamp: Date.now()
    });

    return new Promise(resolve => {
      setTimeout(() => {
        const result = {
          success: true,
          deviceName: this.status.deviceName,
          opticalSensor: 'OK (Array response 98%)',
          imuSensor: 'OK (6-Axis Calibrated)',
          batteryStatus: `${this.status.batteryLevel}% (Healthy)`,
          pingLatency: `${this.status.latencyMs}ms`,
          firmware: this.status.firmwareVersion,
          timestamp: new Date().toLocaleTimeString()
        };

        this.emit('log', {
          type: 'diagnostic',
          message: 'Self-test PASSED: All sensors nominal',
          detail: `Ping: ${result.pingLatency}, Optical: OK`,
          timestamp: Date.now()
        });

        resolve(result);
      }, 800);
    });
  }

  getStatus() {
    return { ...this.status };
  }

  getBattery() {
    return {
      level: this.status.batteryLevel,
      estimate: this.status.batteryEstimate,
      isCharging: this.status.isCharging
    };
  }

  getGesture() {
    return { ...this.currentGesture };
  }

  getCursorPosition() {
    return { ...this.cursorPosition };
  }

  setSensitivity(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.sensitivity = level;
      this.emit('log', {
        type: 'settings',
        message: `Gesture sensitivity set to ${level.toUpperCase()}`,
        timestamp: Date.now()
      });
    }
  }

  setSpeed(multiplier) {
    this.cursorSim.speed = 0.003 * multiplier;
    this.emit('log', {
      type: 'settings',
      message: `Cursor speed multiplier set to ${multiplier}x`,
      timestamp: Date.now()
    });
  }

  // Calibration Flow
  startCalibration() {
    this.calibrationState.active = true;
    this.calibrationState.currentStep = 1;
    this.calibrationState.steps.forEach((s, idx) => {
      s.completed = idx === 3 ? false : false;
      s.progress = 0;
    });

    this.emit('calibration', { ...this.calibrationState });
    this.emit('log', {
      type: 'calibration',
      message: 'Calibration wizard initiated (Step 1/4)',
      timestamp: Date.now()
    });
  }

  advanceCalibrationStep() {
    const cur = this.calibrationState.currentStep;
    if (cur < this.calibrationState.totalSteps) {
      this.calibrationState.steps[cur - 1].progress = 100;
      this.calibrationState.steps[cur - 1].completed = true;
      this.calibrationState.currentStep += 1;

      if (this.calibrationState.currentStep === 4) {
        this.calibrationState.steps[3].progress = 100;
        this.calibrationState.steps[3].completed = true;
      }

      this.emit('calibration', { ...this.calibrationState });
      this.emit('log', {
        type: 'calibration',
        message: `Calibration Step ${cur} verified -> Moving to Step ${this.calibrationState.currentStep}`,
        timestamp: Date.now()
      });
    }
  }

  stopCalibration() {
    this.calibrationState.active = false;
    this.emit('calibration', { ...this.calibrationState });
    this.emit('log', {
      type: 'calibration',
      message: 'Calibration wizard exited',
      timestamp: Date.now()
    });
  }

  // Demo Mode Manual Overrides (for testing & presentations)
  triggerManualGesture(gestureName, confidence = 97) {
    this.currentGesture = {
      gesture: gestureName,
      confidence: confidence,
      timestamp: Date.now(),
      rawPosition: { ...this.cursorPosition },
      imu: { pitch: 5.0, roll: -3.0, yaw: 12.0 }
    };
    this.cursorPosition.isDown = (gestureName === GESTURE_TYPES.PINCH || gestureName === GESTURE_TYPES.CLICK);

    this.emit('gesture', this.currentGesture);
    this.emit('log', {
      type: 'manual',
      message: `[Manual Override] ${gestureName} (${confidence}%)`,
      timestamp: this.currentGesture.timestamp
    });
  }

  triggerBatteryOverride(level) {
    this.status.batteryLevel = Math.max(0, Math.min(100, level));
    this.status.batteryEstimate = this.calculateRemainingTime(this.status.batteryLevel);
    this.emit('battery', {
      level: this.status.batteryLevel,
      estimate: this.status.batteryEstimate,
      isCharging: this.status.isCharging
    });
    this.emit('log', {
      type: 'battery',
      message: `Battery level updated to ${this.status.batteryLevel}%`,
      timestamp: Date.now()
    });
  }

  toggleAutoSimulation(enabled) {
    this.autoSimulation = enabled !== undefined ? enabled : !this.autoSimulation;
    this.emit('log', {
      type: 'system',
      message: `Auto-simulation ${this.autoSimulation ? 'Resumed' : 'Paused'}`,
      timestamp: Date.now()
    });
    return this.autoSimulation;
  }
}
