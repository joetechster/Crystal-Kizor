/**
 * Crystal Kizor Personal Brand Landing Page
 * Application Entry Point & Component Orchestrator
 * Optimized with Dynamic Code-Splitting and Lazy Component Loading
 */
import { initWayfinder } from './components/Wayfinder.js';
import { initInquirySuite } from './components/InquirySuite.js';
import { initScrollReveal } from './components/ScrollReveal.js';
import { initParallax } from './components/Parallax.js';
import { initNavigation } from './components/Navigation.js';
import { initPointerFeedback } from './components/PointerFeedback.js';
import { initSmoothScroll } from './components/SmoothScroll.js';
import { initClickableCards } from './components/ClickableCards.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Critical Interactive Foundations & Smooth Motion
  const smoothScroll = initSmoothScroll();
  initScrollReveal();
  initParallax();
  initNavigation(smoothScroll);
  initPointerFeedback();

  // 2. Inquiry Suite Controller
  const inquirySuite = initInquirySuite();

  // 3. Wayfinder Component
  initWayfinder((intent) => {
    inquirySuite.selectIntent(intent);
    smoothScroll.scrollToAnchor('#connect');
  });

  // 4. Lazy Dynamic Import of GalleryModal & Universal Clickable Cards
  initLazyGalleryModal({
    onInquire: (intent) => {
      inquirySuite.selectIntent(intent);
      smoothScroll.scrollToAnchor('#connect');
    },
    onSelectIntent: (intent) => {
      inquirySuite.selectIntent(intent);
      smoothScroll.scrollToAnchor('#connect');
    }
  });

  // 5. Deep-Link URL Path & Section Resolution (e.g. /wayfinder -> #wayfinder)
  handleDeepLinkPath(smoothScroll);
});

/**
 * Automatically scrolls to matching section when visiting direct paths (e.g. /wayfinder)
 */
function handleDeepLinkPath(smoothScroll) {
  if (typeof window === 'undefined') return;

  const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const hash = window.location.hash;

  const PATH_TO_SECTION_MAP = {
    'wayfinder': '#wayfinder',
    'showcase': '#showcase',
    'built-work': '#showcase',
    'pillars': '#pillars',
    'three-pillars': '#pillars',
    'thought-leadership': '#thought-leadership',
    'voice': '#thought-leadership',
    'connect': '#connect',
    'inquiry': '#connect',
    'philosophy': '#hero'
  };

  const targetAnchor = hash || PATH_TO_SECTION_MAP[rawPath] || (rawPath && document.getElementById(rawPath) ? `#${rawPath}` : null);

  if (targetAnchor && document.querySelector(targetAnchor)) {
    setTimeout(() => {
      smoothScroll.scrollToAnchor(targetAnchor);
    }, 150);
  }
}

/**
 * Lazily loads GalleryModal.js on first hover, focus, or click of an inspection trigger
 * and initializes Universal Clickable Cards
 */
function initLazyGalleryModal({ onInquire, onSelectIntent }) {
  let galleryControllerPromise = null;

  function loadGallery() {
    if (!galleryControllerPromise) {
      galleryControllerPromise = import('./components/GalleryModal.js').then(({ initProjectInspectionDialog }) => {
        return initProjectInspectionDialog(onInquire);
      });
    }
    return galleryControllerPromise;
  }

  const triggers = document.querySelectorAll('.open-project-trigger');
  triggers.forEach((trigger) => {
    // Speculative hover/focus prefetch: begins downloading chunk before click occurs
    trigger.addEventListener('pointerenter', () => loadGallery(), { once: true, passive: true });
    trigger.addEventListener('focus', () => loadGallery(), { once: true, passive: true });

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const projectKey = trigger.dataset.project || 'nature-home';
      const startIndex = (projectKey === 'nature-interiors' || projectKey === 'elevated-craft') ? 7 : 0;

      loadGallery().then((controller) => {
        controller.open(projectKey, startIndex);
      });
    });
  });

  // Universal Clickable Cards Controller
  const onOpenProject = (projectKey, startIndex = 0) => {
    return loadGallery().then((controller) => {
      controller.open(projectKey, startIndex);
    });
  };
  onOpenProject.preload = loadGallery;

  initClickableCards({
    onOpenProject,
    onSelectIntent
  });
}
