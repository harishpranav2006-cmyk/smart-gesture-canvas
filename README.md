# Smart Gesture Canvas ✋🎨

> **"Gesture-powered interaction for accessible computing."**
> An assistive hardware + software computing platform designed for individuals with motor disabilities, tremors, or limited upper-body mobility who experience difficulty using conventional mice and physical keyboards.

---

## 🌟 Project Overview

**Smart Gesture Canvas** enables users to interact with computing devices through optical hand gesture detection and inertial measurement (IMU) telemetry. Users can:
* **Paint & Draw** on a digital canvas using natural pinch and hover gestures.
* **Control the Cursor** across interactive targets with adjustable sensitivity and tremor dampening.
* **Type via an Assistive Virtual Keyboard** with high-contrast oversized keys, automated scanning switch mode, word predictions, and native speech synthesis.
* **Calibrate Sensor Boundaries** using a guided 4-step interactive wizard.
* **Monitor Device Telemetry** including battery discharge curves, signal RSSI, and sensor sampling rates.

---

## 🏗️ Architecture & Development Scope

### Current Status: Software Dashboard Complete
As per team separation of responsibilities:
- **Software / Dashboard:** Fully implemented, highly polished, accessible, and demonstrable.
- **Hardware / Device:** Currently being developed separately by the hardware team member.

To ensure the software can be demonstrated and tested **immediately without waiting for physical hardware**, the application uses a decoupled **Mock Hardware Simulation Layer**:

```
┌────────────────────────────────────────────────────────┐
│                      Dashboard UI                      │
│ (Paint, Keyboard, Cursor, Calibration, Telemetry, Log) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              Hardware Service Interface                │
│            (src/services/hardware/types.js)            │
└─────────────┬────────────────────────────┬─────────────┘
              │ (Current Demo Mode)        │ (Future Integration)
┌─────────────▼────────────┐ ┌─────────────▼────────────┐
│   MockHardwareService    │ │   RealHardwareService    │
│  (Autonomous Telemetry,  │ │  (Web Bluetooth / Serial │
│   Lissajous Cursor,      │ │   WebSocket GATT Client) │
│   Presenter Controls)    │ │                          │
└──────────────────────────┘ └──────────────────────────┘
```

---

## 🔌 Hardware Team Integration Guide

When the physical gesture controller hardware (e.g. ESP32 / Arduino / Optical Gesture Sensor / 6-DoF IMU) is ready:

