/**
 * Multi-Intent Interactive Inquiry Suite Component Controller
 */
import { INTENT_FIELD_CONFIG } from '../data/intents.js';

export class InquirySuiteController {
  constructor(root = document) {
    this.root = root;
    this.intentPills = this.root.querySelectorAll('.intent-pill');
    this.hiddenInput = this.root.getElementById('inquiry_intent');
    this.form = this.root.getElementById('inquiryForm');
    this.successState = this.root.getElementById('inquirySuccess');
    this.resetBtn = this.root.getElementById('btnResetInquiry');

    this.orgLabel = this.root.getElementById('label-org');
    this.orgInput = this.root.getElementById('organization');
    this.contextLabel = this.root.getElementById('label-context');
    this.contextInput = this.root.getElementById('contextField');
    this.msgLabel = this.root.getElementById('label-message');
    this.msgInput = this.root.getElementById('message');
    this.submitText = this.root.getElementById('btnSubmitText');
  }

  init() {
    this.intentPills.forEach((pill, index) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const intent = pill.dataset.intent;
        this.selectIntent(intent);
      });

      pill.addEventListener('keydown', (e) => {
        let targetIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          targetIndex = (index + 1) % this.intentPills.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          targetIndex = (index - 1 + this.intentPills.length) % this.intentPills.length;
        }
        if (targetIndex >= 0) {
          e.preventDefault();
          const targetPill = this.intentPills[targetIndex];
          targetPill.focus();
          const intent = targetPill.dataset.intent;
          this.selectIntent(intent);
        }
      });
    });

    this.root.querySelectorAll('.select-intent-trigger').forEach((link) => {
      link.addEventListener('click', (e) => {
        const intent = link.dataset.intent;
        if (intent) this.selectIntent(intent);
      });
    });

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  selectIntent(intentKey) {
    const config = INTENT_FIELD_CONFIG[intentKey] || INTENT_FIELD_CONFIG.architecture;

    this.intentPills.forEach((p) => {
      const isSelected = p.dataset.intent === intentKey;
      p.classList.toggle('active', isSelected);
      p.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    if (this.hiddenInput) this.hiddenInput.value = intentKey;

    if (this.orgLabel && config.orgLabel) this.orgLabel.textContent = config.orgLabel;
    if (this.orgInput && config.orgPlaceholder) this.orgInput.placeholder = config.orgPlaceholder;

    if (this.contextLabel && config.contextLabel) this.contextLabel.textContent = config.contextLabel;
    if (this.contextInput && config.contextPlaceholder) this.contextInput.placeholder = config.contextPlaceholder;

    if (this.msgLabel && config.msgLabel) this.msgLabel.textContent = config.msgLabel;
    if (this.msgInput && config.msgPlaceholder) this.msgInput.placeholder = config.msgPlaceholder;

    if (this.submitText && config.btnLabel) this.submitText.textContent = config.btnLabel;
  }

  validateForm(formData) {
    const { name, email, message } = formData;
    if (!name || !name.trim()) return { valid: false, error: 'Name is required' };
    if (!email || !email.trim()) return { valid: false, error: 'Email is required' };
    if (!message || !message.trim()) return { valid: false, error: 'Message is required' };
    return { valid: true };
  }

  handleSubmit() {
    const nameInput = this.root.getElementById('fullName');
    const emailInput = this.root.getElementById('email');
    const messageInput = this.root.getElementById('message');

    const validation = this.validateForm({
      name: nameInput?.value,
      email: emailInput?.value,
      message: messageInput?.value
    });

    if (!validation.valid) {
      alert('Please provide your name, email address, and a brief overview of your inquiry.');
      return;
    }

    if (this.form) this.form.style.display = 'none';
    if (this.successState) {
      this.successState.style.display = 'flex';
      if (typeof this.successState.scrollIntoView === 'function') {
        this.successState.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  reset() {
    if (this.form) {
      this.form.reset();
      this.form.style.display = 'grid';
    }
    if (this.successState) {
      this.successState.style.display = 'none';
    }
  }
}

export function initInquirySuite() {
  const controller = new InquirySuiteController(document);
  controller.init();
  return controller;
}
