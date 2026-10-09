/**
 * Apple Design Universal Clickable Cards Controller
 * Makes cards clickable from anywhere across their surface while preserving
 * secondary nested buttons, protecting text selection, and providing full
 * keyboard accessibility (Apple Design Principles 1, 2, 10, 16).
 */
export class ClickableCardsController {
  constructor(root = document, options = {}) {
    this.root = root;
    this.onOpenProject = options.onOpenProject || null;
    this.onSelectIntent = options.onSelectIntent || null;
    this.cards = [];
  }

  init(onOpenProject, onSelectIntent) {
    if (onOpenProject) this.onOpenProject = onOpenProject;
    if (onSelectIntent) this.onSelectIntent = onSelectIntent;

    this.cards = this.root.querySelectorAll('.project-card, .bento-card[data-clickable="true"]');
    if (!this.cards.length) return;

    this.cards.forEach((card) => {
      // Ensure accessibility attributes
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      if (!card.hasAttribute('role')) {
        card.setAttribute('role', 'button');
      }

      // Pre-fetching hook for speculative download
      card.addEventListener('pointerenter', () => {
        if (card.dataset.project && typeof this.onOpenProject?.preload === 'function') {
          this.onOpenProject.preload();
        }
      }, { passive: true });

      // Click handler
      card.addEventListener('click', (e) => {
        this.handleCardClick(card, e);
      });

      // Keyboard activation (Enter / Space)
      card.addEventListener('keydown', (e) => {
        if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          this.triggerPrimaryAction(card);
        }
      });
    });
  }

  handleCardClick(card, e) {
    // 1. If text was selected / highlighted by the user, do not trigger action
    const selection = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection().toString() : '';
    if (selection && selection.trim().length > 0) {
      return;
    }

    // 2. If the user clicked on a secondary action element, let that element handle itself
    const secondaryTrigger = e.target.closest('.card-secondary-action, .select-intent-trigger:not([data-clickable="true"])');
    if (secondaryTrigger && secondaryTrigger !== card) {
      // Secondary action handles its own routing
      return;
    }

    // 3. If the user clicked an explicit primary inspect button, handle cleanly
    const interactiveChild = e.target.closest('a, button');
    if (interactiveChild && interactiveChild !== card) {
      if (interactiveChild.classList.contains('open-project-trigger') || interactiveChild.classList.contains('link-inspect')) {
        e.preventDefault();
        this.triggerPrimaryAction(card);
        return;
      }
      return;
    }

    // 4. User clicked anywhere else on the card (media, title, text, padding, specs)
    e.preventDefault();
    this.triggerPrimaryAction(card);
  }

  triggerPrimaryAction(card) {
    const projectKey = card.dataset.project;
    const intentKey = card.dataset.intent;

    if (projectKey) {
      const startIndex = (projectKey === 'nature-interiors' || projectKey === 'elevated-craft') ? 7 : 0;
      if (typeof this.onOpenProject === 'function') {
        this.onOpenProject(projectKey, startIndex);
      }
    } else if (intentKey) {
      if (typeof this.onSelectIntent === 'function') {
        this.onSelectIntent(intentKey);
      }
    }
  }
}

export function initClickableCards(options = {}) {
  const controller = new ClickableCardsController(document, options);
  controller.init(options.onOpenProject, options.onSelectIntent);
  return controller;
}
