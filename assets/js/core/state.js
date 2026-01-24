/**
 * Global State Management
 *
 * Système de gestion d'état global avec pattern observer
 * Permet aux composants de s'abonner aux changements
 */

class State {
  constructor() {
    // État global de l'application
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

    // Map des listeners par clé d'état
    this.listeners = new Map();

    // Debug mode (activé en dev)
    this.debug = false;
  }

  /**
   * Récupère une valeur de l'état
   * @param {string} key - Clé de l'état
   * @returns {*} Valeur de l'état
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Met à jour l'état et notifie les listeners
   * @param {string} key - Clé de l'état
   * @param {*} value - Nouvelle valeur
   */
  set(key, value) {
    const oldValue = this.data[key];

    // Ne met à jour que si la valeur change
    if (oldValue === value) {
      return;
    }

    this.data[key] = value;

    // Log en mode debug
    if (this.debug) {
      console.log(`[State] ${key}:`, { old: oldValue, new: value });
    }

    // Notifie tous les listeners de cette clé
    this._notifyListeners(key, value, oldValue);
  }

  /**
   * Met à jour plusieurs valeurs d'état en une fois
   * @param {Object} updates - Objet avec les clés et valeurs à mettre à jour
   */
  setMultiple(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * S'abonne aux changements d'une clé d'état
   * @param {string} key - Clé de l'état
   * @param {Function} callback - Fonction appelée lors du changement
   * @returns {Function} Fonction pour se désabonner
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    const callbacks = this.listeners.get(key);
    callbacks.push(callback);

    if (this.debug) {
      console.log(`[State] Subscribed to "${key}". Total listeners: ${callbacks.length}`);
    }

    // Retourne une fonction pour se désabonner
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        if (this.debug) {
          console.log(`[State] Unsubscribed from "${key}". Remaining: ${callbacks.length}`);
        }
      }
    };
  }

  /**
   * Notifie tous les listeners d'une clé
   * @private
   */
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

  /**
   * Réinitialise l'état complet (utile pour déconnexion ou reset)
   */
  reset() {
    const currentLanguage = this.data.currentLanguage;

    this.data = {
      currentLanguage, // Garde la langue
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

    if (this.debug) {
      console.log('[State] State reset');
    }
  }

  /**
   * Active/désactive le mode debug
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[State] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Obtient l'état complet (utile pour debug)
   * @returns {Object} Copie de l'état complet
   */
  getAll() {
    return { ...this.data };
  }
}

// Instance singleton
export const state = new State();

// Expose state dans window pour debug en dev
if (import.meta.env?.MODE === 'development' || window.location.hostname === 'localhost') {
  window.__STATE__ = state;
  state.setDebug(true);
}
