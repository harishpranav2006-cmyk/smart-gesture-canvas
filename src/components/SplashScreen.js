/**
 * SplashScreen Component
 * Handles the opening presentation, logo animation, and smooth transition to the dashboard.
 */
export class SplashScreen {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.el = document.getElementById('splash-screen');
    this.progressBar = document.getElementById('splash-progress-bar');
    this.skipBtn = document.getElementById('splash-skip-btn');
    this.hasDismissed = false;

    this.init();
  }

  init() {
    if (!this.el) return;

    // Start progress bar animation
    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.style.width = '100%';
      }
    }, 100);

    // Skip button click handler
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.dismiss());
    }

    // Keyboard support: Enter or Space to skip
    const keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.dismiss();
        window.removeEventListener('keydown', keyHandler);
      }
    };
    window.addEventListener('keydown', keyHandler);

    // Automatic smooth transition after ~2.6 seconds
    this.timer = setTimeout(() => {
      this.dismiss();
      window.removeEventListener('keydown', keyHandler);
    }, 2600);
  }

  dismiss() {
    if (this.hasDismissed) return;
    this.hasDismissed = true;
    clearTimeout(this.timer);

    if (this.el) {
      this.el.classList.add('hidden');
      setTimeout(() => {
        if (this.el && this.el.parentNode) {
          this.el.style.display = 'none';
        }
        if (typeof this.onComplete === 'function') {
          this.onComplete();
        }
      }, 600);
    }
  }
}
