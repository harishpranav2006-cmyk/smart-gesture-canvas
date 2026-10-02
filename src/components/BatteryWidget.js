/**
 * BatteryWidget Component
 * Visualizes battery percentage, health threshold colors, and remaining runtime estimation.
 */
export class BatteryWidget {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.barEl = document.getElementById('card-battery-bar');
    this.pctEl = document.getElementById('card-battery-pct');
    this.estimateEl = document.getElementById('card-battery-estimate');
    this.healthBadgeEl = document.getElementById('card-battery-health');

    this.bindEvents();
  }

  bindEvents() {
    this.hardware.on('battery', battery => {
      this.render(battery);
    });

    // Initial render
    this.render(this.hardware.getBattery());
  }

  render(battery) {
    const level = battery.level;
    if (this.pctEl) this.pctEl.textContent = `${level}%`;
    if (this.estimateEl) this.estimateEl.textContent = `Estimated Battery: ${battery.estimate}`;

    if (this.barEl) {
      this.barEl.style.width = `${level}%`;
      this.barEl.className = 'battery-level-bar';

      if (level >= 80) {
        this.barEl.classList.add('state-high');
        if (this.healthBadgeEl) {
          this.healthBadgeEl.textContent = 'Battery Optimal';
          this.healthBadgeEl.style.color = 'var(--color-success)';
        }
      } else if (level >= 50) {
        this.barEl.classList.add('state-mid');
        if (this.healthBadgeEl) {
          this.healthBadgeEl.textContent = 'Good Charge';
          this.healthBadgeEl.style.color = 'var(--color-warning)';
        }
      } else if (level >= 20) {
        this.barEl.classList.add('state-low');
        if (this.healthBadgeEl) {
          this.healthBadgeEl.textContent = 'Low Battery';
          this.healthBadgeEl.style.color = '#f97316';
        }
      } else {
        this.barEl.classList.add('state-critical');
        if (this.healthBadgeEl) {
          this.healthBadgeEl.textContent = 'Critical - Charge Soon';
          this.healthBadgeEl.style.color = 'var(--color-danger)';
        }
      }
    }
  }
}
