/**
 * Interactive Wayfinder Component Controller ("Where Should I Go Next?")
 */
import { JOURNEY_DATA } from '../data/journeys.js';

export class WayfinderController {
  constructor(root = document) {
    this.root = root;
    this.tabs = this.root.querySelectorAll('.wayfinder-tab');
    this.badgeText = this.root.getElementById('journey-badge-text');
    this.title = this.root.getElementById('journey-title');
    this.desc = this.root.getElementById('journey-desc');
    this.deliverablesList = this.root.getElementById('journey-deliverables');
    this.entityTag = this.root.getElementById('journey-entity-tag');
    this.entityName = this.root.getElementById('journey-entity-name');
    this.ctaBtn = this.root.getElementById('journey-cta-btn');
    this.ctaLabel = this.root.getElementById('journey-cta-label');
    this.panel = this.root.getElementById('panel-wayfinder');
    this.onSelectIntent = null;
  }

  init(onSelectIntent) {
    this.onSelectIntent = onSelectIntent;
    if (!this.tabs.length || !this.panel) return;

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const journeyKey = tab.dataset.journey;
        this.selectJourney(journeyKey);
      });
    });

    if (this.ctaBtn) {
      this.ctaBtn.addEventListener('click', () => {
        const targetIntent = this.ctaBtn.dataset.intent;
        if (targetIntent && this.onSelectIntent) {
          this.onSelectIntent(targetIntent);
        }
      });
    }
  }

  selectJourney(journeyKey) {
    const data = JOURNEY_DATA[journeyKey];
    if (!data) return;

    // Update Tab Active States
    this.tabs.forEach((t) => {
      const isSelected = t.dataset.journey === journeyKey;
      t.classList.toggle('active', isSelected);
      t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    // Subtle cross-fade spring
    if (this.panel) {
      this.panel.style.opacity = '0.4';
      this.panel.style.transform = 'translateY(6px)';

      setTimeout(() => {
        if (this.badgeText) this.badgeText.textContent = data.badgeText;
        if (this.title) this.title.textContent = data.title;
        if (this.desc) this.desc.innerHTML = data.desc;
        if (this.entityTag) this.entityTag.textContent = data.entityTag;
        if (this.entityName) this.entityName.textContent = data.entityName;
        if (this.ctaLabel) this.ctaLabel.textContent = data.ctaLabel;
        if (this.ctaBtn) this.ctaBtn.dataset.intent = data.intent;

        if (this.deliverablesList) {
          this.deliverablesList.innerHTML = data.deliverables
            .map((item) => `<li class="deliverable-item"><span class="deliverable-check" aria-hidden="true">✓</span> ${item}</li>`)
            .join('');
        }

        this.panel.style.opacity = '1';
        this.panel.style.transform = 'translateY(0)';
      }, 100);
    }
  }
}

export function initWayfinder(onSelectIntent) {
  const controller = new WayfinderController(document);
  controller.init(onSelectIntent);
  return controller;
}
