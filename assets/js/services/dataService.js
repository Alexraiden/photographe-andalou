/**
 * Data Service
 *
 * Service de chargement des données JSON (CMS-ready)
 * Architecture prête pour migration vers API backend
 *
 * Aujourd'hui : fetch('/data/collections.json')
 * Demain    : fetch('/api/collections')
 */

class DataService {
  constructor() {
    // Base URL pour les données
    // En production avec CMS : this.baseUrl = '/api'
    this.baseUrl = '/data';

    // Cache en mémoire pour éviter les requêtes multiples
    this.cache = new Map();

    // Headers pour les requêtes (utile pour future auth)
    this.headers = {
      'Content-Type': 'application/json',
    };

    // Token d'authentification (pour future migration CMS)
    this.authToken = null;

    // Debug mode
    this.debug = false;
  }

  /**
   * Récupère des données depuis un endpoint
   * @private
   * @param {string} endpoint - Nom de l'endpoint (ex: 'collections')
   * @returns {Promise<Object>} Données récupérées
   */
  async fetch(endpoint) {
    // Vérifie le cache d'abord
    if (this.cache.has(endpoint)) {
      if (this.debug) {
        console.log(`[DataService] Cache hit: ${endpoint}`);
      }
      return this.cache.get(endpoint);
    }

    try {
      if (this.debug) {
        console.log(`[DataService] Fetching: ${endpoint}`);
      }

      const url = `${this.baseUrl}/${endpoint}.json`;

      // Headers avec auth token si présent
      const headers = { ...this.headers };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Mise en cache
      this.cache.set(endpoint, data);

      if (this.debug) {
        console.log(`[DataService] Loaded ${endpoint}:`, data);
      }

      return data;
    } catch (error) {
      console.error(`[DataService] Error fetching ${endpoint}:`, error);
      throw new Error(`Failed to load ${endpoint}: ${error.message}`);
    }
  }

  /**
   * Récupère la configuration globale du site
   * @returns {Promise<Object>} Configuration du site
   */
  async getSiteConfig() {
    return await this.fetch('site');
  }

  /**
   * Récupère toutes les collections
   * @returns {Promise<Array>} Liste des collections
   */
  async getCollections() {
    const data = await this.fetch('collections');
    return data.collections || [];
  }

  /**
   * Récupère une collection par ID ou slug
   * @param {string} identifier - ID ou slug de la collection
   * @returns {Promise<Object|null>} Collection trouvée ou null
   */
  async getCollection(identifier) {
    const collections = await this.getCollections();
    return (
      collections.find(
        (c) => c.id === identifier || c.slug === identifier
      ) || null
    );
  }

  /**
   * Récupère les collections featured (mises en avant)
   * @returns {Promise<Array>} Collections featured
   */
  async getFeaturedCollections() {
    const collections = await this.getCollections();
    return collections.filter((c) => c.featured === true);
  }

  /**
   * Récupère toutes les images
   * @returns {Promise<Array>} Liste de toutes les images
   */
  async getAllImages() {
    const data = await this.fetch('images');
    return data.images || [];
  }

  /**
   * Récupère les images d'une collection
   * @param {string} collectionId - ID de la collection
   * @returns {Promise<Array>} Images de la collection
   */
  async getCollectionImages(collectionId) {
    const allImages = await this.getAllImages();
    return allImages.filter((img) => img.collectionId === collectionId);
  }

  /**
   * Récupère une image par ID
   * @param {string} imageId - ID de l'image
   * @returns {Promise<Object|null>} Image trouvée ou null
   */
  async getImage(imageId) {
    const allImages = await this.getAllImages();
    return allImages.find((img) => img.id === imageId) || null;
  }

  /**
   * Récupère les images featured d'une collection
   * @param {string} collectionId - ID de la collection
   * @param {number} limit - Nombre maximum d'images
   * @returns {Promise<Array>} Images featured
   */
  async getFeaturedImages(collectionId, limit = 3) {
    const images = await this.getCollectionImages(collectionId);
    return images.filter((img) => img.featured).slice(0, limit);
  }

  /**
   * Récupère les données d'une page
   * @param {string} pageId - ID de la page (home, about, cabo, contact)
   * @returns {Promise<Object>} Données de la page
   */
  async getPageData(pageId) {
    const data = await this.fetch('pages');
    return data[pageId] || {};
  }

  /**
   * Récupère la structure de navigation
   * @returns {Promise<Object>} Données de navigation
   */
  async getNavigation() {
    return await this.fetch('navigation');
  }

  /**
   * Récupère l'image suivante dans une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} currentImageId - ID de l'image actuelle
   * @returns {Promise<Object|null>} Image suivante ou null
   */
  async getNextImage(collectionId, currentImageId) {
    const images = await this.getCollectionImages(collectionId);
    const currentIndex = images.findIndex((img) => img.id === currentImageId);

    if (currentIndex === -1 || currentIndex === images.length - 1) {
      return null;
    }

    return images[currentIndex + 1];
  }

  /**
   * Récupère l'image précédente dans une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} currentImageId - ID de l'image actuelle
   * @returns {Promise<Object|null>} Image précédente ou null
   */
  async getPreviousImage(collectionId, currentImageId) {
    const images = await this.getCollectionImages(collectionId);
    const currentIndex = images.findIndex((img) => img.id === currentImageId);

    if (currentIndex <= 0) {
      return null;
    }

    return images[currentIndex - 1];
  }

  /**
   * Vide le cache (utile pour refresh ou dev)
   */
  clearCache() {
    this.cache.clear();
    if (this.debug) {
      console.log('[DataService] Cache cleared');
    }
  }

  /**
   * Vide le cache d'un endpoint spécifique
   * @param {string} endpoint - Nom de l'endpoint
   */
  clearCacheFor(endpoint) {
    this.cache.delete(endpoint);
    if (this.debug) {
      console.log(`[DataService] Cache cleared for: ${endpoint}`);
    }
  }

  /**
   * Configure le token d'authentification (pour future CMS)
   * @param {string} token - Token JWT
   */
  setAuthToken(token) {
    this.authToken = token;
    if (this.debug) {
      console.log('[DataService] Auth token set');
    }
  }

  /**
   * Configure l'URL de base (pour future CMS)
   * @param {string} url - URL de base de l'API
   */
  setBaseUrl(url) {
    this.baseUrl = url;
    this.clearCache(); // Vide le cache car l'URL change
    if (this.debug) {
      console.log(`[DataService] Base URL changed to: ${url}`);
    }
  }

  /**
   * Active/désactive le mode debug
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[DataService] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Précharge des données critiques (appelé au démarrage de l'app)
   * @returns {Promise<void>}
   */
  async preloadCriticalData() {
    try {
      if (this.debug) {
        console.log('[DataService] Preloading critical data...');
      }

      await Promise.all([
        this.getSiteConfig(),
        this.getCollections(),
        this.getNavigation(),
      ]);

      if (this.debug) {
        console.log('[DataService] Critical data preloaded');
      }
    } catch (error) {
      console.error('[DataService] Error preloading critical data:', error);
      throw error;
    }
  }
}

// Instance singleton
export const dataService = new DataService();

// Expose dans window pour debug en dev
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__DATA_SERVICE__ = dataService;
  dataService.setDebug(true);
}
