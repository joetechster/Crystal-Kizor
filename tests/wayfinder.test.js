import { describe, it, expect, beforeEach } from 'vitest';
import { WayfinderController } from '../src/components/Wayfinder.js';

describe('WayfinderController Component Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="panel-wayfinder" class="wayfinder-result-card">
        <div class="result-details">
          <div class="result-badge">
            <span id="journey-badge-text">Direct Client Commission</span>
          </div>
          <h3 class="result-title" id="journey-title">Initial Title</h3>
          <p class="result-description" id="journey-desc">Initial Desc</p>
          <ul class="result-deliverables" id="journey-deliverables"></ul>
        </div>
        <div class="result-destination">
          <span class="dest-subtitle" id="journey-entity-tag">Primary Practice</span>
          <div class="dest-name" id="journey-entity-name">Studio COKA & ELEvated</div>
          <button type="button" id="journey-cta-btn" data-intent="architecture">
            <span id="journey-cta-label">Initiate Commission Inquiry</span>
          </button>
        </div>
      </div>
      <div class="wayfinder-tabs">
        <button type="button" class="wayfinder-tab active" data-journey="clients" aria-selected="true">Clients</button>
        <button type="button" class="wayfinder-tab" data-journey="speaking" aria-selected="false">Curators</button>
        <button type="button" class="wayfinder-tab" data-journey="tea" aria-selected="false">Practitioners</button>
        <button type="button" class="wayfinder-tab" data-journey="civic" aria-selected="false">Civic Partners</button>
      </div>
    `;
  });

  it('initializes and selects another journey tab on click', async () => {
    let routedIntent = null;
    const controller = new WayfinderController(document);
    controller.init((intent) => {
      routedIntent = intent;
    });

    const speakingTab = document.querySelector('.wayfinder-tab[data-journey="speaking"]');
    const clientsTab = document.querySelector('.wayfinder-tab[data-journey="clients"]');

    expect(clientsTab.classList.contains('active')).toBe(true);

    // Click Speaking tab
    speakingTab.click();

    // Verify active class and aria-selected state
    expect(speakingTab.classList.contains('active')).toBe(true);
    expect(speakingTab.getAttribute('aria-selected')).toBe('true');
    expect(clientsTab.classList.contains('active')).toBe(false);

    // Wait for the crossfade timeout
    await new Promise((r) => setTimeout(r, 120));

    expect(document.getElementById('journey-title').textContent).toContain('Keynotes on African Cities');
    expect(document.getElementById('journey-entity-tag').textContent).toBe('Global Voice');
    expect(document.getElementById('journey-cta-btn').dataset.intent).toBe('speaking');

    // Test clicking CTA button triggers routing callback
    document.getElementById('journey-cta-btn').click();
    expect(routedIntent).toBe('speaking');
  });

  it('renders deliverables list items with checkmarks when switching to TEA', async () => {
    const controller = new WayfinderController(document);
    controller.init();

    const teaTab = document.querySelector('.wayfinder-tab[data-journey="tea"]');
    teaTab.click();

    await new Promise((r) => setTimeout(r, 120));

    const deliverables = document.querySelectorAll('#journey-deliverables li');
    expect(deliverables.length).toBe(3);
    expect(deliverables[0].textContent).toContain('Practice Mastery');
  });
});
