import { soundService } from '../services/soundService.js';

/**
 * DrawingCanvas Component
 * Interactive accessible drawing tool supporting direct pointer input and simulated gesture tracking.
 */
export class DrawingCanvas {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.canvas = document.getElementById('drawing-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.container = document.querySelector('.canvas-main-stage');
    this.reticle = document.getElementById('gesture-hand-reticle');
    this.gestureHudText = document.getElementById('canvas-hud-gesture');
    this.brushSizeSlider = document.getElementById('brush-size-slider');
    this.brushSizeVal = document.getElementById('brush-size-val');
    this.brushPreviewDot = document.getElementById('brush-preview-dot');

    this.currentTool = 'brush'; // 'brush' | 'eraser'
    this.currentColor = '#6366f1';
    this.brushSize = 8;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    // Gesture simulation drawing
    this.gestureDrawingActive = true;
    this.lastGesturePos = null;

    // Undo / Redo history stacks
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 20;

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.saveState();
    this.bindEvents();
    this.bindHardwareEvents();
  }

  resizeCanvas() {
    if (!this.container || !this.canvas) return;

    // Save existing drawing
    let tempImage = null;
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      tempImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Clear white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    if (tempImage) {
      this.ctx.putImageData(tempImage, 0, 0);
    }
  }

  bindEvents() {
    // Pointer Events (Mouse / Touch / Stylus)
    this.canvas.addEventListener('pointerdown', e => this.startDrawing(e));
    this.canvas.addEventListener('pointermove', e => this.draw(e));
    window.addEventListener('pointerup', () => this.stopDrawing());
    this.canvas.addEventListener('pointerleave', () => this.stopDrawing());

    // Tools Buttons
    const brushBtn = document.getElementById('tool-brush');
    const eraserBtn = document.getElementById('tool-eraser');

    if (brushBtn) {
      brushBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.setTool('brush');
        brushBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
      });
    }

    if (eraserBtn) {
      eraserBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.setTool('eraser');
        eraserBtn.classList.add('active');
        if (brushBtn) brushBtn.classList.remove('active');
      });
    }

    // Brush Size Slider
    if (this.brushSizeSlider) {
      this.brushSizeSlider.addEventListener('input', e => {
        this.brushSize = parseInt(e.target.value, 10);
        if (this.brushSizeVal) this.brushSizeVal.textContent = `${this.brushSize}px`;
        if (this.brushPreviewDot) {
          this.brushPreviewDot.style.width = `${Math.min(30, this.brushSize)}px`;
          this.brushPreviewDot.style.height = `${Math.min(30, this.brushSize)}px`;
        }
      });
    }

    // Color Swatches
    const swatches = document.querySelectorAll('.color-swatch-btn');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        soundService.playKeyClick();
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.currentColor = swatch.dataset.color;
        this.setTool('brush');
        if (brushBtn) brushBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
        if (this.brushPreviewDot) this.brushPreviewDot.style.background = this.currentColor;
      });
    });

    // Custom Color Picker
    const customColorInput = document.getElementById('custom-color-input');
    if (customColorInput) {
      customColorInput.addEventListener('input', e => {
        this.currentColor = e.target.value;
        swatches.forEach(s => s.classList.remove('active'));
        this.setTool('brush');
        if (brushBtn) brushBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
        if (this.brushPreviewDot) this.brushPreviewDot.style.background = this.currentColor;
      });
    }

    // Action Buttons: Undo, Redo, Clear, Save, Reset
    const undoBtn = document.getElementById('btn-canvas-undo');
    const redoBtn = document.getElementById('btn-canvas-redo');
    const clearBtn = document.getElementById('btn-canvas-clear');
    const saveBtn = document.getElementById('btn-canvas-save');
    const resetBtn = document.getElementById('btn-canvas-reset');

    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearCanvas());
    if (saveBtn) saveBtn.addEventListener('click', () => this.exportDrawing());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetCanvas());

    // Toggle Gesture Simulation Drawing
    const toggleSimBtn = document.getElementById('btn-toggle-gesture-draw');
    if (toggleSimBtn) {
      toggleSimBtn.addEventListener('click', () => {
        this.gestureDrawingActive = !this.gestureDrawingActive;
        toggleSimBtn.textContent = this.gestureDrawingActive ? 'Gesture Mode: ON' : 'Gesture Mode: OFF';
        toggleSimBtn.classList.toggle('active', this.gestureDrawingActive);
        soundService.playKeyClick();
      });
    }
  }

  bindHardwareEvents() {
    // Track simulated cursor position & draw if in Pinch or Click state
    this.hardware.on('cursor', pos => {
      this.updateGestureOverlay(pos);
    });

    this.hardware.on('gesture', gesture => {
      if (this.gestureHudText) {
        this.gestureHudText.textContent = `${gesture.gesture} (${gesture.confidence}%)`;
      }
      if (this.reticle) {
        this.reticle.classList.toggle('reticle-pinch', gesture.gesture === 'Pinch' || gesture.gesture === 'Click');
      }
    });
  }

  updateGestureOverlay(pos) {
    if (!this.container || !this.reticle) return;

    const rect = this.container.getBoundingClientRect();
    const pixelX = pos.x * rect.width;
    const pixelY = pos.y * rect.height;

    this.reticle.style.left = `${pixelX}px`;
    this.reticle.style.top = `${pixelY}px`;

    // If gesture drawing is active and state is Pinch/Click, draw line
    if (this.gestureDrawingActive && pos.isDown) {
      if (!this.lastGesturePos) {
        this.lastGesturePos = { x: pixelX, y: pixelY };
        this.saveState();
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.currentTool === 'eraser' ? '#ffffff' : this.currentColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.moveTo(this.lastGesturePos.x, this.lastGesturePos.y);
      this.ctx.lineTo(pixelX, pixelY);
      this.ctx.stroke();

      this.lastGesturePos = { x: pixelX, y: pixelY };
    } else {
      this.lastGesturePos = null;
    }
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  startDrawing(e) {
    this.isDrawing = true;
    this.saveState();
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.strokeStyle = this.currentTool === 'eraser' ? '#ffffff' : this.currentColor;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
    }
  }

  saveState() {
    if (!this.ctx || !this.canvas) return;
    if (this.undoStack.length >= this.maxHistory) {
      this.undoStack.shift();
    }
    const state = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(state);
    this.redoStack = []; // Clear redo on new action
  }

  undo() {
    if (this.undoStack.length > 1) {
      soundService.playKeyClick();
      const current = this.undoStack.pop();
      this.redoStack.push(current);
      const prev = this.undoStack[this.undoStack.length - 1];
      this.ctx.putImageData(prev, 0, 0);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      soundService.playKeyClick();
      const state = this.redoStack.pop();
      this.undoStack.push(state);
      this.ctx.putImageData(state, 0, 0);
    }
  }

  clearCanvas() {
    soundService.playKeyClick();
    this.saveState();
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  resetCanvas() {
    this.clearCanvas();
    this.drawWelcomeSketch();
    soundService.playSuccess();
  }

  drawWelcomeSketch() {
    // Draw an artistic decorative greeting wave
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    this.ctx.save();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#6366f1';

    // Draw stylized smiling wave
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 60, 0.2 * Math.PI, 0.8 * Math.PI);
    this.ctx.stroke();

    // Eyes
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.beginPath();
    this.ctx.arc(cx - 30, cy - 20, 8, 0, 2 * Math.PI);
    this.ctx.arc(cx + 30, cy - 20, 8, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.restore();
  }

  exportDrawing() {
    soundService.playSuccess();
    const link = document.createElement('a');
    link.download = `smart-gesture-canvas-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}
