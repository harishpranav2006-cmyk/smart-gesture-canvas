import { soundService } from '../services/soundService.js';

/**
 * ActivityLog Component
 * Displays a live, timestamped event feed of hardware detections, user actions,
 * and system transitions, with category filters and clear action.
 */
export class ActivityLog {
  constructor(hardwareService) {
    this.hardware = hardwareService;
    this.listEl = document.getElementById('activity-event-list');
    this.clearBtn = document.getElementById('btn-clear-activity');
    this.filterChips = document.querySelectorAll('.filter-chip');

    this.events = [];
    this.activeFilter = 'all';

    this.init();
  }

  init() {
    this.bindEvents();
    this.bindHardwareEvents();
  }

  bindEvents() {
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        soundService.playKeyClick();
        this.events = [];
        this.render();
      });
    }

    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        soundService.playKeyClick();
        this.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.dataset.filter || 'all';
        this.render();
      });
    });
  }

  bindHardwareEvents() {
    this.hardware.on('log', logItem => {
      this.addEvent(logItem);
    });
  }

  addEvent(event) {
    const formatted = {
      type: event.type || 'system',
      message: event.message,
      detail: event.detail || '',
      time: new Date(event.timestamp || Date.now()).toLocaleTimeString()
    };

    this.events.unshift(formatted);
    if (this.events.length > 50) {
      this.events.pop();
    }

    this.render();
  }

  render() {
    if (!this.listEl) return;

    const filtered = this.activeFilter === 'all'
      ? this.events
      : this.events.filter(e => e.type === this.activeFilter);

    if (filtered.length === 0) {
      this.listEl.innerHTML = `
        <div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.88rem;">
          No events recorded yet. Perform an action or trigger a gesture.
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = filtered.map(item => `
      <div class="activity-item">
        <div class="activity-item-left">
          <span class="activity-item-time">${item.time}</span>
          <span class="activity-item-msg">${this.escapeHtml(item.message)}</span>
        </div>
        ${item.detail ? `<span class="activity-item-detail">${this.escapeHtml(item.detail)}</span>` : ''}
      </div>
    `).join('');
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
