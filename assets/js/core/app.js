/**
 * Application Bootstrap
 *
 * Point d'entrée principal de l'application
 * Initialise tous les systèmes : router, i18n, data service, composants
 */

import { state } from './state.js';
import { router } from './router.js';
import { i18n } from './i18n.js';
import { dataService } from '../services/dataService.js';

class App {
  constructor() {
    this.initialized = false;
    this.debug = true; // En production : false
  }

  /**
   * Initialise l'application
   */
  async init() {
    if (this.initialized) {
      console.warn('[App] Already initialized');
      return;
    }

    try {
      console.log('[App] Starting initialization...');

      // Affiche le loader
      this._showLoader();

      // Phase 1 : Initialise i18n (multi-langue)
      await this._initI18n();

      // Phase 2 : Précharge les données critiques
      await this._preloadData();

      // Phase 3 : Enregistre les routes
      this._registerRoutes();

      // Phase 4 : Initialise les composants globaux
      await this._initGlobalComponents();

      // Phase 5 : Démarre le router
      this._initRouter();

      // Cache le loader
      this._hideLoader();

      this.initialized = true;

      console.log('[App] Initialization complete ✓');
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      this._showError(error);
    }
  }

  /**
   * Initialise le système i18n
   * @private
   */
  async _initI18n() {
    console.log('[App] Initializing i18n...');

    try {
      await i18n.init();
      console.log(`[App] i18n initialized with language: ${i18n.getCurrentLanguage()}`);
    } catch (error) {
      console.error('[App] Failed to initialize i18n:', error);
      throw error;
    }
  }

  /**
   * Précharge les données critiques
   * @private
   */
  async _preloadData() {
    console.log('[App] Preloading critical data...');

    try {
      // Charge les données critiques en parallèle
      const [siteConfig, collections, navigation] = await Promise.all([
        dataService.getSiteConfig(),
        dataService.getCollections(),
        dataService.getNavigation(),
      ]);

      // Met à jour l'état global
      state.setMultiple({
        siteConfig,
        collections,
        navigationData: navigation,
      });

      console.log('[App] Critical data preloaded');
    } catch (error) {
      console.error('[App] Failed to preload data:', error);
      throw error;
    }
  }

