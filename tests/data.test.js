import { describe, it, expect } from 'vitest';
import { JOURNEY_DATA } from '../src/data/journeys.js';
import { PROJECT_DATA } from '../src/data/projects.js';
import { PROJECT_GALLERIES } from '../src/data/galleries.js';
import { INTENT_FIELD_CONFIG } from '../src/data/intents.js';

describe('Data Store Integrity & Schemas', () => {
  describe('JOURNEY_DATA', () => {
    it('contains all four core persona journey paths', () => {
      const keys = Object.keys(JOURNEY_DATA);
      expect(keys).toEqual(['clients', 'speaking', 'tea', 'civic']);
    });

    it('ensures each journey has complete deliverables and CTA metadata', () => {
      Object.entries(JOURNEY_DATA).forEach(([key, journey]) => {
        expect(journey.badgeText).toBeTruthy();
        expect(journey.title).toBeTruthy();
        expect(journey.desc).toBeTruthy();
        expect(Array.isArray(journey.deliverables)).toBe(true);
        expect(journey.deliverables.length).toBeGreaterThanOrEqual(3);
        expect(journey.entityTag).toBeTruthy();
        expect(journey.entityName).toBeTruthy();
        expect(journey.ctaLabel).toBeTruthy();
        expect(journey.intent).toBeTruthy();
      });
    });
  });

  describe('PROJECT_DATA', () => {
    it('contains architectural specifications for all key projects', () => {
      const keys = Object.keys(PROJECT_DATA);
      expect(keys).toContain('nature-home');
      expect(keys).toContain('community-centre');
      expect(keys).toContain('nature-home-2');
      expect(keys).toContain('nature-interiors');
      expect(keys).toContain('elevated-craft');
    });

    it('ensures all projects have required architectural spec fields', () => {
      Object.entries(PROJECT_DATA).forEach(([key, project]) => {
        expect(project.title).toBeTruthy();
        expect(project.entity).toBeTruthy();
        expect(project.typology).toBeTruthy();
        expect(project.climate).toBeTruthy();
        expect(project.materials).toBeTruthy();
        expect(project.status).toBeTruthy();
        expect(project.narrative.length).toBeGreaterThan(30);
      });
    });
  });

  describe('PROJECT_GALLERIES', () => {
    it('contains exactly 25 authentic high-res project images across the 3 main projects', () => {
      expect(PROJECT_GALLERIES['community-centre'].length).toBe(5);
      expect(PROJECT_GALLERIES['nature-home'].length).toBe(13);
      expect(PROJECT_GALLERIES['nature-home-2'].length).toBe(7);
      
      const totalPhotos = 
        PROJECT_GALLERIES['community-centre'].length +
        PROJECT_GALLERIES['nature-home'].length +
        PROJECT_GALLERIES['nature-home-2'].length;
      expect(totalPhotos).toBe(25);
    });

    it('ensures every photograph has high-res WebP, thumbnail, label, and alt text', () => {
      ['community-centre', 'nature-home', 'nature-home-2'].forEach((key) => {
        const gallery = PROJECT_GALLERIES[key];
        gallery.forEach((item, idx) => {
          expect(item.src).toMatch(/^\/assets\/projects\/.*\.webp$/);
          expect(item.thumb).toMatch(/^\/assets\/projects\/.*thumb-.*\.webp$/);
          expect(item.label).toBeTruthy();
          expect(item.alt).toBeTruthy();
        });
      });
    });

    it('provides aliases for interior craft and furniture subsets', () => {
      expect(PROJECT_GALLERIES['nature-interiors']).toBe(PROJECT_GALLERIES['nature-home']);
      expect(PROJECT_GALLERIES['elevated-craft']).toBe(PROJECT_GALLERIES['nature-home']);
    });
  });

  describe('INTENT_FIELD_CONFIG', () => {
    it('configures dynamic form morphing for all 6 connection intents', () => {
      const intents = ['architecture', 'furniture', 'speaking', 'tea', 'civic', 'press'];
      intents.forEach((intent) => {
        const cfg = INTENT_FIELD_CONFIG[intent];
        expect(cfg).toBeDefined();
        expect(cfg.orgLabel).toBeTruthy();
        expect(cfg.orgPlaceholder).toBeTruthy();
        expect(cfg.contextLabel).toBeTruthy();
        expect(cfg.contextPlaceholder).toBeTruthy();
        expect(cfg.msgLabel).toBeTruthy();
        expect(cfg.msgPlaceholder).toBeTruthy();
        expect(cfg.btnLabel).toBeTruthy();
      });
    });
  });
});
