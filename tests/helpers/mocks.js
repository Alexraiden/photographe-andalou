import { vi } from 'vitest';

/**
 * Mock fetch avec réponse personnalisée
 */
export function mockFetch(data, options = {}) {
  const { status = 200, ok = true } = options;

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    })
  );
}

/**
 * Mock fetch avec erreur
 */
export function mockFetchError(error) {
  global.fetch = vi.fn(() => Promise.reject(error));
}

/**
 * Mock d'un contrôleur de page pour le router
 */
export function createMockPageController() {
  return class MockPageController {
    constructor(options = {}) {
      this.options = options;
      this.initialized = false;
      this.destroyed = false;
    }

    async init() {
      this.initialized = true;
      document.getElementById('app-root').innerHTML = '<div class="mock-page">Mock Page</div>';
    }

    destroy() {
      this.destroyed = true;
    }
  };
}

/**
 * Mock traductions pour i18n
 */
export const mockTranslations = {
  es: {
    home: {
      hero: {
        title: 'Título en Español',
        subtitle: 'Subtítulo en Español'
      }
    },
    nav: {
      home: 'Inicio',
      gallery: 'Galería',
      about: 'Acerca de',
      contact: 'Contacto'
    }
  },
  en: {
    home: {
      hero: {
        title: 'English Title',
        subtitle: 'English Subtitle'
      }
    },
    nav: {
      home: 'Home',
      gallery: 'Gallery',
      about: 'About',
      contact: 'Contact'
    }
  },
  fr: {
    home: {
      hero: {
        title: 'Titre en Français',
        subtitle: 'Sous-titre en Français'
      }
    },
    nav: {
      home: 'Accueil',
      gallery: 'Galerie',
      about: 'À propos',
      contact: 'Contact'
    }
  }
};

/**
 * Mock JWT token
 */
export const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MDAwMDAwMDB9.test';
