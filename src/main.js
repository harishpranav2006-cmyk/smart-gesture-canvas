import { getHardwareService } from './services/hardware/index.js';
import { soundService } from './services/soundService.js';
import { SplashScreen } from './components/SplashScreen.js';
import { Header } from './components/Header.js';
import { LiveGestureMonitor } from './components/LiveGestureMonitor.js';
import { DeviceStatusPanel } from './components/DeviceStatusPanel.js';
import { BatteryWidget } from './components/BatteryWidget.js';
import { DrawingCanvas } from './components/DrawingCanvas.js';
import { CursorControl } from './components/CursorControl.js';
import { VirtualKeyboard } from './components/VirtualKeyboard.js';
import { CalibrationWizard } from './components/CalibrationWizard.js';
import { AccessibilityPanel } from './components/AccessibilityPanel.js';
import { ActivityLog } from './components/ActivityLog.js';
import { UserProfile } from './components/UserProfile.js';
import { DemoDirector } from './components/DemoDirector.js';

class App {
  constructor() {
    this.hardware = getHardwareService();
    this.currentTab = 'overview';
    this.components = {};
  }

  init() {
    // 1. Initialize Splash Screen
    new SplashScreen(() => {
      this.onSplashComplete();
    });

    // 2. Initialize Core Components
    this.components.header = new Header(this.hardware);
    this.components.gestureMonitor = new LiveGestureMonitor(this.hardware);
    this.components.devicePanel = new DeviceStatusPanel(this.hardware);
    this.components.batteryWidget = new BatteryWidget(this.hardware);
    this.components.drawingCanvas = new DrawingCanvas(this.hardware);
    this.components.cursorControl = new CursorControl(this.hardware);
    this.components.virtualKeyboard = new VirtualKeyboard(this.hardware);
    this.components.calibration = new CalibrationWizard(this.hardware);
    this.components.a11y = new AccessibilityPanel(this.hardware);
    this.components.activityLog = new ActivityLog(this.hardware);
    this.components.userProfile = new UserProfile(this.components.a11y);
    this.components.demoDirector = new DemoDirector(this.hardware);

    // 3. Navigation & Tab Switching
    this.setupNavigation();

    // 4. Log initial startup
    this.hardware.emit('log', {
      type: 'system',
      message: 'Smart Gesture Canvas software platform initialized',
      detail: 'Demo Mode active',
      timestamp: Date.now()
    });
  }

  onSplashComplete() {
    soundService.playSuccess();
    // Announce to screen reader
    const sr = document.getElementById('sr-announcements');
    if (sr) {
      sr.textContent = 'Smart Gesture Canvas loaded. Showing Dashboard Overview.';
    }
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    const tabViews = document.querySelectorAll('.tab-view');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        soundService.playKeyClick();
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Quick feature cards on overview that open respective tabs
    const quickLinks = document.querySelectorAll('[data-nav-target]');
    quickLinks.forEach(link => {
      const handleNavigation = (e) => {
        if (e) {
          e.preventDefault();
        }
        soundService.playKeyClick();
        const target = link.dataset.navTarget || link.getAttribute('data-nav-target');
        this.switchTab(target);
      };

      link.addEventListener('click', handleNavigation);
      
      // Ensure any clicks on children (like the arrow) don't get lost
      Array.from(link.children).forEach(child => {
        child.style.pointerEvents = 'none';
      });
      
      // Make accessible feature cards interactive via keyboard
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNavigation(e);
        }
      });
    });

    // Brand logo clicks return to overview
    const brand = document.querySelector('.brand-section');
    if (brand) {
      brand.addEventListener('click', () => {
        this.switchTab('overview');
      });
    }
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update Nav Buttons
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update Tab Views
    const tabViews = document.querySelectorAll('.tab-view');
    tabViews.forEach(view => {
      const isTarget = view.id === `view-${tabId}`;
      view.classList.toggle('active-view', isTarget);
    });

    // If switching to paint canvas, trigger resize to ensure proper dimensions
    if (tabId === 'paint' && this.components.drawingCanvas) {
      setTimeout(() => {
        this.components.drawingCanvas.resizeCanvas();
      }, 50);
    }

    // Scroll to top of view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Announce view change
    const sr = document.getElementById('sr-announcements');
    if (sr) {
      sr.textContent = `Navigated to ${tabId.charAt(0).toUpperCase() + tabId.slice(1)} view`;
    }
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
