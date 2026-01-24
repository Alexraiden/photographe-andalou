/**
 * Internationalization (i18n) Service
 *
 * Système multi-langue sans librairie externe
 * Supporte ES, EN, FR avec chargement dynamique
 */

import { storageService } from '../services/storageService.js';
import { state } from './state.js';

class I18n {
  constructor() {
    this.currentLanguage = null;
    this.translations = {};
    this.defaultLanguage = 'es'; // Espagnol par défaut
    this.availableLanguages = ['es', 'en', 'fr'];
    this.fallbackLanguage = 'en'; // Anglais comme fallback
    this.debug = false;
  }

  /**
   * Initialise le système i18n
   * @param {string|null} lang - Langue à charger (null = auto-detect)
   * @returns {Promise<void>}
   */
  async init(lang = null) {
    try {
      // Détermine la langue à utiliser
      const targetLang = this._determineLanguage(lang);

      if (this.debug) {
        console.log(`[i18n] Initializing with language: ${targetLang}`);
      }

      // Charge les traductions
      await this.loadTranslations(targetLang);

      // Met à jour l'état global
      state.set('currentLanguage', targetLang);

      // Sauvegarde dans localStorage
      storageService.set('language', targetLang);

      // Met à jour l'attribut lang du HTML
      document.documentElement.lang = targetLang;

      if (this.debug) {
        console.log('[i18n] Initialization complete');
      }
    } catch (error) {
      console.error('[i18n] Initialization failed:', error);

      // Fallback sur la langue par défaut en cas d'erreur
      if (lang !== this.defaultLanguage) {
        console.warn(`[i18n] Falling back to ${this.defaultLanguage}`);
        await this.init(this.defaultLanguage);
      }
    }
  }

  /**
   * Détermine la langue à utiliser
   * @private
   * @param {string|null} lang - Langue demandée
   * @returns {string} Langue à utiliser
   */
  _determineLanguage(lang) {
    // 1. Langue explicitement demandée
    if (lang && this.availableLanguages.includes(lang)) {
      return lang;
    }

    // 2. Langue sauvegardée dans localStorage
    const savedLang = storageService.get('language');
    if (savedLang && this.availableLanguages.includes(savedLang)) {
      return savedLang;
    }

    // 3. Langue du navigateur
    const browserLang = this._getBrowserLanguage();
    if (browserLang && this.availableLanguages.includes(browserLang)) {
      return browserLang;
    }

    // 4. Langue par défaut
    return this.defaultLanguage;
  }

  /**
   * Récupère la langue du navigateur
   * @private
   * @returns {string|null}
   */
  _getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;

    if (!browserLang) return null;

    // Extrait le code de langue (ex: "es-ES" -> "es")
    const langCode = browserLang.split('-')[0].toLowerCase();

    return this.availableLanguages.includes(langCode) ? langCode : null;
  }

  /**
   * Charge les traductions pour une langue
   * @param {string} lang - Code de langue (es, en, fr)
   * @returns {Promise<void>}
   */
  async loadTranslations(lang) {
    try {
      if (this.debug) {
        console.log(`[i18n] Loading translations for: ${lang}`);
      }

      const response = await fetch(`/data/translations/${lang}.json`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const translations = await response.json();
      this.translations = translations;
      this.currentLanguage = lang;

      if (this.debug) {
        console.log(`[i18n] Translations loaded:`, Object.keys(translations));
      }
    } catch (error) {
      console.error(`[i18n] Failed to load translations for ${lang}:`, error);

      // Essaie de charger la langue de fallback
      if (lang !== this.fallbackLanguage) {
        console.warn(`[i18n] Attempting to load fallback language: ${this.fallbackLanguage}`);
        await this.loadTranslations(this.fallbackLanguage);
      } else {
        throw error;
      }
    }
  }

  /**
   * Traduit une clé
   * @param {string} key - Clé de traduction en dot notation (ex: "home.hero.title")
   * @param {Object} variables - Variables à interpoler {name: "John"}
   * @returns {string} Texte traduit
   */
  t(key, variables = {}) {
    if (!key) {
      console.warn('[i18n] Empty translation key');
      return '';
    }

    // Navigation dans l'objet de traductions avec dot notation
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        if (this.debug) {
          console.warn(`[i18n] Translation missing: ${key}`);
        }
        return key; // Retourne la clé si traduction manquante
      }
    }

    // Si on n'a pas trouvé de string final
    if (typeof value !== 'string') {
      console.warn(`[i18n] Translation key "${key}" is not a string`);
      return key;
    }

    // Remplace les variables : "Hello {{name}}" avec {name: "John"} -> "Hello John"
    return this._interpolate(value, variables);
  }

  /**
   * Interpole les variables dans une string
   * @private
   * @param {string} text - Texte avec placeholders {{var}}
   * @param {Object} variables - Objet {var: "value"}
   * @returns {string} Texte interpolé
   */
  _interpolate(text, variables) {
    if (!variables || Object.keys(variables).length === 0) {
      return text;
    }

    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      if (variable in variables) {
        return variables[variable];
      }

      if (this.debug) {
        console.warn(`[i18n] Variable "${variable}" not provided for interpolation`);
      }

      return match; // Garde le placeholder si variable non fournie
    });
  }

  /**
   * Change la langue
   * @param {string} lang - Code de langue
   * @returns {Promise<void>}
   */
  async setLanguage(lang) {
    if (!this.availableLanguages.includes(lang)) {
      console.error(`[i18n] Language "${lang}" not available`);
      return;
    }

    if (lang === this.currentLanguage) {
      if (this.debug) {
        console.log(`[i18n] Language already set to ${lang}`);
      }
      return;
    }

    try {
      // Charge les nouvelles traductions
      await this.loadTranslations(lang);

      // Met à jour l'état
      state.set('currentLanguage', lang);

      // Sauvegarde dans localStorage
      storageService.set('language', lang);

      // Met à jour l'attribut lang
      document.documentElement.lang = lang;

      // Dispatch event personnalisé pour que l'app se re-render
      window.dispatchEvent(
        new CustomEvent('languageChange', {
          detail: { language: lang, previousLanguage: this.currentLanguage },
        })
      );

      if (this.debug) {
        console.log(`[i18n] Language changed to: ${lang}`);
      }
    } catch (error) {
      console.error(`[i18n] Failed to change language to ${lang}:`, error);
    }
  }

  /**
   * Récupère la langue actuelle
   * @returns {string}
   */
  getCurrentLanguage() {
    return this.currentLanguage || this.defaultLanguage;
  }

  /**
   * Récupère toutes les langues disponibles
   * @returns {Array<string>}
   */
  getAvailableLanguages() {
    return [...this.availableLanguages];
  }

  /**
   * Vérifie si une langue est disponible
   * @param {string} lang - Code de langue
   * @returns {boolean}
   */
  isLanguageAvailable(lang) {
    return this.availableLanguages.includes(lang);
  }

  /**
   * Active/désactive le mode debug
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[i18n] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Récupère toutes les traductions (utile pour debug)
   * @returns {Object}
   */
  getAllTranslations() {
    return { ...this.translations };
  }

  /**
   * Vérifie si une clé de traduction existe
   * @param {string} key - Clé en dot notation
   * @returns {boolean}
   */
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

// Instance singleton
export const i18n = new I18n();

// Expose dans window pour debug en dev
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__I18N__ = i18n;
  i18n.setDebug(true);
}