1. Open [`src/services/hardware/types.js`](file:///d:/COMMUNITY%20CONNECT/src/services/hardware/types.js) to review the exact event signatures and telemetry format.
2. Open [`src/services/hardware/RealHardwareServicePlaceholder.js`](file:///d:/COMMUNITY%20CONNECT/src/services/hardware/RealHardwareServicePlaceholder.js) and implement your physical connection:
   - **Web Bluetooth API:** Connect to device GATT characteristic:
     ```javascript
     const device = await navigator.bluetooth.requestDevice({
       filters: [{ namePrefix: 'SmartGesture' }],
       optionalServices: ['battery_service', 'gesture_service_uuid']
     });
     ```
   - **Web Serial API:** Stream 115200 baud UART packets:
     ```javascript
     const port = await navigator.serial.requestPort();
     await port.open({ baudRate: 115200 });
     ```
   - **WebSocket / Local Bridge:** Connect to local daemon:
     ```javascript
     const socket = new WebSocket('ws://localhost:8080/gestures');
     ```
3. In [`src/services/hardware/index.js`](file:///d:/COMMUNITY%20CONNECT/src/services/hardware/index.js), switch `isMockMode = false`.
4. **No frontend UI changes will be required.** The entire dashboard will automatically receive live hardware data.

---

## 🚀 Key Implemented Features

### 1. Splash Screen & Brand Identity
* Centered vector brand logo ([`src/assets/logo.svg`](file:///d:/COMMUNITY%20CONNECT/src/assets/logo.svg)) featuring stylized assistive hand geometry, dynamic canvas wave, and radar sensor pulses.
* Subtle entrance scaling, glowing pulse ring, and loading progress bar.
* Title and tagline with accessible "Skip to Dashboard [Enter]" button.
* Auto-transitions seamlessly into the main application.

### 2. Main Dashboard & Top Status Summary
* Persistent branding and mode badges.
* Live status strip:
  - **Connection Chip:** `● Connected` / `Connecting...` / `Disconnected`.
  - **Battery Widget:** Percentage and 4-tier visual threshold states (80–100%, 50–79%, 20–49%, <20%) with estimated runtime (`6h 24m`).
  - **Live Gesture Chip:** E.g., `Open Palm (96%)`.
  - **Demo Mode Badge:** Clear indicator showing simulated telemetry is active.

### 3. Paint & Draw Tool
* High-DPI HTML5 Canvas (`#drawing-canvas`) with smooth brush and eraser tools.
* Brush size slider (2px to 48px) with real-time size circle preview.
* Curated accessible color palette swatches + custom color picker.
* Undo & Redo history buffer (retaining canvas states).
* Direct pointer drawing (mouse, stylus, touch) AND simulated gesture drawing (Pinch to draw, Open Palm to hover reticle, Fist to pause).
* Clear Canvas and Save/Export high-resolution PNG.

### 4. Gesture Cursor Control Arena
* Full-sized interactive playground with coordinate grid lines and center radar marks.
* 4 interactive collision target bubbles (`Hover Zone`, `Single Click`, `Double Tap`, `Assistive Target`) providing hit feedback and audio chimes.
* Gesture sensitivity slider (Low, Medium, High) and speed multiplier slider (0.5x to 2.5x).
* Action mode toggles: `Click`, `Double Click`, `Drag Mode`, `Scroll Mode`.
* Live coordinates (X, Y), confidence score, and detected gesture telemetry.

### 5. Assistive Virtual Keyboard
* High-contrast QWERTY layout with oversized keys.
* Text Preview Display with live blinking caret, character counter, and action buttons (`🔊 Speak Text`, `📋 Copy`, `🗑️ Clear`).
* **Keyboard Scan Mode:** Automated key-by-key cycling with high-visibility glowing yellow highlight for switch/single-gesture input. Triggered by spacebar, click, or simulated pinch gesture!
* Predictive word suggestions: `"Hello"`, `"Thank you"`, `"Yes"`, `"No"`, `"Please help"`, `"I need water"`, `"Goodbye"`.
* Key Size selector: `Small`, `Medium`, `Large`.
* Native Text-to-Speech synthesis via browser Web Speech API.

### 6. Device Connection & Battery Telemetry
* Dedicated device card displaying device name, firmware version, signal RSSI (-42 dBm), and sensor array specs (64-pixel IR optical matrix + 6-DoF IMU).
* Interactive buttons: `Connect Device`, `Disconnect`, `Reconnect`, and `⚡ Test Device`.
* Diagnostic self-test suite testing roundtrip latency and sensor calibration.

### 7. 4-Step Calibration Wizard
* **Step 1:** Neutral Baseline (ambient light & resting posture calibration).
* **Step 2:** Spatial Boundary Limits (horizontal and vertical sweeps).
* **Step 3:** Pinch / Click Velocity Threshold (click trigger profiling).
* **Step 4:** Calibration Succeeded (finalized 98.4% accuracy profile summary).

### 8. Accessibility Settings & Theming
* **Interface Scale:** Small (88%), Medium (100%), Large (116%).
* **High Contrast Mode:** Ultra-accessible pure black and vibrant yellow/white palette (`.theme-high-contrast`).
* **Reduced Motion:** Disables keyframe animations for vestibular comfort.
* **Button Sizing:** Normal, Large (+30%), Extra Large (+60%).
* **Sound Feedback:** Synthesized gentle auditory cues via Web Audio API (no external audio files required).
* **Speech Synthesis:** On/off toggle for vocalizing text.

### 9. Activity / Gesture History Log
* Real-time timestamped event stream capturing detections, connections, and user actions.
* Category filtering (`All Events`, `Gestures`, `System`, `Diagnostics`).
* Clear log action.

### 10. Personalized User Profile
* Profile display without requiring personal information.
* One-click accessibility presets: `Standard Assistive`, `Tremor Compensation`, `Single-Gesture Scanning`.

### 11. Presenter's "Demo Director" Floating Bar
* Docked at the bottom of the screen for presentations, college reviews, and community demos.
* Instant manual triggers for all gestures: `✋ Open Palm`, `🤏 Pinch`, `✊ Fist`, `👉 Point`, `👈 Swipe L`, `👉 Swipe R`, `✌️ Double Tap`, `👆 Click`.
* Battery scenario triggers: `🔋 87%` and `🪫 15% (Critical Warning Test)`.
* Toggle simulation auto-cycling on/off.

---

## 💻 How to Run Locally

### Requirements
* Node.js v18+ (tested on Node v24)
* Modern web browser (Chrome, Edge, Firefox, Safari)

### Installation & Launch
```bash
# 1. Clone repository or navigate to workspace
cd "d:/COMMUNITY CONNECT"

# 2. Install dependencies (Vite)
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Building for Production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
d:/COMMUNITY CONNECT/
├── index.html                     # Semantic HTML5 application entry
├── package.json                   # Project scripts and dependencies
├── README.md                      # Comprehensive documentation & hardware guide
├── dist/                          # Production build output
├── src/
│   ├── main.js                    # Core application orchestrator & router
│   ├── assets/
│   │   └── logo.svg               # Vector brand logo
│   ├── styles/
│   │   ├── main.css               # Design system tokens & high-contrast themes
│   │   ├── components.css         # Reusable cards, buttons, widgets
│   │   ├── splash.css             # Opening splash screen animations
│   │   ├── canvas.css             # Drawing canvas & HUD overlay styling
│   │   ├── keyboard.css           # Virtual keyboard & scan mode styling
│   │   ├── cursor.css             # Cursor control arena styling
│   │   └── calibration.css        # 4-step calibration wizard styling
│   ├── services/
│   │   ├── soundService.js        # Web Audio API synthesized sound cues
│   │   ├── speechService.js       # Web Speech API text-to-speech
│   │   ├── storageService.js      # LocalStorage persistence
│   │   └── hardware/
│   │       ├── types.js           # Hardware interface specification
│   │       ├── MockHardwareService.js # Full simulation engine
│   │       ├── RealHardwareServicePlaceholder.js # Integration template for hardware dev
│   │       └── index.js           # Hardware service factory
│   └── components/
│       ├── SplashScreen.js        # Splash screen controller
│       ├── Header.js              # Live header status chips & battery bar
│       ├── LiveGestureMonitor.js  # Live visual gesture & IMU telemetry panel
│       ├── DeviceStatusPanel.js   # Device connect/disconnect & self-test suite
│       ├── BatteryWidget.js       # Battery health states & runtime estimation
│       ├── DrawingCanvas.js       # HTML5 paint & draw tool
│       ├── CursorControl.js       # Interactive cursor arena with target bubbles
│       ├── VirtualKeyboard.js     # Assistive QWERTY with scanning mode & speech
│       ├── CalibrationWizard.js   # 4-step guided calibration flow
│       ├── AccessibilityPanel.js  # Scale, contrast, motion, button sizing
│       ├── ActivityLog.js         # Real-time event log with filters
│       ├── UserProfile.js         # Accessibility presets & user preferences
│       └── DemoDirector.js        # Presenter's floating override toolbar
```

---

## ♿ Accessibility Standards
This project follows **WCAG 2.1 AAA** guidance:
* All interactive elements have visible focus rings (`:focus-visible`).
* Keyboard navigation supported throughout (`Tab`, `Space`, `Enter`, `Esc`).
* Screen reader live updates via `aria-live="polite"` region.
* Contrast ratios exceed 4.5:1 for normal text and 3:1 for graphical UI elements; High Contrast mode provides >14:1 contrast.
* Reduced motion supported natively and via manual toggle.
