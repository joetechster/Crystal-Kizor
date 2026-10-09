import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GalleryModalController } from '../src/components/GalleryModal.js';

describe('GalleryModalController Component Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <dialog id="inspectionDialog" class="inspection-dialog">
        <div class="sheet-container">
          <div class="sheet-header">
            <span id="dialogProjectEntity"></span>
            <h3 id="dialogProjectTitle"></h3>
            <button id="dialogCloseBtn" type="button">✕</button>
          </div>
          <div class="sheet-body">
            <div id="galleryStage" class="gallery-stage-container">
              <img id="dialogProjectImg" src="" alt="">
              <span id="dialogPhotoCounter"></span>
              <span id="dialogPhotoLabel"></span>
              <button id="btnGalleryPrev" type="button">‹</button>
              <button id="btnGalleryNext" type="button">›</button>
            </div>
            <div id="galleryThumbsWrapper">
              <div id="dialogThumbsTrack"></div>
            </div>
            <span id="dialogSpecTypology"></span>
            <span id="dialogSpecClimate"></span>
            <span id="dialogSpecMaterials"></span>
            <span id="dialogSpecStatus"></span>
            <p id="dialogProjectNarrative"></p>
          </div>
          <div class="sheet-footer">
            <button id="dialogDismissBtn" type="button">Close</button>
            <button id="dialogInquireBtn" type="button">Inquire</button>
          </div>
        </div>
      </dialog>
      <button class="open-project-trigger" data-project="nature-home">Open Nature Home</button>
      <button class="open-project-trigger" data-project="community-centre">Open Community</button>
    `;
  });

  it('opens Nature Home gallery with 13 photos, specifications, and initial index 0', () => {
    const controller = new GalleryModalController(document);
    controller.init();

    controller.open('nature-home', 0);

    expect(document.getElementById('dialogProjectTitle').textContent).toBe('The Nature Home Residence');
    expect(document.getElementById('dialogSpecTypology').textContent).toBe('Private Residence');
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('1 / 13');
    expect(document.getElementById('dialogPhotoLabel').textContent).toBe('Main Facade & Studio COKA Sign');

    // 13 thumbnails rendered
    const thumbs = document.querySelectorAll('#dialogThumbsTrack .thumb-btn');
    expect(thumbs.length).toBe(13);
    expect(thumbs[0].classList.contains('active')).toBe(true);
  });

  it('navigates through photos via next() and prev() with circular wraparound', () => {
    const controller = new GalleryModalController(document);
    controller.init();

    controller.open('community-centre', 0); // 5 photos
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('1 / 5');

    // Next
    controller.next();
    expect(controller.currentIndex).toBe(1);
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('2 / 5');

    // Prev
    controller.prev();
    expect(controller.currentIndex).toBe(0);
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('1 / 5');

    // Prev from 0 wraps around to end (index 4)
    controller.prev();
    expect(controller.currentIndex).toBe(4);
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('5 / 5');

    // Next from end wraps around to index 0
    controller.next();
    expect(controller.currentIndex).toBe(0);
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('1 / 5');
  });

  it('jumps directly to a specific photo via goTo(index) and updates active thumbnail', () => {
    const controller = new GalleryModalController(document);
    controller.init();

    controller.open('nature-home', 0);
    controller.goTo(7); // Jump to divider screen

    expect(controller.currentIndex).toBe(7);
    expect(document.getElementById('dialogPhotoCounter').textContent).toBe('8 / 13');
    expect(document.getElementById('dialogPhotoLabel').textContent).toBe('Custom Fluted Timber Divider');

    const thumbs = document.querySelectorAll('#dialogThumbsTrack .thumb-btn');
    expect(thumbs[7].classList.contains('active')).toBe(true);
    expect(thumbs[0].classList.contains('active')).toBe(false);
  });

  it('closes dialog and clears data-closing', async () => {
    const controller = new GalleryModalController(document);
    controller.init();

    controller.open('nature-home', 0);
    controller.close();

    const dialog = document.getElementById('inspectionDialog');
    expect(dialog.hasAttribute('data-closing')).toBe(true);

    await new Promise((r) => setTimeout(r, 220));
    expect(dialog.hasAttribute('data-closing')).toBe(false);
  });

  it('scrolls only thumbsWrapper horizontally and does not call scrollIntoView or change sheetBody.scrollTop', () => {
    const controller = new GalleryModalController(document);
    controller.init();

    const thumbsWrapper = document.getElementById('galleryThumbsWrapper');
    thumbsWrapper.scrollTo = vi.fn();

    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    controller.open('nature-home', 0);
    const sheetBody = document.querySelector('.sheet-body');
    expect(sheetBody.scrollTop).toBe(0);

    // Pick next photo
    controller.next();
    expect(controller.currentIndex).toBe(1);

    // scrollIntoView must NEVER be called (avoiding vertical scroll jumps)
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();

    // thumbsWrapper.scrollTo must be called with horizontal left offset
    expect(thumbsWrapper.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
        left: expect.any(Number)
      })
    );

    // sheetBody vertical scroll remains pinned at 0
    expect(sheetBody.scrollTop).toBe(0);
  });

  it('resets sheetBody scrollTop to 0 when opening a project', () => {
    const controller = new GalleryModalController(document);
    controller.init();

    const sheetBody = document.querySelector('.sheet-body');
    sheetBody.scrollTop = 250; // Simulate previous user scroll

    controller.open('community-centre', 0);
    expect(sheetBody.scrollTop).toBe(0);
  });
});
