import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFetch, mockTranslations } from '../../helpers/mocks.js';

// Simple I18n class for testing
class I18n {
  constructor() {
    this.currentLanguage = null;
    this.translations = {};
    this.defaultLanguage = 'es';
    this.availableLanguages = ['es', 'en', 'fr'];
    this.fallbackLanguage = 'en';
    this.debug = false;
  }

  _determineLanguage(lang) {
    if (lang && this.availableLanguages.includes(lang)) {
      return lang;
    }

    const savedLang = localStorage.getItem('photo_andalou_language');
    if (savedLang) {
      const parsedLang = JSON.parse(savedLang);
      if (parsedLang && this.availableLanguages.includes(parsedLang)) {
        return parsedLang;
      }
    }

    const browserLang = this._getBrowserLanguage();
    if (browserLang && this.availableLanguages.includes(browserLang)) {
      return browserLang;
    }

    return this.defaultLanguage;
  }

  _getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (!browserLang) return null;
    const langCode = browserLang.split('-')[0].toLowerCase();
    return this.availableLanguages.includes(langCode) ? langCode : null;
  }

  async loadTranslations(lang) {
    const response = await fetch(`/data/translations/${lang}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    this.translations = await response.json();
    this.currentLanguage = lang;
  }

  t(key, variables = {}) {
    if (!key) return '';

    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    return this._interpolate(value, variables);
  }

  _interpolate(text, variables) {
    if (!variables || Object.keys(variables).length === 0) {
      return text;
    }

    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      if (variable in variables) {
        return variables[variable];
      }
      return match;
    });
  }

  getCurrentLanguage() {
    return this.currentLanguage || this.defaultLanguage;
  }

  getAvailableLanguages() {
    return [...this.availableLanguages];
  }

  isLanguageAvailable(lang) {
    return this.availableLanguages.includes(lang);
  }

  has(key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return typeof value === 'string';
  }
}

describe('I18n', () => {
  let i18n;

  beforeEach(() => {
    i18n = new I18n();
    localStorage.clear();
    // Mock navigator.language
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'es-ES'
    });
  });

  describe('_determineLanguage()', () => {
    it('devrait retourner la langue explicite si valide', () => {
      const lang = i18n._determineLanguage('en');
      expect(lang).toBe('en');
    });

    it('devrait ignorer une langue invalide', () => {
      const lang = i18n._determineLanguage('invalid');
      expect(lang).not.toBe('invalid');
    });

    it('devrait utiliser localStorage si pas de langue explicite', () => {
      localStorage.setItem('photo_andalou_language', JSON.stringify('fr'));
      const lang = i18n._determineLanguage();
      expect(lang).toBe('fr');
    });

    it('devrait utiliser la langue du navigateur en fallback', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en-US'
      });
      const lang = i18n._determineLanguage();
      expect(lang).toBe('en');
    });

    it('devrait utiliser la langue par défaut en dernier recours', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'de-DE'
      });
      const lang = i18n._determineLanguage();
      expect(lang).toBe('es');
    });
  });

  describe('_getBrowserLanguage()', () => {
    it('devrait extraire le code langue du navigateur', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'fr-FR'
      });
      const lang = i18n._getBrowserLanguage();
      expect(lang).toBe('fr');
    });

    it('devrait retourner null si langue non disponible', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'de-DE'
      });
      const lang = i18n._getBrowserLanguage();
      expect(lang).toBeNull();
    });

    it('devrait gérer l\'absence de navigator.language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: undefined
      });
      const lang = i18n._getBrowserLanguage();
      expect(lang).toBeNull();
    });
  });

  describe('loadTranslations()', () => {
    it('devrait charger les traductions avec succès', async () => {
      mockFetch(mockTranslations.es);
      await i18n.loadTranslations('es');
      expect(i18n.currentLanguage).toBe('es');
      expect(i18n.translations).toEqual(mockTranslations.es);
    });

    it('devrait lever une erreur si fetch échoue', async () => {
      mockFetch({}, { ok: false, status: 404 });
      await expect(i18n.loadTranslations('invalid')).rejects.toThrow();
    });
  });

  describe('t()', () => {
    beforeEach(() => {
      i18n.translations = mockTranslations.es;
    });

    it('devrait traduire une clé simple', () => {
      const result = i18n.t('nav.home');
      expect(result).toBe('Inicio');
    });

    it('devrait traduire une clé avec dot notation profonde', () => {
      const result = i18n.t('home.hero.title');
      expect(result).toBe('Título en Español');
    });

    it('devrait retourner la clé si traduction manquante', () => {
      const result = i18n.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('devrait retourner une string vide pour clé vide', () => {
      const result = i18n.t('');
      expect(result).toBe('');
    });

    it('devrait retourner la clé si la valeur n\'est pas une string', () => {
      const result = i18n.t('home');
      expect(result).toBe('home');
    });
  });

  describe('_interpolate()', () => {
    it('devrait interpoler une variable simple', () => {
      const result = i18n._interpolate('Hello {{name}}', { name: 'John' });
      expect(result).toBe('Hello John');
    });

    it('devrait interpoler plusieurs variables', () => {
      const result = i18n._interpolate('{{greeting}} {{name}}!', {
        greeting: 'Hello',
        name: 'John'
      });
      expect(result).toBe('Hello John!');
    });

    it('devrait garder le placeholder si variable manquante', () => {
      const result = i18n._interpolate('Hello {{name}}', {});
      expect(result).toBe('Hello {{name}}');
    });

    it('devrait retourner le texte inchangé si pas de variables', () => {
      const result = i18n._interpolate('Hello World', {});
      expect(result).toBe('Hello World');
    });
  });

  describe('getCurrentLanguage()', () => {
    it('devrait retourner la langue actuelle', () => {
      i18n.currentLanguage = 'en';
      expect(i18n.getCurrentLanguage()).toBe('en');
    });

    it('devrait retourner la langue par défaut si pas de langue actuelle', () => {
      expect(i18n.getCurrentLanguage()).toBe('es');
    });
  });

  describe('getAvailableLanguages()', () => {
    it('devrait retourner un tableau des langues disponibles', () => {
      const langs = i18n.getAvailableLanguages();
      expect(langs).toEqual(['es', 'en', 'fr']);
    });

    it('devrait retourner une copie du tableau', () => {
      const langs = i18n.getAvailableLanguages();
      langs.push('de');
      expect(i18n.availableLanguages).toEqual(['es', 'en', 'fr']);
    });
  });

  describe('isLanguageAvailable()', () => {
    it('devrait retourner true pour langue disponible', () => {
      expect(i18n.isLanguageAvailable('es')).toBe(true);
      expect(i18n.isLanguageAvailable('en')).toBe(true);
      expect(i18n.isLanguageAvailable('fr')).toBe(true);
    });

    it('devrait retourner false pour langue non disponible', () => {
      expect(i18n.isLanguageAvailable('de')).toBe(false);
      expect(i18n.isLanguageAvailable('invalid')).toBe(false);
    });
  });

  describe('has()', () => {
    beforeEach(() => {
      i18n.translations = mockTranslations.es;
    });

    it('devrait retourner true si la clé existe', () => {
      expect(i18n.has('nav.home')).toBe(true);
      expect(i18n.has('home.hero.title')).toBe(true);
    });

    it('devrait retourner false si la clé n\'existe pas', () => {
      expect(i18n.has('nonexistent.key')).toBe(false);
    });

    it('devrait retourner false si la valeur n\'est pas une string', () => {
      expect(i18n.has('home')).toBe(false);
    });
  });
});
