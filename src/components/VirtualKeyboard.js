import { soundService } from '../services/soundService.js';
import { speechService } from '../services/speechService.js';

/**
 * VirtualKeyboard Component
 * Assistive on-screen keyboard featuring large tactile keys, auto-scan mode,
 * predictive text chips, and text-to-speech synthesis.
 */
export class VirtualKeyboard {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.textDisplay = document.getElementById('kb-text-output');
    this.board = document.getElementById('virtual-kb-board');
    this.charCountEl = document.getElementById('kb-char-count');
    this.scanToggle = document.getElementById('kb-scan-toggle');
    this.sizeSelect = document.getElementById('kb-size-select');
    this.scanBanner = document.getElementById('kb-scan-banner');

    this.text = '';
    this.isShift = false;
    this.isSymbols = false;
    this.scanActive = false;
    this.scanIndex = 0;
    this.scanTimer = null;
    this.scanIntervalMs = 1200;

    this.allKeys = [];

    this.init();
  }

  init() {
    this.renderKeyboard();
    this.bindEvents();
    this.bindHardwareEvents();
  }

  getLayout() {
    if (this.isSymbols) {
      return [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        ['ABC', '-', '_', '=', '+', '[', ']', '{', '}', '⌫'],
        ['Clear', 'Speak', 'Space', '.', '↵']
      ];
    }

    const lettersRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const lettersRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const lettersRow3 = ['⇧ Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫ Backspace'];
    const lettersRow4 = ['123', 'Clear', 'Space', 'Speak', '↵ Enter'];

    if (!this.isShift) {
      return [
        lettersRow1.map(k => k.toLowerCase()),
        lettersRow2.map(k => k.toLowerCase()),
        ['⇧ Shift', ...lettersRow3.slice(1, -1).map(k => k.toLowerCase()), '⌫ Backspace'],
        lettersRow4
      ];
    }

    return [lettersRow1, lettersRow2, lettersRow3, lettersRow4];
  }

  renderKeyboard() {
    if (!this.board) return;
    this.board.innerHTML = '';
    this.allKeys = [];

    const layout = this.getLayout();

    layout.forEach((rowKeys) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      rowKeys.forEach(keyText => {
        const keyBtn = document.createElement('button');
        keyBtn.type = 'button';
        keyBtn.className = 'kb-key';
        keyBtn.textContent = keyText;
        keyBtn.setAttribute('aria-label', keyText);

        // Apply special sizing classes
        if (keyText.includes('Space')) keyBtn.classList.add('key-space');
        else if (keyText.includes('Backspace') || keyText.includes('⌫')) keyBtn.classList.add('key-wide');
        else if (keyText.includes('Shift') || keyText.includes('Enter') || keyText.includes('↵')) keyBtn.classList.add('key-wide', 'key-accent');
        else if (keyText === '123' || keyText === 'ABC' || keyText === 'Clear' || keyText === 'Speak') keyBtn.classList.add('key-accent');

        keyBtn.addEventListener('click', () => {
          this.handleKeyPress(keyText);
        });

        rowEl.appendChild(keyBtn);
        this.allKeys.push(keyBtn);
      });

      this.board.appendChild(rowEl);
    });

    if (this.scanActive) {
      this.highlightScanKey();
    }
  }

  bindEvents() {
    // Predictive Word Chips
    const chips = document.querySelectorAll('.prediction-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const word = chip.dataset.word || chip.textContent;
        soundService.playKeyClick();
        this.insertText((this.text.length > 0 && !this.text.endsWith(' ') ? ' ' : '') + word + ' ');
      });
    });

    // Copy Button
    const copyBtn = document.getElementById('btn-kb-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!this.text) return;
        soundService.playSuccess();
        navigator.clipboard.writeText(this.text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
      });
    }

    // Speak Button
    const speakBtn = document.getElementById('btn-kb-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        if (!this.text) return;
        soundService.playSuccess();
        speechService.speak(this.text);
      });
    }

    // Clear Button
    const clearBtn = document.getElementById('btn-kb-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.clearText();
      });
    }

    // Key Size Selector
    if (this.sizeSelect) {
      this.sizeSelect.addEventListener('change', e => {
        const size = e.target.value;
        this.setKeyboardSize(size);
      });
    }

    // Scan Mode Toggle
    if (this.scanToggle) {
      this.scanToggle.addEventListener('change', e => {
        this.toggleScanMode(e.target.checked);
      });
    }

    // Physical Spacebar triggers current scanned key if scan mode is active
    window.addEventListener('keydown', e => {
      if (this.scanActive && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        this.triggerCurrentScannedKey();
      }
    });
  }

  bindHardwareEvents() {
    // When simulated hardware emits a Click or Pinch gesture and Scan Mode is on, select key!
    this.hardware.on('gesture', gesture => {
      if (this.scanActive && (gesture.gesture === 'Click' || gesture.gesture === 'Pinch' || gesture.gesture === 'Double Tap')) {
        this.triggerCurrentScannedKey();
      }
    });
  }

  handleKeyPress(key) {
    soundService.playKeyClick();

    if (key.includes('Shift')) {
      this.isShift = !this.isShift;
      this.renderKeyboard();
      return;
    }

    if (key === '123') {
      this.isSymbols = true;
      this.renderKeyboard();
      return;
    }

    if (key === 'ABC') {
      this.isSymbols = false;
      this.renderKeyboard();
      return;
    }

    if (key.includes('Backspace') || key === '⌫') {
      this.text = this.text.slice(0, -1);
      this.updateDisplay();
      return;
    }

    if (key === 'Clear') {
      this.clearText();
      return;
    }

    if (key === 'Speak') {
      if (this.text) speechService.speak(this.text);
      return;
    }

    if (key.includes('Space')) {
      this.insertText(' ');
      return;
    }

    if (key.includes('Enter') || key === '↵') {
      this.insertText('\n');
      return;
    }

    // Normal Character
    this.insertText(key);

    // If shift was active for a single letter, revert back
    if (this.isShift) {
      this.isShift = false;
      this.renderKeyboard();
    }
  }

  insertText(str) {
    this.text += str;
    this.updateDisplay();
  }

  clearText() {
    this.text = '';
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.textDisplay) {
      this.textDisplay.innerHTML = `${this.escapeHtml(this.text)}<span class="keyboard-caret"></span>`;
    }
    if (this.charCountEl) {
      this.charCountEl.textContent = `${this.text.length} chars`;
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  setKeyboardSize(size) {
    if (!this.board) return;
    this.board.classList.remove('size-small', 'size-medium', 'size-large');
    this.board.classList.add(`size-${size}`);
  }

  toggleScanMode(enable) {
    this.scanActive = !!enable;
    if (this.scanBanner) {
      this.scanBanner.style.display = this.scanActive ? 'flex' : 'none';
    }

    if (this.scanActive) {
      this.scanIndex = 0;
      this.highlightScanKey();
      this.scanTimer = setInterval(() => {
        this.advanceScan();
      }, this.scanIntervalMs);
    } else {
      clearInterval(this.scanTimer);
      this.clearScanHighlights();
    }
  }

  advanceScan() {
    if (this.allKeys.length === 0) return;
    this.scanIndex = (this.scanIndex + 1) % this.allKeys.length;
    this.highlightScanKey();
  }

  highlightScanKey() {
    this.clearScanHighlights();
    const currentKey = this.allKeys[this.scanIndex];
    if (currentKey) {
      currentKey.classList.add('scan-highlighted');
    }
  }

  clearScanHighlights() {
    this.allKeys.forEach(k => k.classList.remove('scan-highlighted'));
  }

  triggerCurrentScannedKey() {
    const currentKey = this.allKeys[this.scanIndex];
    if (currentKey) {
      currentKey.click();
    }
  }
}