  /**
   * Enregistre toutes les routes de l'application
   * @private
   */
  _registerRoutes() {
    console.log('[App] Registering routes...');

    // Import dynamique des pages pour éviter le chargement initial
    // En attendant les vraies pages, on crée des placeholders

    // Page d'accueil
    router.register('/', class HomePage {
      async init() {
        const appRoot = document.getElementById('app-root');
        const pageData = await dataService.getPageData('home');
        const collections = state.get('collections') || [];
        const allImages = await dataService.getAllImages();
        const featuredCollections = collections.filter(c =>
          pageData.featuredCollections.includes(c.id)
        );

        // Distribute images across 3 rows for carousel
        const row1Images = allImages.slice(0, Math.ceil(allImages.length / 3));
        const row2Images = allImages.slice(Math.ceil(allImages.length / 3), Math.ceil(allImages.length * 2 / 3));
        const row3Images = allImages.slice(Math.ceil(allImages.length * 2 / 3));

        const createCarouselRow = (images) => images.map(img => `
          <div class="gallery-carousel-item">
            <img src="${img.files?.small || img.src || '/assets/images/placeholder.svg'}"
                 alt="${img.title?.[i18n.getCurrentLanguage()] || img.alt || ''}"
                 loading="lazy">
          </div>
        `).join('');

        appRoot.innerHTML = `
          <div class="hero hero-fullscreen home-hero">
            <div class="hero-media">
              <img src="${pageData.hero.media.desktop}" alt="${i18n.t(pageData.hero.media.alt) || 'Hero'}" class="loaded">
            </div>
            <div class="hero-overlay dark"></div>
            <div class="hero-content">
              <h1 class="hero-title">${i18n.t(pageData.hero.titleKey)}</h1>
              <p class="hero-subtitle">${i18n.t(pageData.hero.subtitleKey)}</p>
            </div>
          </div>

          <section class="home-gallery">
            <div class="gallery-carousel">
              <div class="gallery-carousel-wrapper">
                <div class="gallery-carousel-row" data-row="0">${createCarouselRow(row1Images)}</div>
                <div class="gallery-carousel-row" data-row="1">${createCarouselRow(row2Images)}</div>
                <div class="gallery-carousel-row" data-row="2">${createCarouselRow(row3Images)}</div>
              </div>
              <button class="gallery-carousel-nav prev" aria-label="Previous">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button class="gallery-carousel-nav next" aria-label="Next">
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </section>

          <section class="home-collections">
            <div class="home-collections-header">
              <h2>Collections</h2>
            </div>
            <div class="cards-grid cols-3">
              ${featuredCollections.map(col => `
                <a href="#/gallery/${col.slug}" class="collection-card">
                  <div class="collection-card-image">
                    <img src="${col.coverImage.src}" alt="${i18n.t(col.coverImage.altKey) || col.slug}" class="loaded">
                  </div>
                  <div class="collection-card-content">
                    <h3 class="collection-card-title">${i18n.t(col.nameKey)}</h3>
                    <p class="collection-card-description">${i18n.t(col.descriptionKey)}</p>
                    <div class="collection-card-meta">
                      <span class="collection-card-count">${col.imageCount} photos</span>
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
          </section>
        `;

        // Initialize carousel navigation
        this._initCarousel();
      }

      _initCarousel() {
        const carousel = document.querySelector('.gallery-carousel');
        if (!carousel) return;

        const rows = carousel.querySelectorAll('.gallery-carousel-row');
        const prevBtn = carousel.querySelector('.gallery-carousel-nav.prev');
        const nextBtn = carousel.querySelector('.gallery-carousel-nav.next');
        const scrollAmount = 320;

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            rows.forEach(row => {
              row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            rows.forEach(row => {
              row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
          });
        }
      }

      destroy() {
        // Cleanup si nécessaire
      }
    });

    // Page galerie
    router.register('/gallery', class GalleryPage {
      async init() {
        const appRoot = document.getElementById('app-root');
        const collections = state.get('collections') || [];

        appRoot.innerHTML = `
          <div class="page gallery-page">
            <header class="page-header">
              <h1 class="page-title">${i18n.t('nav.gallery') || 'Galerie'}</h1>
              <p class="page-intro">${i18n.t('gallery.intro') || 'Découvrez mes collections photographiques'}</p>
            </header>

            <main class="page-body">
              <div class="cards-grid cols-2">
                ${collections.map(col => `
                  <a href="#/gallery/${col.slug}" class="collection-card">
                    <div class="collection-card-image">
                      <img src="${col.coverImage.src}" alt="${i18n.t(col.coverImage.altKey) || col.slug}" class="loaded">
                    </div>
                    <div class="collection-card-content">
                      <h3 class="collection-card-title">${i18n.t(col.nameKey) || col.slug}</h3>
                      <p class="collection-card-description">${i18n.t(col.descriptionKey) || ''}</p>
                      <div class="collection-card-meta">
                        <span class="collection-card-count">${col.imageCount} photos</span>
                        <span class="collection-card-link">Voir →</span>
                      </div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </main>
          </div>
        `;
      }

      destroy() {}
    });

    // Collection détaillée (route dynamique)
    router.register('/gallery/:slug', class CollectionPage {
      constructor({ params }) {
        this.slug = params.slug;
      }

      async init() {
        const appRoot = document.getElementById('app-root');
        const collection = await dataService.getCollection(this.slug);

        if (!collection) {
          appRoot.innerHTML = `
            <div class="container section text-center" style="margin-top: calc(var(--nav-height) + var(--spacing-xl));">
              <h1>Collection non trouvée</h1>
              <a href="#/gallery">← Retour à la galerie</a>
            </div>
          `;
          return;
        }

        const images = await dataService.getCollectionImages(collection.id);

        appRoot.innerHTML = `
          <div class="container section" style="margin-top: calc(var(--nav-height) + var(--spacing-xl));">
            <a href="#/gallery" class="text-accent mb-md block">← Retour</a>
            <h1 class="display-1 mb-md">${i18n.t(collection.nameKey)}</h1>
            <p class="text-lead mb-lg">${i18n.t(collection.descriptionKey)}</p>
            <p class="text-small text-tertiary mb-xl">${images.length} photos • ${collection.metadata.location}</p>

            <div class="gallery gallery-${collection.layout}">
              ${images.map(img => `
                <div class="gallery-item" data-aspect="${img.dimensions.aspectRatio}">
                  <img src="${img.files.small}" alt="${img.title[i18n.getCurrentLanguage()]}" class="loaded">
                  <div class="gallery-item-overlay">
                    <h4 class="gallery-item-title">${img.title[i18n.getCurrentLanguage()]}</h4>
                    <p class="gallery-item-caption">${img.description[i18n.getCurrentLanguage()]}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      destroy() {}
    });

    // Page Cabo de Gata
    router.register('/cabo-de-gata', class CaboPage {
      async init() {
        const appRoot = document.getElementById('app-root');
        appRoot.innerHTML = `
          <div class="page cabo-page">
            <header class="page-header">
              <h1 class="page-title">Cabo de Gata – Níjar</h1>
              <p class="page-intro">Un territoire où le désert rencontre la mer, où la lumière sculpte les volcans endormis.</p>
            </header>

            <main class="page-body">
              <section class="story-section">
                <h2>La Terre Brûlée</h2>
                <p>Le Parc Naturel de Cabo de Gata est le seul désert d'Europe. Ici, la roche volcanique affleure sous un soleil implacable. Les paysages lunaires s'étendent à perte de vue, ponctués de figuiers de Barbarie et d'agaves centenaires.</p>
                <p>Cette aridité fascinante contraste avec l'azur profond de la Méditerranée. Entre ces deux extrêmes, la vie s'accroche avec une beauté fragile.</p>
              </section>

              <section class="story-section">
                <h2>Villages Blancs</h2>
                <p>Las Negras, San José, La Isleta del Moro... Ces villages de pêcheurs semblent suspendus hors du temps. Leurs maisons blanches éclatent sous la lumière andalouse, leurs ruelles étroites gardent la fraîcheur des siestes d'été.</p>
                <p>Ici, le rythme est celui des marées et des saisons. La vie se déroule au ralenti, dans une harmonie avec l'environnement que peu d'endroits ont su préserver.</p>
              </section>

              <section class="story-section">
                <h2>La Lumière du Sud</h2>
                <p>C'est la lumière qui m'a capturé. Cette lumière méditerranéenne si particulière, dorée au lever du jour, aveuglante à midi, rose et pourpre au crépuscule. Elle transforme chaque pierre, chaque vague, chaque visage en une œuvre éphémère.</p>
                <p>Photographier Cabo de Gata, c'est capturer l'essence même du Sud : la chaleur, le silence, la beauté brute d'une terre qui résiste.</p>
              </section>
            </main>
          </div>
        `;
      }

      destroy() {}
    });

    // Page À propos
    router.register('/about', class AboutPage {
      async init() {
        const appRoot = document.getElementById('app-root');
        appRoot.innerHTML = `
          <div class="page about-page">
            <header class="page-header">
              <h1 class="page-title">${i18n.t('nav.about') || 'À propos'}</h1>
              <p class="page-intro">Photographe basé en Andalousie, mon travail explore la relation entre l'humain et le territoire.</p>
            </header>

            <main class="page-body">
              <section class="content-section">
                <h2>Une Fascination pour le Sud</h2>
                <p>Arrivé en Andalousie il y a dix ans, j'ai été immédiatement captivé par cette terre de contrastes. La Sierra Nevada enneigée qui domine les plages tropicales, les villages blancs accrochés aux falaises, le désert de Cabo de Gata qui plonge dans la Méditerranée.</p>
                <p>Ma photographie cherche à saisir cette essence andalouse : une lumière unique, des paysages extrêmes, et surtout, une culture vivante ancrée dans son environnement.</p>
              </section>

              <section class="content-section">
                <h2>Approche Photographique</h2>
                <p>Je privilégie la patience et l'immersion. Plutôt que de parcourir rapidement les lieux, je choisis d'y revenir, encore et encore, à différentes saisons, différentes heures du jour. C'est dans cette répétition que naît l'intimité avec un territoire.</p>
                <p>Mon approche mêle documentaire et poésie visuelle. Je cherche autant à témoigner de la réalité d'un lieu qu'à en révéler la dimension émotionnelle et sensorielle.</p>
              </section>

              <section class="content-section">
                <h2>Projets en Cours</h2>
                <p>Actuellement, je travaille sur un projet au long cours autour du Parc Naturel de Cabo de Gata-Níjar. Cette série documente la vie des derniers pêcheurs artisanaux et l'évolution d'un territoire face aux défis climatiques et touristiques.</p>
                <p>Parallèlement, je poursuis mon travail de portrait des habitants de la province d'Almería, cherchant à capter la diversité et la richesse humaine de cette région souvent méconnue.</p>
              </section>
            </main>
          </div>
        `;
      }

      destroy() {}
    });

    // Page Contact
    router.register('/contact', class ContactPage {
      async init() {
        const appRoot = document.getElementById('app-root');
        appRoot.innerHTML = `
          <div class="page contact-page">
            <header class="page-header">
              <h1 class="page-title">${i18n.t('nav.contact') || 'Contact'}</h1>
              <p class="page-intro">Pour toute demande de collaboration, commande de tirages, ou simplement échanger autour de la photographie, n'hésitez pas à me contacter.</p>
            </header>

            <main class="page-body">
              <form class="contact-form">
                <div class="contact-form-group">
                  <label for="name">Nom</label>
                  <input type="text" id="name" name="name" placeholder="Votre nom" required>
                </div>

                <div class="contact-form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" placeholder="votre@email.com" required>
                </div>

                <div class="contact-form-group">
                  <label for="subject">Sujet</label>
                  <input type="text" id="subject" name="subject" placeholder="Objet de votre message">
                </div>

                <div class="contact-form-group">
                  <label for="message">Message</label>
                  <textarea id="message" name="message" placeholder="Votre message..." required></textarea>
                </div>

                <button type="submit">Envoyer</button>
              </form>
            </main>
          </div>
        `;

        // Gestion du formulaire
        const form = appRoot.querySelector('.contact-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();

          // Simulation d'envoi (à remplacer par vraie logique d'envoi)
          const formData = new FormData(form);
          console.log('Form submitted:', Object.fromEntries(formData));

          // Message de confirmation
          const messageDiv = document.createElement('div');
          messageDiv.className = 'contact-message success';
          messageDiv.textContent = 'Merci pour votre message ! Je vous répondrai dans les plus brefs délais.';
          form.appendChild(messageDiv);

          // Reset form
          form.reset();

          // Remove message after 5 seconds
          setTimeout(() => {
            messageDiv.remove();
          }, 5000);
        });
      }

      destroy() {}
    });

    // Page 404
    router.setNotFoundHandler(class NotFoundPage {
      init() {
        const appRoot = document.getElementById('app-root');
        appRoot.innerHTML = `
          <div class="container section text-center">
            <h1 class="display-1">404</h1>
            <p class="text-lead">Page non trouvée</p>
            <a href="#/" class="text-accent mt-md block">← Retour à l'accueil</a>
          </div>
        `;
      }

      destroy() {}
    });

    console.log(`[App] Registered ${router.getAllRoutes().length} routes`);
  }

  /**
   * Initialise les composants globaux (navigation, footer)
   * @private
   */
  async _initGlobalComponents() {
    console.log('[App] Initializing global components...');

    // Navigation mobile-first avec burger menu
    const navContainer = document.getElementById('navigation');
    if (navContainer) {
      const currentLang = i18n.getCurrentLanguage();

      navContainer.innerHTML = `
        <div class="container">
          <a href="#/" class="logo">Photographe</a>

          <!-- Desktop menu -->
          <nav class="nav-menu">
            <a href="#/">${i18n.t('nav.home')}</a>
            <a href="#/gallery">${i18n.t('nav.gallery')}</a>
            <a href="#/cabo-de-gata">${i18n.t('nav.cabo')}</a>
            <a href="#/about">${i18n.t('nav.about')}</a>
            <a href="#/contact">${i18n.t('nav.contact')}</a>
          </nav>

          <!-- Language switcher -->
          <div class="language-switcher">
            <button data-lang="es" class="${currentLang === 'es' ? 'active' : ''}">ES</button>
            <button data-lang="en" class="${currentLang === 'en' ? 'active' : ''}">EN</button>
            <button data-lang="fr" class="${currentLang === 'fr' ? 'active' : ''}">FR</button>
          </div>

          <!-- Mobile burger button -->
          <button class="nav-burger" aria-label="Toggle menu" aria-expanded="false">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <!-- Mobile overlay menu -->
        <div class="nav-overlay">
          <nav class="nav-menu">
            <a href="#/">${i18n.t('nav.home')}</a>
            <a href="#/gallery">${i18n.t('nav.gallery')}</a>
            <a href="#/cabo-de-gata">${i18n.t('nav.cabo')}</a>
            <a href="#/about">${i18n.t('nav.about')}</a>
            <a href="#/contact">${i18n.t('nav.contact')}</a>
          </nav>
        </div>
      `;

      // Event listeners pour le menu burger
      this._initMobileMenu();

      // Event listeners pour le language switcher
      this._initLanguageSwitcher();
    }

    // Footer
    const footerContainer = document.getElementById('footer');
    if (footerContainer) {
      footerContainer.innerHTML = `
        <div class="footer-content">
          <div class="footer-main">
            <div class="footer-logo">Photographe Andalou</div>
            <div class="footer-social">
              <a href="https://instagram.com/photographer_andalou" target="_blank" rel="noopener">Instagram</a>
            </div>
          </div>
          <div class="footer-bottom">
            <p>© ${new Date().getFullYear()} Photographe Andalou. ${i18n.t('footer.rights')}</p>
          </div>
        </div>
      `;
    }

    console.log('[App] Global components initialized');
  }

  /**
   * Initialise le menu mobile (burger)
   * @private
   */
  _initMobileMenu() {
    const burger = document.querySelector('.nav-burger');
    const overlay = document.querySelector('.nav-overlay');
    const body = document.body;

    if (!burger || !overlay) return;

    // Toggle menu
    burger.addEventListener('click', () => {
      const isOpen = overlay.classList.contains('active');

      if (isOpen) {
        // Close menu
        overlay.classList.remove('active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      } else {
        // Open menu
        overlay.classList.add('active');
        burger.classList.add('active');
        burger.setAttribute('aria-expanded', 'true');
        body.style.overflow = 'hidden'; // Prevent scroll
      }
    });

    // Close menu when clicking on a link
    const overlayLinks = overlay.querySelectorAll('a');
    overlayLinks.forEach(link => {
      link.addEventListener('click', () => {
        overlay.classList.remove('active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      });
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      }
    });
  }

  /**
   * Initialise le language switcher
   * @private
   */
  _initLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.language-switcher button');

    langButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const lang = button.getAttribute('data-lang');
        await this.changeLanguage(lang);
      });
    });
  }

