/**
 * Client-Side Router
 *
 * Système de routing hash-based pour SPA
 * Gère les transitions de pages et l'historique
 */

import { state } from './state.js';

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

  /**
   * Enregistre une route
   * @param {string} path - Chemin de la route (ex: "/", "/about", "/gallery/:slug")
   * @param {Function} pageController - Constructeur de la page
   */
  register(path, pageController) {
    this.routes.set(path, pageController);

    if (this.debug) {
      console.log(`[Router] Route registered: ${path}`);
    }
  }

  /**
   * Enregistre plusieurs routes
   * @param {Object} routes - Objet {path: PageController}
   */
  registerAll(routes) {
    Object.entries(routes).forEach(([path, pageController]) => {
      this.register(path, pageController);
    });
  }

  /**
   * Configure le handler 404
   * @param {Function} handler - Constructeur de la page 404
   */
  setNotFoundHandler(handler) {
    this.notFoundHandler = handler;
  }

  /**
   * Configure un hook avant navigation
   * @param {Function} hook - Fonction appelée avant navigation (peut bloquer)
   */
  setBeforeNavigate(hook) {
    this.beforeNavigateHook = hook;
  }

  /**
   * Configure un hook après navigation
   * @param {Function} hook - Fonction appelée après navigation
   */
  setAfterNavigate(hook) {
    this.afterNavigateHook = hook;
  }

  /**
   * Navigue vers une route
   * @param {string} path - Chemin de destination
   * @param {boolean} addToHistory - Ajouter à l'historique du navigateur
   * @param {Object} state - État supplémentaire à passer
   */
  async navigate(path, addToHistory = true, stateData = {}) {
    // Empêche les navigations multiples simultanées
    if (this.isNavigating) {
      if (this.debug) {
        console.warn('[Router] Navigation already in progress');
      }
      return;
    }

    this.isNavigating = true;

    try {
      if (this.debug) {
        console.log(`[Router] Navigating to: ${path}`);
      }

      // Hook before navigate (peut annuler la navigation)
      if (this.beforeNavigateHook) {
        const canNavigate = await this.beforeNavigateHook(path, this.currentRoute);
        if (!canNavigate) {
          if (this.debug) {
            console.log('[Router] Navigation cancelled by hook');
          }
          this.isNavigating = false;
          return;
        }
      }

      // Parse la route et trouve le controller
      const { pageController, params } = this._matchRoute(path);

      if (!pageController) {
        console.error(`[Router] No route found for: ${path}`);
        this._handle404();
        this.isNavigating = false;
        return;
      }

      // Détruit la page actuelle
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        this.currentPage.destroy();
      }

      // Scroll en haut de la page
      window.scrollTo(0, 0);

      // Animation de transition
      await this._animateTransitionOut();

      // Crée la nouvelle page
      this.currentPage = new pageController({ params, route: path });
      this.currentRoute = path;

      // Met à jour l'état global
      state.set('currentRoute', path);

      // Met à jour l'URL
      if (addToHistory) {
        window.location.hash = path;
      }

      // Initialise la page
      if (typeof this.currentPage.init === 'function') {
        await this.currentPage.init();
      } else {
        console.warn(`[Router] Page controller for ${path} has no init method`);
      }

      // Animation de transition
      await this._animateTransitionIn();

      // Hook after navigate
      if (this.afterNavigateHook) {
        await this.afterNavigateHook(path, this.currentRoute);
      }

      if (this.debug) {
        console.log(`[Router] Navigation complete: ${path}`);
      }
    } catch (error) {
      console.error('[Router] Navigation error:', error);
      this._handle404();
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Match une route avec les routes enregistrées
   * @private
   * @param {string} path - Chemin à matcher
   * @returns {Object} {pageController, params}
   */
  _matchRoute(path) {
    // Nettoie le path
    const cleanPath = path.replace(/^#/, '').replace(/\/$/, '') || '/';

    // Cherche d'abord une correspondance exacte
    if (this.routes.has(cleanPath)) {
      return {
        pageController: this.routes.get(cleanPath),
        params: {},
      };
    }

    // Cherche une correspondance avec paramètres dynamiques
    for (const [routePath, pageController] of this.routes.entries()) {
      const params = this._matchDynamicRoute(routePath, cleanPath);
      if (params !== null) {
        return { pageController, params };
      }
    }

    return { pageController: null, params: {} };
  }

  /**
   * Match une route avec paramètres dynamiques (/gallery/:slug)
   * @private
   * @param {string} routePath - Pattern de route avec :param
   * @param {string} actualPath - Chemin réel
   * @returns {Object|null} Params extraits ou null
   */
  _matchDynamicRoute(routePath, actualPath) {
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');

    // Nombre de segments doit correspondre
    if (routeParts.length !== actualParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const actualPart = actualParts[i];

      // Param dynamique (:slug)
      if (routePart.startsWith(':')) {
        const paramName = routePart.slice(1);
        params[paramName] = actualPart;
      }
      // Doit correspondre exactement
      else if (routePart !== actualPart) {
        return null;
      }
    }

    return params;
  }

  /**
   * Gère la page 404
   * @private
   */
  _handle404() {
    if (this.notFoundHandler) {
      this.currentPage = new this.notFoundHandler();
      if (typeof this.currentPage.init === 'function') {
        this.currentPage.init();
      }
    } else {
      document.getElementById('app-root').innerHTML = `
        <div class="container section text-center">
          <h1 class="display-1">404</h1>
          <p class="text-lead">Page non trouvée</p>
          <a href="#/" class="btn-primary" data-route="/">Retour à l'accueil</a>
        </div>
      `;
    }
  }

  /**
   * Animation de transition sortante (fade out)
   * @private
   */
  async _animateTransitionOut() {
    const appRoot = document.getElementById('app-root');

    return new Promise((resolve) => {
      appRoot.style.opacity = '1';
      appRoot.style.transition = 'opacity 0.3s ease-out';

      requestAnimationFrame(() => {
        appRoot.style.opacity = '0';

        setTimeout(() => {
          resolve();
        }, 300);
      });
    });
  }

  /**
   * Animation de transition entrante (fade in)
   * @private
   */
  async _animateTransitionIn() {
    const appRoot = document.getElementById('app-root');

    return new Promise((resolve) => {
      appRoot.style.opacity = '0';

      requestAnimationFrame(() => {
        appRoot.style.opacity = '1';

        setTimeout(() => {
          appRoot.style.transition = '';
          resolve();
        }, 300);
      });
    });
  }

  /**
   * Initialise le router (écoute les événements)
   */
  init() {
    if (this.debug) {
      console.log('[Router] Initializing...');
    }

    // Écoute les changements d'URL (boutons back/forward)
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.slice(1) || '/';
      this.navigate(path, false);
    });

    // Intercepte les clics sur les liens internes
    document.addEventListener('click', (e) => {
      // Cherche le lien le plus proche (bubble up)
      const link = e.target.closest('a[href^="#"]');

      if (link) {
        e.preventDefault();
        const path = link.getAttribute('href').slice(1);
        this.navigate(path);
      }

      // Support pour attribut data-route
      const routeLink = e.target.closest('[data-route]');
      if (routeLink) {
        e.preventDefault();
        const path = routeLink.getAttribute('data-route');
        this.navigate(path);
      }
    });

    // Navigue vers la route initiale
    const initialPath = window.location.hash.slice(1) || '/';
    this.navigate(initialPath, false);

    if (this.debug) {
      console.log('[Router] Initialized');
    }
  }

  /**
   * Active/désactive le mode debug
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[Router] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Récupère la route actuelle
   * @returns {string}
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Récupère toutes les routes enregistrées
   * @returns {Array<string>}
   */
  getAllRoutes() {
    return Array.from(this.routes.keys());
  }

  /**
   * Force le reload de la page actuelle
   */
  async reload() {
    await this.navigate(this.currentRoute, false);
  }
}

// Instance singleton
export const router = new Router();

// Expose dans window pour debug en dev
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__ROUTER__ = router;
  router.setDebug(true);
}
