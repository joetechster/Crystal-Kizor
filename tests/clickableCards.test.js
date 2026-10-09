import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickableCardsController, initClickableCards } from '../src/components/ClickableCards.js';

describe('ClickableCardsController Component Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <!-- Showcase Project Cards -->
      <div class="projects-grid">
        <article class="project-card" data-clickable="true" data-project="nature-home">
          <div class="project-media-wrap">
            <img src="/assets/project-nature-home-facade.webp" alt="Nature Home">
          </div>
          <div class="project-info">
            <h3 class="project-title">The Nature Home Residence</h3>
            <p class="lead-p">A contemporary tropical residence celebrating natural tree canopies.</p>
            <div class="project-specs">
              <div class="spec-item">Typology: Residential</div>
            </div>
            <div class="project-action-wrap">
              <button type="button" class="btn btn-secondary open-project-trigger" data-project="nature-home">
                Explore Nature Home Gallery
              </button>
            </div>
          </div>
        </article>

        <article class="project-card" data-clickable="true" data-project="elevated-craft">
          <div class="project-info">
            <h3 class="project-title">ELEvated Timber Craft</h3>
          </div>
        </article>
      </div>

      <!-- Bento Cards with Secondary Actions & Intent Routing -->
      <div class="bento-grid-2">
        <!-- Studio COKA with secondary Commission badge -->
        <div class="bento-card" data-clickable="true" data-project="nature-home">
          <div class="bento-card-media">
            <img src="/assets/project-nature-home-facade.webp" alt="Studio COKA">
          </div>
          <div class="bento-card-body">
            <span class="bento-entity-focus">Studio COKA</span>
            <h4 class="bento-entity-name">Thoughtful, Climate-Responsive Architecture</h4>
            <p class="bento-entity-desc">Studio COKA engineers buildings that breathe naturally.</p>
          </div>
          <div class="bento-card-footer">
            <button type="button" class="link-inspect open-project-trigger" data-project="nature-home">Inspect</button>
            <a href="#connect" class="mini-tag select-intent-trigger card-secondary-action" data-intent="architecture">Commission</a>
          </div>
        </div>

        <!-- The Effective Architect (TEA) with Intent Routing -->
        <div class="bento-card" data-clickable="true" data-intent="tea">
          <div class="bento-card-body">
            <h4 class="bento-entity-name">Professional Education & Media Platform</h4>
            <p class="bento-entity-desc">TEA equips architects and designers.</p>
          </div>
          <div class="bento-card-footer">
            <a href="#connect" class="link-inspect select-intent-trigger" data-intent="tea">Explore TEA Programs</a>
          </div>
        </div>
      </div>
    `;
  });

  it('sets accessibility attributes tabindex="0" and role="button" on all cards', () => {
    const onOpenProject = vi.fn();
    const onSelectIntent = vi.fn();
    const controller = new ClickableCardsController(document, { onOpenProject, onSelectIntent });
    controller.init();

    const cards = document.querySelectorAll('.project-card, .bento-card[data-clickable="true"]');
    expect(cards.length).toBe(4);
    cards.forEach((card) => {
      expect(card.getAttribute('tabindex')).toBe('0');
      expect(card.getAttribute('role')).toBe('button');
    });
  });

  it('triggers onOpenProject when clicking anywhere on a project card (title, lead text, specs, card background)', () => {
    const onOpenProject = vi.fn();
    const controller = new ClickableCardsController(document, { onOpenProject });
    controller.init();

    const card = document.querySelector('.project-card[data-project="nature-home"]');
    const title = card.querySelector('.project-title');
    const lead = card.querySelector('.lead-p');
    const specs = card.querySelector('.project-specs');

    // Click on title
    title.click();
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);

    // Click on lead text
    lead.click();
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);

    // Click on specs
    specs.click();
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);

    // Click on card background itself
    card.click();
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);
  });

  it('uses offset index 7 for elevated-craft project galleries', () => {
    const onOpenProject = vi.fn();
    const controller = new ClickableCardsController(document, { onOpenProject });
    controller.init();

    const elevatedCard = document.querySelector('.project-card[data-project="elevated-craft"]');
    elevatedCard.click();
    expect(onOpenProject).toHaveBeenCalledWith('elevated-craft', 7);
  });

  it('triggers onSelectIntent when clicking anywhere on an intent-routed bento card', () => {
    const onSelectIntent = vi.fn();
    const controller = new ClickableCardsController(document, { onSelectIntent });
    controller.init();

    const teaCard = document.querySelector('.bento-card[data-intent="tea"]');
    const teaTitle = teaCard.querySelector('.bento-entity-name');

    // Click title
    teaTitle.click();
    expect(onSelectIntent).toHaveBeenCalledWith('tea');

    // Click card container
    teaCard.click();
    expect(onSelectIntent).toHaveBeenCalledWith('tea');
  });

  it('does NOT trigger onOpenProject when clicking secondary action button (.card-secondary-action)', () => {
    const onOpenProject = vi.fn();
    const onSelectIntent = vi.fn();
    const controller = new ClickableCardsController(document, { onOpenProject, onSelectIntent });
    controller.init();

    const secondaryBtn = document.querySelector('.card-secondary-action');
    secondaryBtn.click();

    expect(onOpenProject).not.toHaveBeenCalled();
  });

  it('does NOT trigger card action when user has selected / highlighted text (copy protection)', () => {
    const onOpenProject = vi.fn();
    const controller = new ClickableCardsController(document, { onOpenProject });
    controller.init();

    // Mock active text selection
    window.getSelection = vi.fn().mockReturnValue({
      toString: () => 'The Nature Home Residence'
    });

    const card = document.querySelector('.project-card[data-project="nature-home"]');
    card.click();

    expect(onOpenProject).not.toHaveBeenCalled();

    // Reset selection
    window.getSelection = vi.fn().mockReturnValue({
      toString: () => ''
    });

    card.click();
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);
  });

  it('triggers primary action on keyboard Enter and Space keys when card is focused', () => {
    const onOpenProject = vi.fn();
    const controller = new ClickableCardsController(document, { onOpenProject });
    controller.init();

    const card = document.querySelector('.project-card[data-project="nature-home"]');

    // Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    card.dispatchEvent(enterEvent);
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);

    // Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    card.dispatchEvent(spaceEvent);
    expect(onOpenProject).toHaveBeenCalledWith('nature-home', 0);

    // Other key (e.g. Tab or Escape) does nothing
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    card.dispatchEvent(tabEvent);
    expect(onOpenProject).toHaveBeenCalledTimes(2);
  });

  it('triggers speculative preload on pointerenter', () => {
    const onOpenProject = vi.fn();
    onOpenProject.preload = vi.fn();

    const controller = new ClickableCardsController(document, { onOpenProject });
    controller.init();

    const card = document.querySelector('.project-card[data-project="nature-home"]');
    const pointerEnterEvent = new Event('pointerenter');
    card.dispatchEvent(pointerEnterEvent);

    expect(onOpenProject.preload).toHaveBeenCalled();
  });

  it('factory initClickableCards initializes and returns controller instance', () => {
    const onOpenProject = vi.fn();
    const instance = initClickableCards({ onOpenProject });
    expect(instance).toBeInstanceOf(ClickableCardsController);
  });
});
