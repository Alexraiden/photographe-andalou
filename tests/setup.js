import { beforeAll, afterEach, vi } from 'vitest';

// Mock localStorage pour tests frontend
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
    // Make keys enumerable for Object.keys()
    this[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
    delete this[key];
  }

  clear() {
    // Remove all enumerable properties
    Object.keys(this).forEach(key => {
      if (key !== 'store') {
        delete this[key];
      }
    });
    this.store = {};
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

global.localStorage = new LocalStorageMock();

// Mock fetch global
global.fetch = vi.fn();

// Mock window.location pour tests de routing
delete window.location;
window.location = {
  hash: '',
  hostname: 'localhost',
  href: 'http://localhost:8000/',
  pathname: '/',
  protocol: 'http:',
  search: ''
};

// Reset mocks après chaque test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  window.location.hash = '';
});
