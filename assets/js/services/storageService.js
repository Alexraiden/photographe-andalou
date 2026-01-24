/**
 * Storage Service
 *
 * Service pour gérer localStorage de manière sécurisée
 * avec fallback si localStorage n'est pas disponible
 */

class StorageService {
  constructor() {
    this.prefix = 'photo_andalou_'; // Préfixe pour éviter les conflits
    this.isAvailable = this._checkAvailability();
    this.memoryFallback = new Map(); // Fallback en mémoire si localStorage indisponible
  }

  /**
   * Vérifie si localStorage est disponible
   * @private
   * @returns {boolean}
   */
  _checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[StorageService] localStorage not available, using memory fallback');
      return false;
    }
  }

  /**
   * Génère la clé avec préfixe
   * @private
   * @param {string} key
   * @returns {string}
   */
  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Sauvegarde une valeur
   * @param {string} key - Clé
   * @param {*} value - Valeur (sera stringify si objet)
   */
  set(key, value) {
    const prefixedKey = this._getKey(key);

    try {
      const stringValue = JSON.stringify(value);

      if (this.isAvailable) {
        localStorage.setItem(prefixedKey, stringValue);
      } else {
        this.memoryFallback.set(prefixedKey, stringValue);
      }
    } catch (error) {
      console.error(`[StorageService] Error setting ${key}:`, error);
    }
  }

  /**
   * Récupère une valeur
   * @param {string} key - Clé
   * @param {*} defaultValue - Valeur par défaut si clé inexistante
   * @returns {*} Valeur récupérée ou defaultValue
   */
  get(key, defaultValue = null) {
    const prefixedKey = this._getKey(key);

    try {
      let stringValue;

      if (this.isAvailable) {
        stringValue = localStorage.getItem(prefixedKey);
      } else {
        stringValue = this.memoryFallback.get(prefixedKey);
      }

      if (stringValue === null || stringValue === undefined) {
        return defaultValue;
      }

      return JSON.parse(stringValue);
    } catch (error) {
      console.error(`[StorageService] Error getting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Supprime une valeur
   * @param {string} key - Clé
   */
  remove(key) {
    const prefixedKey = this._getKey(key);

    try {
      if (this.isAvailable) {
        localStorage.removeItem(prefixedKey);
      } else {
        this.memoryFallback.delete(prefixedKey);
      }
    } catch (error) {
      console.error(`[StorageService] Error removing ${key}:`, error);
    }
  }

  /**
   * Vérifie si une clé existe
   * @param {string} key - Clé
   * @returns {boolean}
   */
  has(key) {
    const prefixedKey = this._getKey(key);

    if (this.isAvailable) {
      return localStorage.getItem(prefixedKey) !== null;
    } else {
      return this.memoryFallback.has(prefixedKey);
    }
  }

  /**
   * Vide tout le storage (seulement les clés avec notre préfixe)
   */
  clear() {
    try {
      if (this.isAvailable) {
        // Récupère toutes les clés avec notre préfixe
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith(this.prefix)
        );

        // Supprime chaque clé
        keys.forEach((key) => localStorage.removeItem(key));
      } else {
        this.memoryFallback.clear();
      }

      console.log('[StorageService] Storage cleared');
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
    }
  }

  /**
   * Récupère toutes les clés stockées
   * @returns {Array<string>} Liste des clés (sans préfixe)
   */
  getAllKeys() {
    try {
      if (this.isAvailable) {
        return Object.keys(localStorage)
          .filter((key) => key.startsWith(this.prefix))
          .map((key) => key.replace(this.prefix, ''));
      } else {
        return Array.from(this.memoryFallback.keys()).map((key) =>
          key.replace(this.prefix, '')
        );
      }
    } catch (error) {
      console.error('[StorageService] Error getting all keys:', error);
      return [];
    }
  }
}

// Instance singleton
export const storageService = new StorageService();
