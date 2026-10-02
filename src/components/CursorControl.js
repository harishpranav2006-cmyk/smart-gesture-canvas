import { soundService } from '../services/soundService.js';

/**
 * CursorControl Component
 * Interactive gesture-based cursor control arena with target bubbles, mode selectors,
 * speed/sensitivity adjustments, and live telemetry readout.
 */
export class CursorControl {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.arena = document.getElementById('cursor-control-arena');
    this.cursorEl = document.getElementById('simulated-cursor');
    this.hudGesture = document.getElementById('cursor-hud-gesture');
    this.hudConfidence = document.getElementById('cursor-hud-confidence');
    this.hudCoords = document.getElementById('cursor-hud-coords');
    this.hudMode = document.getElementById('cursor-hud-mode');

    this.sensSlider = document.getElementById('cursor-sens-slider');
    this.speedSlider = document.getElementById('cursor-speed-slider');
    this.sensVal = document.getElementById('cursor-sens-val');
    this.speedVal = document.getElementById('cursor-speed-val');

    this.currentMode = 'Click'; // 'Click' | 'Double Click' | 'Drag' | 'Scroll'
    this.speedMultiplier = 1.0;
    this.targetsHit = 0;

    this.init();
  }

  init() {
    this.bindEvents();
    this.bindHardwareEvents();
    this.setupTargets();
  }

  bindEvents() {
    // Mode Buttons
    const modeBtns = document.querySelectorAll('.cursor-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        soundService.playKeyClick();
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentMode = btn.dataset.mode;
        if (this.hudMode) this.hudMode.textContent = this.currentMode;
      });
    });

    // Sensitivity Slider
    if (this.sensSlider) {
      this.sensSlider.addEventListener('input', e => {
        const val = e.target.value;
        const labels = { '1': 'Low', '2': 'Medium', '3': 'High' };
        const label = labels[val] || 'Medium';
        if (this.sensVal) this.sensVal.textContent = label;
        this.hardware.setSensitivity(label.toLowerCase());
      });
    }

    // Speed Slider
    if (this.speedSlider) {
      this.speedSlider.addEventListener('input', e => {
        this.speedMultiplier = parseFloat(e.target.value);
        if (this.speedVal) this.speedVal.textContent = `${this.speedMultiplier.toFixed(1)}x`;
      });
    }

    // Allow user to click directly in the arena to test manual pointer interaction as well
    if (this.arena) {
      this.arena.addEventListener('pointerdown', e => {
        const rect = this.arena.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        this.hardware.cursorPosition.x = x;
        this.hardware.cursorPosition.y = y;
        this.triggerClickAction(e.clientX - rect.left, e.clientY - rect.top);
      });
    }
  }

  setupTargets() {
    if (!this.arena) return;

    // Create 4 interactive target bubbles in arena
    const targets = [
      { id: 't1', label: 'Hover Zone', x: 22, y: 30, action: 'hover' },
      { id: 't2', label: 'Single Click', x: 74, y: 25, action: 'click' },
      { id: 't3', label: 'Double Tap', x: 30, y: 72, action: 'double-click' },
      { id: 't4', label: 'Assistive Target', x: 76, y: 70, action: 'dwell' }
    ];

    targets.forEach(t => {
      const bubble = document.createElement('div');
      bubble.className = 'arena-target-bubble';
      bubble.id = `target-${t.id}`;
      bubble.style.left = `${t.x}%`;
      bubble.style.top = `${t.y}%`;
      bubble.innerHTML = `<span>🎯</span><span>${t.label}</span>`;
      bubble.dataset.action = t.action;

      bubble.addEventListener('click', () => {
        this.handleTargetHit(bubble);
      });

      this.arena.appendChild(bubble);
    });
  }

  handleTargetHit(bubble) {
    bubble.classList.add('clicked');
    soundService.playSuccess();
    this.targetsHit++;
    setTimeout(() => {
      bubble.classList.remove('clicked');
    }, 600);
  }

  bindHardwareEvents() {
    // Listen to cursor position
    this.hardware.on('cursor', pos => {
      this.renderCursor(pos);
    });

    // Listen to gestures
    this.hardware.on('gesture', gesture => {
      if (this.hudGesture) this.hudGesture.textContent = gesture.gesture;
      if (this.hudConfidence) this.hudConfidence.textContent = `${gesture.confidence}%`;

      // Trigger click animation if gesture is click or pinch
      if (gesture.gesture === 'Click' || gesture.gesture === 'Pinch') {
        if (this.cursorEl) {
          this.cursorEl.classList.add('active-click');
          setTimeout(() => {
            if (this.cursorEl) this.cursorEl.classList.remove('active-click');
          }, 300);
        }
      }
    });
  }

  renderCursor(pos) {
    if (!this.arena || !this.cursorEl) return;

    const rect = this.arena.getBoundingClientRect();
    const pixelX = pos.x * rect.width;
    const pixelY = pos.y * rect.height;

    this.cursorEl.style.left = `${pixelX}px`;
    this.cursorEl.style.top = `${pixelY}px`;

    if (this.hudCoords) {
      this.hudCoords.textContent = `X: ${Math.round(pixelX)}, Y: ${Math.round(pixelY)}`;
    }

    // Check collision with target bubbles
    const targets = this.arena.querySelectorAll('.arena-target-bubble');
    targets.forEach(t => {
      const tRect = t.getBoundingClientRect();
      const inX = (rect.left + pixelX >= tRect.left && rect.left + pixelX <= tRect.right);
      const inY = (rect.top + pixelY >= tRect.top && rect.top + pixelY <= tRect.bottom);

      if (inX && inY) {
        t.classList.add('hovered');
        if (pos.isDown) {
          this.handleTargetHit(t);
        }
      } else {
        t.classList.remove('hovered');
      }
    });
  }

  triggerClickAction(x, y) {
    soundService.playKeyClick();
    if (this.cursorEl) {
      this.cursorEl.classList.add('active-click');
      setTimeout(() => {
        if (this.cursorEl) this.cursorEl.classList.remove('active-click');
      }, 250);
    }
  }
}
