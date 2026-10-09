import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InquirySuiteController } from '../src/components/InquirySuite.js';

describe('InquirySuiteController Component Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="inquiryForm">
        <div class="intent-selector">
          <button class="intent-pill active" data-intent="architecture" aria-checked="true">Commission</button>
          <button class="intent-pill" data-intent="speaking" aria-checked="false">Keynote</button>
          <button class="intent-pill" data-intent="tea" aria-checked="false">TEA Network</button>
        </div>
        <input type="hidden" id="inquiry_intent" value="architecture">
        
        <input id="fullName" value="" />
        <input id="email" value="" />
        
        <label id="label-org">Client Name</label>
        <input id="organization" placeholder="Private homeowner" />
        
        <label id="label-context">Project Location</label>
        <input id="contextField" placeholder="Lagos, Nigeria" />
        
        <label id="label-message">Project Vision</label>
        <textarea id="message"></textarea>
        
        <button type="submit" id="btnSubmit">
          <span id="btnSubmitText">Transmit Architecture Commission Brief</span>
        </button>
      </form>
      <div id="inquirySuccess" style="display: none;">
        <span>Inquiry Received</span>
        <button id="btnResetInquiry">Transmit Another Brief</button>
      </div>
      <a class="select-intent-trigger" data-intent="speaking">Speaking Link</a>
    `;
  });

  it('morphs field labels, placeholders, and submit button when selecting an intent', () => {
    const controller = new InquirySuiteController(document);
    controller.init();

    controller.selectIntent('speaking');

    expect(document.getElementById('inquiry_intent').value).toBe('speaking');
    expect(document.getElementById('label-org').textContent).toContain('Host Organization');
    expect(document.getElementById('organization').placeholder).toContain('Africa Architecture Biennale');
    expect(document.getElementById('label-context').textContent).toContain('Event Date');
    expect(document.getElementById('label-message').textContent).toContain('Keynote Topic');
    expect(document.getElementById('btnSubmitText').textContent).toBe('Check Crystal’s Speaking Calendar');

    const speakingPill = document.querySelector('.intent-pill[data-intent="speaking"]');
    expect(speakingPill.classList.contains('active')).toBe(true);
    expect(speakingPill.getAttribute('aria-checked')).toBe('true');
  });

  it('validates required fields before allowing submission', () => {
    const controller = new InquirySuiteController(document);

    // Missing all
    let validation = controller.validateForm({ name: '', email: '', message: '' });
    expect(validation.valid).toBe(false);

    // Missing email
    validation = controller.validateForm({ name: 'Ada Lovelace', email: '', message: 'Hello' });
    expect(validation.valid).toBe(false);

    // Valid
    validation = controller.validateForm({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'We would love to commission a residence.'
    });
    expect(validation.valid).toBe(true);
  });

  it('transitions to success state on valid form submission', () => {
    const controller = new InquirySuiteController(document);
    controller.init();

    document.getElementById('fullName').value = 'Crystal Visitor';
    document.getElementById('email').value = 'visitor@example.com';
    document.getElementById('message').value = 'Interested in a modern villa design.';

    controller.handleSubmit();

    expect(document.getElementById('inquiryForm').style.display).toBe('none');
    expect(document.getElementById('inquirySuccess').style.display).toBe('flex');
  });

  it('resets form state when clicking the reset button', () => {
    const controller = new InquirySuiteController(document);
    controller.init();

    // Trigger success first
    document.getElementById('fullName').value = 'Visitor';
    document.getElementById('email').value = 'v@example.com';
    document.getElementById('message').value = 'Design inquiry';
    controller.handleSubmit();

    // Click reset
    document.getElementById('btnResetInquiry').click();

    expect(document.getElementById('inquiryForm').style.display).toBe('grid');
    expect(document.getElementById('inquirySuccess').style.display).toBe('none');
  });
});
