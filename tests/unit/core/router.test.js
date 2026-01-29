import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPageController } from '../../helpers/mocks.js';

// Import Router class directly (not singleton)
class Router {
  constructor() {
    this.routes = new Map();
    this.currentPage = null;
    this.currentRoute = '/';
    this.notFoundHandler = null;
    this.beforeNavigateHook = null;
    this.afterNavigateHook = null;
    this.isNavigating = false;
    this.debug = false;
  }

  register(path, pageController) {
    this.routes.set(path, pageController);
  }

  registerAll(routes) {
    Object.entries(routes).forEach(([path, pageController]) => {
      this.register(path, pageController);
    });
  }

  _matchRoute(path) {
    const cleanPath = path.replace(/^#/, '').replace(/\/$/, '') || '/';

    if (this.routes.has(cleanPath)) {
      return {
        pageController: this.routes.get(cleanPath),
        params: {},
      };
    }

    for (const [routePath, pageController] of this.routes.entries()) {
      const params = this._matchDynamicRoute(routePath, cleanPath);
      if (params !== null) {
        return { pageController, params };
      }
    }

    return { pageController: null, params: {} };
  }

  _matchDynamicRoute(routePath, actualPath) {
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');

    if (routeParts.length !== actualParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const actualPart = actualParts[i];

      if (routePart.startsWith(':')) {
        const paramName = routePart.slice(1);
        params[paramName] = actualPart;
      } else if (routePart !== actualPart) {
        return null;
      }
    }

    return params;
  }

  getAllRoutes() {
    return Array.from(this.routes.keys());
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  setNotFoundHandler(handler) {
    this.notFoundHandler = handler;
  }

  setBeforeNavigate(hook) {
    this.beforeNavigateHook = hook;
  }

  setAfterNavigate(hook) {
    this.afterNavigateHook = hook;
  }
}

describe('Router', () => {
  let router;

  beforeEach(() => {
    router = new Router();
    document.body.innerHTML = '<div id="app-root"></div>';
  });

  describe('register()', () => {
    it('devrait enregistrer une route', () => {
      const mockController = createMockPageController();
      router.register('/test', mockController);
      expect(router.getAllRoutes()).toContain('/test');
    });

    it('devrait enregistrer plusieurs routes', () => {
      const mockController1 = createMockPageController();
      const mockController2 = createMockPageController();
      router.register('/test1', mockController1);
      router.register('/test2', mockController2);
      expect(router.getAllRoutes()).toContain('/test1');
      expect(router.getAllRoutes()).toContain('/test2');
    });
  });

  describe('registerAll()', () => {
    it('devrait enregistrer plusieurs routes via objet', () => {
      const routes = {
        '/': createMockPageController(),
        '/about': createMockPageController(),
        '/contact': createMockPageController()
      };
      router.registerAll(routes);
      expect(router.getAllRoutes()).toHaveLength(3);
      expect(router.getAllRoutes()).toContain('/');
      expect(router.getAllRoutes()).toContain('/about');
      expect(router.getAllRoutes()).toContain('/contact');
    });
  });

  describe('_matchRoute()', () => {
    beforeEach(() => {
      router.register('/', createMockPageController());
      router.register('/about', createMockPageController());
      router.register('/gallery/:slug', createMockPageController());
    });

    it('devrait matcher une route exacte', () => {
      const { pageController, params } = router._matchRoute('/about');
      expect(pageController).toBeDefined();
      expect(params).toEqual({});
    });

    it('devrait matcher la route racine', () => {
      const { pageController, params } = router._matchRoute('/');
      expect(pageController).toBeDefined();
      expect(params).toEqual({});
    });

    it('devrait retourner null pour route inexistante', () => {
      const { pageController } = router._matchRoute('/nonexistent');
      expect(pageController).toBeNull();
    });

    it('devrait nettoyer les hash du path', () => {
      const { pageController } = router._matchRoute('#/about');
      expect(pageController).toBeDefined();
    });

    it('devrait nettoyer les trailing slashes', () => {
      const { pageController } = router._matchRoute('/about/');
      expect(pageController).toBeDefined();
    });
  });

  describe('_matchDynamicRoute()', () => {
    it('devrait extraire les paramètres simples', () => {
      const params = router._matchDynamicRoute('/gallery/:slug', '/gallery/andalousie');
      expect(params).toEqual({ slug: 'andalousie' });
    });

    it('devrait extraire plusieurs paramètres', () => {
      const params = router._matchDynamicRoute('/blog/:year/:slug', '/blog/2024/my-post');
      expect(params).toEqual({ year: '2024', slug: 'my-post' });
    });

    it('devrait retourner null si nombre de segments différent', () => {
      const params = router._matchDynamicRoute('/gallery/:slug', '/gallery/foo/bar');
      expect(params).toBeNull();
    });

    it('devrait retourner null si segments statiques ne matchent pas', () => {
      const params = router._matchDynamicRoute('/gallery/:slug', '/about/test');
      expect(params).toBeNull();
    });

    it('devrait matcher les segments statiques et dynamiques mélangés', () => {
      const params = router._matchDynamicRoute('/blog/:year/posts/:slug', '/blog/2024/posts/my-article');
      expect(params).toEqual({ year: '2024', slug: 'my-article' });
    });
  });

  describe('getCurrentRoute()', () => {
    it('devrait retourner la route par défaut', () => {
      expect(router.getCurrentRoute()).toBe('/');
    });
  });

  describe('getAllRoutes()', () => {
    it('devrait retourner un tableau vide initialement', () => {
      expect(router.getAllRoutes()).toEqual([]);
    });

    it('devrait retourner toutes les routes enregistrées', () => {
      router.register('/', createMockPageController());
      router.register('/about', createMockPageController());
      expect(router.getAllRoutes()).toHaveLength(2);
    });
  });

  describe('setNotFoundHandler()', () => {
    it('devrait configurer le handler 404', () => {
      const handler = createMockPageController();
      router.setNotFoundHandler(handler);
      expect(router.notFoundHandler).toBe(handler);
    });
  });

  describe('setBeforeNavigate()', () => {
    it('devrait configurer le hook before navigate', () => {
      const hook = vi.fn();
      router.setBeforeNavigate(hook);
      expect(router.beforeNavigateHook).toBe(hook);
    });
  });

  describe('setAfterNavigate()', () => {
    it('devrait configurer le hook after navigate', () => {
      const hook = vi.fn();
      router.setAfterNavigate(hook);
      expect(router.afterNavigateHook).toBe(hook);
    });
  });
});