  /**
   * Initialise le router
   * @private
   */
  _initRouter() {
    console.log('[App] Initializing router...');

    // Hook avant navigation : ferme le menu mobile si ouvert
    router.setBeforeNavigate((newRoute, oldRoute) => {
      if (state.get('menuOpen')) {
        state.set('menuOpen', false);
      }
      return true; // Autorise la navigation
    });

    // Hook après navigation : scroll to top, analytics, etc.
    router.setAfterNavigate((newRoute) => {
      if (this.debug) {
        console.log(`[App] Navigated to: ${newRoute}`);
      }
      // Ici : tracking analytics si besoin
    });

    // Démarre le router
    router.init();

    console.log('[App] Router initialized');
  }

  /**
   * Change la langue de l'application
   * @param {string} lang - Code de langue (es, en, fr)
   */
  async changeLanguage(lang) {
    try {
      await i18n.setLanguage(lang);

      // Re-render la navigation et le footer
      await this._initGlobalComponents();

      // Reload la page actuelle pour afficher les nouvelles traductions
      await router.reload();

      console.log(`[App] Language changed to: ${lang}`);
    } catch (error) {
      console.error(`[App] Failed to change language to ${lang}:`, error);
    }
  }

  /**
   * Affiche le loader
   * @private
   */
  _showLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.style.display = 'flex';
    }
  }

  /**
   * Cache le loader
   * @private
   */
  _hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Affiche une erreur critique
   * @private
   */
  _showError(error) {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = `
      <div class="container section text-center">
        <h1 class="display-1 text-error">Erreur</h1>
        <p class="text-lead mt-md">
          Une erreur s'est produite lors du chargement de l'application.
        </p>
        <p class="text-small text-tertiary mt-sm">
          ${error.message}
        </p>
        <button onclick="window.location.reload()" class="mt-lg">
          Recharger la page
        </button>
      </div>
    `;
  }
}

// Crée l'instance de l'application
const app = new App();

// Expose dans window pour accès global (language switcher, debug)
window.__APP__ = app;

// Démarre l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export pour usage en module
export default app;
