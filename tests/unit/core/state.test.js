import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple State class for testing
class State {
  constructor() {
    this.data = {
      currentLanguage: 'es',
      currentPage: null,
      currentRoute: '/',
      currentCollection: null,
      lightboxOpen: false,
      lightboxImageId: null,
      menuOpen: false,
      isLoading: false,
      collections: [],
      images: {},
      navigationData: null,
      siteConfig: null,
      pageData: {},
    };
    this.listeners = new Map();
    this.debug = false;
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    const oldValue = this.data[key];
    if (oldValue === value) {
      return;
    }
    this.data[key] = value;
    this._notifyListeners(key, value, oldValue);
  }

  setMultiple(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    const callbacks = this.listeners.get(key);
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  _notifyListeners(key, newValue, oldValue) {
    const callbacks = this.listeners.get(key);
    if (!callbacks || callbacks.length === 0) {
      return;
    }
    callbacks.forEach((callback) => {
      try {
        callback(newValue, oldValue);
      } catch (error) {
        console.error(`[State] Error in listener for "${key}":`, error);
      }
    });
  }

  reset() {
    const currentLanguage = this.data.currentLanguage;
    this.data = {
      currentLanguage,
      currentPage: null,
      currentRoute: '/',
      currentCollection: null,
      lightboxOpen: false,
      lightboxImageId: null,
      menuOpen: false,
      isLoading: false,
      collections: [],
      images: {},
      navigationData: null,
      siteConfig: null,
      pageData: {},
    };
  }

  getAll() {
    return { ...this.data };
  }
}

describe('State', () => {
  let state;

  beforeEach(() => {
    state = new State();
  });

  describe('get()', () => {
    it('devrait récupérer une valeur d\'état', () => {
      expect(state.get('currentLanguage')).toBe('es');
      expect(state.get('currentRoute')).toBe('/');
    });

    it('devrait retourner undefined pour clé inexistante', () => {
      expect(state.get('nonexistent')).toBeUndefined();
    });
  });

  describe('set()', () => {
    it('devrait mettre à jour une valeur d\'état', () => {
      state.set('currentLanguage', 'en');
      expect(state.get('currentLanguage')).toBe('en');
    });

    it('ne devrait pas notifier si valeur identique', () => {
      const listener = vi.fn();
      state.subscribe('currentLanguage', listener);
      state.set('currentLanguage', 'es');
      expect(listener).not.toHaveBeenCalled();
    });

    it('devrait notifier les listeners lors du changement', () => {
      const listener = vi.fn();
      state.subscribe('currentLanguage', listener);
      state.set('currentLanguage', 'en');
      expect(listener).toHaveBeenCalledWith('en', 'es');
    });
  });

  describe('setMultiple()', () => {
    it('devrait mettre à jour plusieurs valeurs', () => {
      state.setMultiple({
        currentLanguage: 'fr',
        menuOpen: true,
        isLoading: true
      });
      expect(state.get('currentLanguage')).toBe('fr');
      expect(state.get('menuOpen')).toBe(true);
      expect(state.get('isLoading')).toBe(true);
    });

    it('devrait notifier les listeners pour chaque changement', () => {
      const langListener = vi.fn();
      const menuListener = vi.fn();
      state.subscribe('currentLanguage', langListener);
      state.subscribe('menuOpen', menuListener);

      state.setMultiple({
        currentLanguage: 'en',
        menuOpen: true
      });

      expect(langListener).toHaveBeenCalledWith('en', 'es');
      expect(menuListener).toHaveBeenCalledWith(true, false);
    });
  });

  describe('subscribe()', () => {
    it('devrait s\'abonner aux changements', () => {
      const listener = vi.fn();
      state.subscribe('currentLanguage', listener);
      state.set('currentLanguage', 'en');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('devrait retourner une fonction de désabonnement', () => {
      const listener = vi.fn();
      const unsubscribe = state.subscribe('currentLanguage', listener);
      expect(typeof unsubscribe).toBe('function');
    });

    it('devrait permettre le désabonnement', () => {
      const listener = vi.fn();
      const unsubscribe = state.subscribe('currentLanguage', listener);

      state.set('currentLanguage', 'en');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      state.set('currentLanguage', 'fr');
      expect(listener).toHaveBeenCalledTimes(1); // Pas appelé après unsubscribe
    });

    it('devrait supporter plusieurs listeners sur la même clé', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      state.subscribe('currentLanguage', listener1);
      state.subscribe('currentLanguage', listener2);

      state.set('currentLanguage', 'en');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('_notifyListeners()', () => {
    it('devrait appeler tous les listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      state.subscribe('test', listener1);
      state.subscribe('test', listener2);

      state.set('test', 'value');
      expect(listener1).toHaveBeenCalledWith('value', undefined);
      expect(listener2).toHaveBeenCalledWith('value', undefined);
    });

    it('devrait gérer les erreurs dans les callbacks', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      state.subscribe('test', errorListener);
      state.subscribe('test', goodListener);

      // Ne devrait pas throw, mais continuer avec les autres listeners
      expect(() => state.set('test', 'value')).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });

    it('ne devrait rien faire si pas de listeners', () => {
      expect(() => state.set('test', 'value')).not.toThrow();
    });
  });

  describe('reset()', () => {
    it('devrait réinitialiser l\'état', () => {
      state.set('currentRoute', '/gallery');
      state.set('menuOpen', true);
      state.set('isLoading', true);

      state.reset();

      expect(state.get('currentRoute')).toBe('/');
      expect(state.get('menuOpen')).toBe(false);
      expect(state.get('isLoading')).toBe(false);
    });

    it('devrait garder la langue actuelle', () => {
      state.set('currentLanguage', 'en');
      state.reset();
      expect(state.get('currentLanguage')).toBe('en');
    });
  });

  describe('getAll()', () => {
    it('devrait retourner une copie de l\'état complet', () => {
      const allState = state.getAll();
      expect(allState).toHaveProperty('currentLanguage');
      expect(allState).toHaveProperty('currentRoute');
      expect(allState).toHaveProperty('menuOpen');
    });

    it('devrait retourner une copie, pas la référence', () => {
      const allState = state.getAll();
      allState.currentLanguage = 'modified';
      expect(state.get('currentLanguage')).toBe('es');
    });
  });
});
