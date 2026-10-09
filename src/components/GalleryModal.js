/**
 * Interactive Project Inspection Dialog System & Photo Gallery Component
 * Implements Apple Design fluid gestures, 1:1 direct tracking, velocity handoff, and spring sheets.
 */
import { PROJECT_DATA } from '../data/projects.js';
import { PROJECT_GALLERIES } from '../data/galleries.js';
import { calculateVelocity, shouldAdvanceSlide, calculateWrappedIndex } from '../utils/gestures.js';

export class GalleryModalController {
  constructor(root = document) {
    this.root = root;
    this.dialog = this.root.getElementById('inspectionDialog');
    this.closeBtn = this.root.getElementById('dialogCloseBtn');
    this.dismissBtn = this.root.getElementById('dialogDismissBtn');
    this.inquireBtn = this.root.getElementById('dialogInquireBtn');
    this.stage = this.root.getElementById('galleryStage');
    this.stageImg = this.root.getElementById('dialogProjectImg');
    this.counterPill = this.root.getElementById('dialogPhotoCounter');
    this.labelPill = this.root.getElementById('dialogPhotoLabel');
    this.btnPrev = this.root.getElementById('btnGalleryPrev');
    this.btnNext = this.root.getElementById('btnGalleryNext');
    this.thumbsTrack = this.root.getElementById('dialogThumbsTrack');
    this.thumbsWrapper = this.root.getElementById('galleryThumbsWrapper');
    this.sheetContainer = this.root.querySelector('.sheet-container');
    this.sheetBody = this.root.querySelector('.sheet-body');
    this.dragHandle = this.root.getElementById('sheetDragHandle');
    this.header = this.root.querySelector('.sheet-header');

    this.currentGalleryKey = 'nature-home';
    this.currentIndex = 0;
    this.onInquire = null;
  }

