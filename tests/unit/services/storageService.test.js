import { describe, it, expect, beforeEach } from 'vitest';

// Simple StorageService class for testing
class StorageService {
  constructor() {
    this.prefix = 'photo_andalou_';
    this.isAvailable = this._checkAvailability();
    this.memoryFallback = new Map();
  }

  _checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

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
      return defaultValue;
    }
  }

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

  has(key) {
    const prefixedKey = this._getKey(key);
    if (this.isAvailable) {
      return localStorage.getItem(prefixedKey) !== null;
    } else {
      return this.memoryFallback.has(prefixedKey);
    }
  }

  clear() {
    try {
      if (this.isAvailable) {
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith(this.prefix)
        );
        keys.forEach((key) => localStorage.removeItem(key));
      } else {
        this.memoryFallback.clear();
      }
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
    }
  }

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
      return [];
    }
  }
}

describe('StorageService', () => {
  let storageService;

  beforeEach(() => {
    localStorage.clear();
    storageService = new StorageService();
  });

  describe('_checkAvailability()', () => {
    it('devrait détecter que localStorage est disponible', () => {
      expect(storageService.isAvailable).toBe(true);
    });
  });

  describe('_getKey()', () => {
    it('devrait ajouter le préfixe à la clé', () => {
      const key = storageService._getKey('test');
      expect(key).toBe('photo_andalou_test');
    });
  });

  describe('set()', () => {
    it('devrait sauvegarder une string', () => {
      storageService.set('test', 'value');
      expect(localStorage.getItem('photo_andalou_test')).toBe('"value"');
    });

    it('devrait sauvegarder un number', () => {
      storageService.set('count', 42);
      expect(localStorage.getItem('photo_andalou_count')).toBe('42');
    });

    it('devrait sauvegarder un object', () => {
      const obj = { name: 'John', age: 30 };
      storageService.set('user', obj);
      const stored = JSON.parse(localStorage.getItem('photo_andalou_user'));
      expect(stored).toEqual(obj);
    });

    it('devrait sauvegarder un array', () => {
      const arr = [1, 2, 3];
      storageService.set('numbers', arr);
      const stored = JSON.parse(localStorage.getItem('photo_andalou_numbers'));
      expect(stored).toEqual(arr);
    });

    it('devrait sauvegarder un boolean', () => {
      storageService.set('isActive', true);
      expect(localStorage.getItem('photo_andalou_isActive')).toBe('true');
    });
  });

  describe('get()', () => {
    it('devrait récupérer une string', () => {
      storageService.set('test', 'value');
      expect(storageService.get('test')).toBe('value');
    });

    it('devrait récupérer un object', () => {
      const obj = { name: 'John' };
      storageService.set('user', obj);
      expect(storageService.get('user')).toEqual(obj);
    });

    it('devrait retourner defaultValue si clé inexistante', () => {
      expect(storageService.get('nonexistent', 'default')).toBe('default');
    });

    it('devrait retourner null par défaut si clé inexistante', () => {
      expect(storageService.get('nonexistent')).toBeNull();
    });
  });

  describe('remove()', () => {
    it('devrait supprimer une clé', () => {
      storageService.set('test', 'value');
      expect(storageService.has('test')).toBe(true);

      storageService.remove('test');
      expect(storageService.has('test')).toBe(false);
    });

    it('ne devrait pas throw si clé inexistante', () => {
      expect(() => storageService.remove('nonexistent')).not.toThrow();
    });
  });

  describe('has()', () => {
    it('devrait retourner true si clé existe', () => {
      storageService.set('test', 'value');
      expect(storageService.has('test')).toBe(true);
    });

    it('devrait retourner false si clé n\'existe pas', () => {
      expect(storageService.has('nonexistent')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('devrait supprimer toutes les clés avec préfixe', () => {
      storageService.set('key1', 'value1');
      storageService.set('key2', 'value2');
      storageService.set('key3', 'value3');

      storageService.clear();

      expect(storageService.has('key1')).toBe(false);
      expect(storageService.has('key2')).toBe(false);
      expect(storageService.has('key3')).toBe(false);
    });

    it('ne devrait pas supprimer les clés sans préfixe', () => {
      localStorage.setItem('other_key', 'value');
      storageService.set('my_key', 'value');

      storageService.clear();

      expect(localStorage.getItem('other_key')).toBe('value');
      expect(storageService.has('my_key')).toBe(false);
    });
  });

  describe('getAllKeys()', () => {
    it('devrait retourner toutes les clés sans préfixe', () => {
      storageService.set('key1', 'value1');
      storageService.set('key2', 'value2');
      storageService.set('key3', 'value3');

      const keys = storageService.getAllKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('devrait retourner un tableau vide si aucune clé', () => {
      const keys = storageService.getAllKeys();
      expect(keys).toEqual([]);
    });

    it('ne devrait pas inclure les clés sans préfixe', () => {
      localStorage.setItem('other_key', 'value');
      storageService.set('my_key', 'value');

      const keys = storageService.getAllKeys();
      expect(keys).toHaveLength(1);
      expect(keys).toContain('my_key');
      expect(keys).not.toContain('other_key');
    });
  });
});
