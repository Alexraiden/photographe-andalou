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

/**
 * Resolve multilingual text (compatible with both API and static JSON modes).
 * API mode:  obj = { es: "...", en: "...", fr: "..." }
 * JSON mode: key = "collections.cabo.name" → i18n.t(key)
 */
function tr(obj, key) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const lang = i18n.getCurrentLanguage();
    if (obj[lang]) return obj[lang];
    if (obj.es) return obj.es;
  }
  if (key) return i18n.t(key);
  return '';
}

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
      await this._initRouter();

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

        // Duplicate images to have more content in carousel (3x)
        const carouselImages = [...allImages, ...allImages, ...allImages];

        // Create carousel items from all images
        const createCarouselItems = (images) => images.map((img, index) => `
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

          <section class="home-quote">
            <div class="home-quote-content">
              <blockquote class="home-quote-text">
                <span class="quote-mark">"</span>
                El fotógrafo tiene que saber llorar y reír en décimas de segundo
                <span class="quote-mark">"</span>
              </blockquote>
            </div>
          </section>

          <section class="home-about">
            <div class="home-about-content">
              <div class="home-about-text">
                <h2>${i18n.t('home.about.heading')}</h2>
                ${i18n.t('home.about.text').split('\n\n').map(p => `<p>${p}</p>`).join('')}
              </div>
              <div class="home-about-image">
                <img src="/assets/images-placeholder/fotografo.jpeg" alt="${i18n.t('home.hero.title')}" loading="lazy">
              </div>
            </div>
          </section>

          <section class="home-collections">
            <div class="home-collections-header">
              <h2>${i18n.t('common.collections')}</h2>
            </div>
            <div class="cards-grid cols-3">
              ${featuredCollections.map(col => `
                <a href="#/gallery/${col.slug}" class="collection-card">
                  <div class="collection-card-image">
                    <img src="${col.coverImage.src}" alt="${tr(col.coverImage?.alt, col.coverImage?.altKey) || col.slug}" class="loaded">
                  </div>
                  <div class="collection-card-content">
                    <h3 class="collection-card-title">${tr(col.name, col.nameKey)}</h3>
                    <p class="collection-card-description">${tr(col.description, col.descriptionKey)}</p>
                    <div class="collection-card-meta">
                      <span class="collection-card-count">${col.imageCount} ${i18n.t('common.photos')}</span>
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
          </section>

          <section class="home-gallery">
            <div class="gallery-carousel">
              <button class="gallery-carousel-nav prev" aria-label="${i18n.t('common.previous')}">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div class="gallery-carousel-track">
                ${createCarouselItems(carouselImages)}
              </div>
              <button class="gallery-carousel-nav next" aria-label="${i18n.t('common.next')}">
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </section>

          <div class="lightbox" id="carousel-lightbox">
            <button class="lightbox-close" aria-label="${i18n.t('common.close')}"></button>
            <button class="lightbox-prev" aria-label="${i18n.t('common.previous')}"></button>
            <div class="lightbox-content">
              <img class="lightbox-image" src="" alt="">
            </div>
            <button class="lightbox-next" aria-label="${i18n.t('common.next')}"></button>
            <div class="lightbox-counter"></div>
          </div>
        `;

        // Initialize carousel navigation
        this._initCarousel();
        this._initLightbox(carouselImages);
      }

      _initCarousel() {
        const carousel = document.querySelector('.gallery-carousel');
        if (!carousel) return;

        const track = carousel.querySelector('.gallery-carousel-track');
        const items = carousel.querySelectorAll('.gallery-carousel-item');
        const prevBtn = carousel.querySelector('.gallery-carousel-nav.prev');
        const nextBtn = carousel.querySelector('.gallery-carousel-nav.next');

        if (!track || items.length === 0) return;

        let currentIndex = 0;
        const visibleItems = window.innerWidth <= 768 ? 2 : 3;
        const maxIndex = Math.max(0, items.length - visibleItems);

        const updateCarousel = () => {
          const item = items[0];
          const itemWidth = item.offsetWidth;
          const gap = parseInt(getComputedStyle(track).gap) || 16;
          const offset = currentIndex * (itemWidth + gap);
          track.style.transform = `translateX(-${offset}px)`;
          track.style.transition = 'transform 0.4s ease-out';

          // Update button states
          if (prevBtn) prevBtn.disabled = currentIndex === 0;
          if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
        };

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
              currentIndex--;
              updateCarousel();
            }
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            if (currentIndex < maxIndex) {
              currentIndex++;
              updateCarousel();
            }
          });
        }

        // Initial state
        updateCarousel();

        // Auto-scroll
        let autoScrollInterval = setInterval(() => {
          if (currentIndex < maxIndex) {
            currentIndex++;
          } else {
            currentIndex = 0;
          }
          updateCarousel();
        }, 3000);

        // Pause on hover
        carousel.addEventListener('mouseenter', () => {
          clearInterval(autoScrollInterval);
        });

        carousel.addEventListener('mouseleave', () => {
          autoScrollInterval = setInterval(() => {
            if (currentIndex < maxIndex) {
              currentIndex++;
            } else {
              currentIndex = 0;
            }
            updateCarousel();
          }, 3000);
        });

        // Update on resize
        window.addEventListener('resize', () => {
          const newVisibleItems = window.innerWidth <= 768 ? 2 : 3;
          const newMaxIndex = Math.max(0, items.length - newVisibleItems);
          if (currentIndex > newMaxIndex) currentIndex = newMaxIndex;
          updateCarousel();
        });
      }

      _initLightbox(images) {
        const lightbox = document.getElementById('carousel-lightbox');
        if (!lightbox) return;

        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        const counter = lightbox.querySelector('.lightbox-counter');
        const carouselItems = document.querySelectorAll('.gallery-carousel-item');

        let currentImageIndex = 0;

        const openLightbox = (index) => {
          currentImageIndex = index % images.length;
          updateLightboxImage();
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
          lightbox.classList.remove('active');
          document.body.style.overflow = '';
        };

        const updateLightboxImage = () => {
          const img = images[currentImageIndex];
          const src = img.files?.large || img.files?.medium || img.src || '';
          lightboxImg.classList.remove('loaded');
          lightboxImg.src = src;
          lightboxImg.alt = img.title?.[i18n.getCurrentLanguage()] || '';
          lightboxImg.onload = () => lightboxImg.classList.add('loaded');
          counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        };

        const showPrev = () => {
          currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
          updateLightboxImage();
        };

        const showNext = () => {
          currentImageIndex = (currentImageIndex + 1) % images.length;
          updateLightboxImage();
        };

        // Click on carousel images
        carouselItems.forEach((item, index) => {
          item.style.cursor = 'pointer';
          item.addEventListener('click', () => openLightbox(index));
        });

        // Lightbox controls
        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', showPrev);
        nextBtn.addEventListener('click', showNext);

        // Close on backdrop click
        lightbox.addEventListener('click', (e) => {
          if (e.target === lightbox) closeLightbox();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
          if (!lightbox.classList.contains('active')) return;
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowLeft') showPrev();
          if (e.key === 'ArrowRight') showNext();
        });
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
                      <img src="${col.coverImage.src}" alt="${tr(col.coverImage?.alt, col.coverImage?.altKey) || col.slug}" class="loaded">
                    </div>
                    <div class="collection-card-content">
                      <h3 class="collection-card-title">${tr(col.name, col.nameKey) || col.slug}</h3>
                      <p class="collection-card-description">${tr(col.description, col.descriptionKey) || ''}</p>
                      <div class="collection-card-meta">
                        <span class="collection-card-count">${col.imageCount} ${i18n.t('common.photos')}</span>
                        <span class="collection-card-link">${i18n.t('common.view')} →</span>
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
            <a href="#/gallery" class="text-accent mb-md block">← ${i18n.t('common.back')}</a>
            <h1 class="display-1 mb-md">${tr(collection.name, collection.nameKey)}</h1>
            <p class="text-lead mb-lg">${tr(collection.description, collection.descriptionKey)}</p>
            <p class="text-small text-tertiary mb-xl">${images.length} ${i18n.t('common.photos')} • ${collection.metadata?.location || ''}</p>

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

          <div class="lightbox" id="gallery-lightbox">
            <button class="lightbox-close" aria-label="${i18n.t('common.close')}"></button>
            <button class="lightbox-prev" aria-label="${i18n.t('common.previous')}"></button>
            <div class="lightbox-content">
              <img class="lightbox-image" src="" alt="">
            </div>
            <button class="lightbox-next" aria-label="${i18n.t('common.next')}"></button>
            <div class="lightbox-counter"></div>
          </div>
        `;

        this._initLightbox(images);
      }

      _initLightbox(images) {
        const lightbox = document.getElementById('gallery-lightbox');
        if (!lightbox) return;

        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        const counter = lightbox.querySelector('.lightbox-counter');
        const galleryItems = document.querySelectorAll('.gallery-item');

        let currentImageIndex = 0;

        const openLightbox = (index) => {
          currentImageIndex = index;
          updateLightboxImage();
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
          lightbox.classList.remove('active');
          document.body.style.overflow = '';
        };

        const updateLightboxImage = () => {
          const img = images[currentImageIndex];
          const src = img.files?.large || img.files?.medium || img.files?.small || '';
          lightboxImg.classList.remove('loaded');
          lightboxImg.src = src;
          lightboxImg.alt = img.title?.[i18n.getCurrentLanguage()] || '';
          lightboxImg.onload = () => lightboxImg.classList.add('loaded');
          counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        };

        const showPrev = () => {
          currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
          updateLightboxImage();
        };

        const showNext = () => {
          currentImageIndex = (currentImageIndex + 1) % images.length;
          updateLightboxImage();
        };

        // Click on gallery images
        galleryItems.forEach((item, index) => {
          item.addEventListener('click', () => openLightbox(index));
        });

        // Lightbox controls
        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', showPrev);
        nextBtn.addEventListener('click', showNext);

        // Close on backdrop click
        lightbox.addEventListener('click', (e) => {
          if (e.target === lightbox) closeLightbox();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
          if (!lightbox.classList.contains('active')) return;
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowLeft') showPrev();
          if (e.key === 'ArrowRight') showNext();
        });
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
              <h1 class="page-title">${i18n.t('cabo.hero.title')}</h1>
              <p class="page-intro">${i18n.t('cabo.intro')}</p>
            </header>

            <main class="page-body">
              <section class="story-section">
                <h2>${i18n.t('cabo.story.burned_earth.heading')}</h2>
                <p>${i18n.t('cabo.story.burned_earth.p1')}</p>
                <p>${i18n.t('cabo.story.burned_earth.p2')}</p>
              </section>

              <section class="story-section">
                <h2>${i18n.t('cabo.story.white_villages.heading')}</h2>
                <p>${i18n.t('cabo.story.white_villages.p1')}</p>
                <p>${i18n.t('cabo.story.white_villages.p2')}</p>
              </section>

              <section class="story-section">
                <h2>${i18n.t('cabo.story.southern_light.heading')}</h2>
                <p>${i18n.t('cabo.story.southern_light.p1')}</p>
                <p>${i18n.t('cabo.story.southern_light.p2')}</p>
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

    // Admin routes (lazy loaded)
    // Store promise so router init can await it for admin routes
    this._adminRoutesReady = import('../admin/adminApp.js')
      .then(({ registerAdminRoutes }) => {
        registerAdminRoutes(router);
        console.log('[App] Admin routes registered');
      })
      .catch(err => {
        console.warn('[App] Admin module not loaded:', err.message);
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
          <a href="#/" class="logo"><img src="assets/images-placeholder/logo-PCV-cercle.png" alt="Pedro Carrillo Vicente" class="logo__img"></a>

          <!-- Desktop menu -->
          <nav class="nav-menu">
            <a href="#/">${i18n.t('nav.home')}</a>
            <a href="#/gallery">${i18n.t('nav.gallery')}</a>
            <a href="#/cabo-de-gata">${i18n.t('nav.cabo')}</a>
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
            <div class="footer-logo">${i18n.t('footer.name')}</div>
            <div class="footer-social">
              <a href="https://instagram.com/pedrocarrillovicente" target="_blank" rel="noopener">Instagram</a>
              <a href="https://facebook.com/aqaba.fotografia" target="_blank" rel="noopener">Facebook</a>
            </div>
          </div>
          <div class="footer-center">
            <a href="#/" class="footer-logo-link">
              <img src="/assets/images-placeholder/logo-PCV-cercle.png" alt="${i18n.t('footer.name')}" class="footer-logo-img">
            </a>
          </div>
          <div class="footer-bottom">
            <p>© ${new Date().getFullYear()} ${i18n.t('footer.name')}. ${i18n.t('footer.rights')}</p>
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
  async _initRouter() {
    console.log('[App] Initializing router...');

    // Wait for admin routes before starting the router if initial route is admin
    const initialPath = window.location.hash.slice(1) || '/';
    if (initialPath.startsWith('/admin') && this._adminRoutesReady) {
      await this._adminRoutesReady;
    }

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
      const loaderText = loader.querySelector('p');
      if (loaderText && i18n.getCurrentLanguage) {
        loaderText.textContent = i18n.t('common.loading');
      }
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