  init(onInquire) {
    this.onInquire = onInquire;
    if (!this.dialog) return;

    // Triggers across the page
    this.root.querySelectorAll('.open-project-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const projectKey = trigger.dataset.project || 'nature-home';
        const startIndex = (projectKey === 'nature-interiors' || projectKey === 'elevated-craft') ? 7 : 0;
        this.open(projectKey, startIndex);
      });
    });

    if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.next());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.dismissBtn) this.dismissBtn.addEventListener('click', () => this.close());

    if (this.inquireBtn) {
      this.inquireBtn.addEventListener('click', () => {
        this.close();
        if (this.onInquire) this.onInquire('architecture');
      });
    }

    // Light dismiss fallback
    this.dialog.addEventListener('click', (event) => {
      if (event.target !== this.dialog) return;
      const rect = this.dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) this.close();
    });

    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.close();
    });

    // Keyboard Navigation: Left & Right arrow keys
    window.addEventListener('keydown', (e) => {
      if (!this.dialog.open) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    });

    // 1:1 Direct Manipulation Pointer Swipe Tracking
    this.initPointerDrag();

    // Apple iOS Mobile Bottom Sheet Swipe-Down-To-Dismiss Tracking
    this.initSheetSwipeDismiss();
  }

  initPointerDrag() {
    if (!this.stage) return;
    let startX = 0;
    let currentX = 0;
    let isTracking = false;
    let startTime = 0;

    this.stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.gallery-arrow-btn') || e.target.closest('.gallery-stage-meta')) return;
      isTracking = true;
      startX = e.clientX;
      currentX = startX;
      startTime = performance.now();
      try {
        this.stage.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback
      }
      if (this.stageImg) {
        this.stageImg.style.transition = 'none';
      }
    });

    this.stage.addEventListener('pointermove', (e) => {
      if (!isTracking) return;
      currentX = e.clientX;
      const dx = currentX - startX;
      if (this.stageImg) {
        this.stageImg.style.transform = `translateX(${dx}px) scale(0.985)`;
      }
    });

    const endDrag = (e) => {
      if (!isTracking) return;
      isTracking = false;
      try {
        this.stage.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Cleanup
      }

      const dx = currentX - startX;
      const dt = performance.now() - startTime;
      const vx = calculateVelocity(dx, dt);
      const action = shouldAdvanceSlide(dx, vx);

      if (action === 'next') {
        this.next();
      } else if (action === 'prev') {
        this.prev();
      } else {
        if (this.stageImg) {
          this.stageImg.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
          this.stageImg.style.transform = 'translateX(0) scale(1)';
        }
      }
    };

    this.stage.addEventListener('pointerup', endDrag);
    this.stage.addEventListener('pointercancel', endDrag);
  }

  open(projectKey, startIndex = 0) {
    this.currentGalleryKey = projectKey;
    const meta = PROJECT_DATA[projectKey] || PROJECT_DATA['nature-home'];
    const gallery = PROJECT_GALLERIES[projectKey] || PROJECT_GALLERIES['nature-home'];

    // Update specs & text
    const titleEl = this.root.getElementById('dialogProjectTitle');
    const entityEl = this.root.getElementById('dialogProjectEntity');
    const typoEl = this.root.getElementById('dialogSpecTypology');
    const climEl = this.root.getElementById('dialogSpecClimate');
    const matEl = this.root.getElementById('dialogSpecMaterials');
    const statEl = this.root.getElementById('dialogSpecStatus');
    const narrEl = this.root.getElementById('dialogProjectNarrative');

    if (titleEl) titleEl.textContent = meta.title;
    if (entityEl) entityEl.textContent = meta.entity;
    if (typoEl) typoEl.textContent = meta.typology;
    if (climEl) climEl.textContent = meta.climate;
    if (matEl) matEl.textContent = meta.materials;
    if (statEl) statEl.textContent = meta.status;
    if (narrEl) narrEl.textContent = meta.narrative;

    // Ensure sheet body scroll position starts at top
    if (this.sheetBody) {
      this.sheetBody.scrollTop = 0;
    }

    // Render thumbnail filmstrip
    this.renderThumbnails(gallery);

    // Set active photo
    this.currentIndex = Math.min(Math.max(0, startIndex), gallery.length - 1);
    this.displayImage(this.currentIndex, 0);

    if (typeof this.dialog.showModal === 'function') {
      this.dialog.showModal();
    } else {
      this.dialog.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
  }

  renderThumbnails(gallery) {
    if (!this.thumbsTrack) return;
    this.thumbsTrack.innerHTML = '';
    gallery.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thumb-btn';
      btn.setAttribute('aria-label', `View photo ${idx + 1}: ${item.label}`);
      btn.dataset.index = idx;

      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = item.label;
      img.loading = 'lazy';
      img.width = 80;
      img.height = 56;

      btn.appendChild(img);
      btn.addEventListener('click', () => {
        if (idx !== this.currentIndex) {
          const dir = idx > this.currentIndex ? 1 : -1;
          this.goTo(idx, dir);
        }
      });
      this.thumbsTrack.appendChild(btn);
    });
  }

  displayImage(index, dir = 0) {
    const gallery = PROJECT_GALLERIES[this.currentGalleryKey] || PROJECT_GALLERIES['nature-home'];
    const item = gallery[index];
    if (!item) return;

    if (this.counterPill) this.counterPill.textContent = `${index + 1} / ${gallery.length}`;
    if (this.labelPill) this.labelPill.textContent = item.label;

    if (this.stageImg) {
      if (dir !== 0) {
        this.stageImg.style.transition = 'opacity 140ms ease, transform 180ms ease';
        this.stageImg.style.opacity = '0.35';
        this.stageImg.style.transform = `translateX(${dir > 0 ? '16px' : '-16px'}) scale(0.98)`;

        setTimeout(() => {
          this.stageImg.src = item.src;
          this.stageImg.alt = item.alt;
          this.stageImg.style.opacity = '1';
          this.stageImg.style.transform = 'translateX(0) scale(1)';
        }, 120);
      } else {
        this.stageImg.style.transition = 'none';
        this.stageImg.style.transform = 'none';
        this.stageImg.style.opacity = '1';
        this.stageImg.src = item.src;
        this.stageImg.alt = item.alt;
      }
    }

    // Update active thumb
    if (this.thumbsTrack) {
      const thumbButtons = this.thumbsTrack.querySelectorAll('.thumb-btn');
      thumbButtons.forEach((btn, i) => {
        const isActive = i === index;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
        if (isActive) {
          this.scrollActiveThumbIntoView(btn);
        }
      });
    }
  }

  /**
   * Horizontally centers the active thumbnail within the filmstrip wrapper
   * without affecting the vertical scroll position of .sheet-body or window.
   */
  scrollActiveThumbIntoView(btn) {
    if (!btn || !this.thumbsWrapper) return;

    // Use getBoundingClientRect to calculate horizontal offset strictly within thumbsWrapper viewport.
    // This deliberately avoids element.scrollIntoView(), which traverses ancestor scroll containers
    // and causes unintended vertical scrolling of .sheet-body and the window.
    if (typeof btn.getBoundingClientRect === 'function' && typeof this.thumbsWrapper.getBoundingClientRect === 'function') {
      const btnRect = btn.getBoundingClientRect();
      const wrapperRect = this.thumbsWrapper.getBoundingClientRect();

      if (wrapperRect.width > 0) {
        const currentScroll = this.thumbsWrapper.scrollLeft || 0;
        const relativeLeft = btnRect.left - wrapperRect.left;
        const targetScrollLeft = currentScroll + relativeLeft - (wrapperRect.width / 2) + (btnRect.width / 2);

        if (typeof this.thumbsWrapper.scrollTo === 'function') {
          this.thumbsWrapper.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth'
          });
        } else {
          this.thumbsWrapper.scrollLeft = Math.max(0, targetScrollLeft);
        }
        return;
      }
    }

    // Fallback for headless environments or zero-width layouts
    const btnLeft = btn.offsetLeft || 0;
    const btnWidth = btn.offsetWidth || 0;
    const wrapperWidth = this.thumbsWrapper.clientWidth || 0;
    const targetScrollLeft = btnLeft - (wrapperWidth / 2) + (btnWidth / 2);

    if (typeof this.thumbsWrapper.scrollTo === 'function') {
      this.thumbsWrapper.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    } else {
      this.thumbsWrapper.scrollLeft = Math.max(0, targetScrollLeft);
    }
  }

  goTo(targetIndex, dir = 1) {
    const gallery = PROJECT_GALLERIES[this.currentGalleryKey] || PROJECT_GALLERIES['nature-home'];
    if (!gallery.length) return;
    this.currentIndex = calculateWrappedIndex(targetIndex, 0, gallery.length);
    this.displayImage(this.currentIndex, dir);
  }

  prev() {
    const gallery = PROJECT_GALLERIES[this.currentGalleryKey] || PROJECT_GALLERIES['nature-home'];
    this.currentIndex = calculateWrappedIndex(this.currentIndex, -1, gallery.length);
    this.displayImage(this.currentIndex, -1);
  }

  next() {
    const gallery = PROJECT_GALLERIES[this.currentGalleryKey] || PROJECT_GALLERIES['nature-home'];
    this.currentIndex = calculateWrappedIndex(this.currentIndex, 1, gallery.length);
    this.displayImage(this.currentIndex, 1);
  }

  initSheetSwipeDismiss() {
    const handle = this.dragHandle || this.header;
    if (!handle || !this.sheetContainer) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let startTime = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('#dialogCloseBtn')) return;
      isDragging = true;
      startY = e.clientY;
      currentY = startY;
      startTime = performance.now();
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {}
      if (this.sheetContainer) {
        this.sheetContainer.style.transition = 'none';
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      currentY = e.clientY;
      let dy = currentY - startY;
      if (dy < 0) {
        // Rubber-band resistance for upward pull
        dy = (dy * 50) / (50 + Math.abs(dy));
      }
      if (this.sheetContainer) {
        this.sheetContainer.style.transform = `translateY(${Math.max(-20, dy)}px)`;
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const dy = currentY - startY;
      const dt = performance.now() - startTime;
      const vy = dt > 0 ? dy / dt : 0; // px/ms

      if (dy > 120 || vy > 0.45) {
        // Hand off momentum smoothly into dismissal spring
        if (this.sheetContainer) {
          this.sheetContainer.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
          this.sheetContainer.style.transform = 'translateY(100%)';
        }
        setTimeout(() => {
          this.close();
          if (this.sheetContainer) {
            this.sheetContainer.style.transform = '';
          }
        }, 220);
      } else {
        // Spring bounce back to resting position
        if (this.sheetContainer) {
          this.sheetContainer.style.transition = 'transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1)';
          this.sheetContainer.style.transform = 'translateY(0)';
        }
      }
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
  }

  close() {
    this.dialog.setAttribute('data-closing', '');
    setTimeout(() => {
      this.dialog.removeAttribute('data-closing');
      if (typeof this.dialog.close === 'function') {
        this.dialog.close();
      } else {
        this.dialog.removeAttribute('open');
      }
      document.body.style.overflow = '';
      if (this.stageImg) {
        this.stageImg.style.transform = '';
      }
      if (this.sheetContainer) {
        this.sheetContainer.style.transform = '';
      }
    }, 200);
  }
}

export function initProjectInspectionDialog(onInquire) {
  const controller = new GalleryModalController(document);
  controller.init(onInquire);
  return controller;
}
