import { adminAuth } from '../authService.js';
import { adminApi } from '../adminApi.js';

export class DashboardPage {
  async init() {
    const appRoot = document.getElementById('app-root');

    appRoot.innerHTML = `
      <div class="admin-layout">
        <header class="admin-header">
          <h1 class="admin-header__title">Dashboard</h1>
          <div class="admin-header__actions">
            <span class="admin-header__user">${adminAuth.getUser()?.email || ''}</span>
            <button id="logout-btn" class="admin-btn admin-btn--ghost">Déconnexion</button>
          </div>
        </header>
        <nav class="admin-nav">
          <a href="#/admin" class="admin-nav__link admin-nav__link--active">Dashboard</a>
          <a href="#/admin/photos" class="admin-nav__link">Photos</a>
          <a href="#/admin/collections" class="admin-nav__link">Collections</a>
          <a href="#/" class="admin-nav__link admin-nav__link--back">← Voir le site</a>
        </nav>
        <main class="admin-main">
          <div class="admin-stats" id="admin-stats">
            <div class="admin-stat-card">
              <span class="admin-stat-card__value" id="stat-collections">-</span>
              <span class="admin-stat-card__label">Collections</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-card__value" id="stat-images">-</span>
              <span class="admin-stat-card__label">Photos</span>
            </div>
          </div>
          <div class="admin-quick-actions">
            <h2>Actions rapides</h2>
            <div class="admin-quick-actions__grid">
              <a href="#/admin/photos" class="admin-btn admin-btn--primary">Ajouter des photos</a>
              <a href="#/admin/collections" class="admin-btn admin-btn--secondary">Gérer les collections</a>
            </div>
          </div>
        </main>
      </div>
    `;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      adminAuth.logout();
    });

    // Load stats
    this._loadStats();
  }

  async _loadStats() {
    try {
      const collections = await adminApi.getCollections();
      const images = await adminApi.getImages();

      document.getElementById('stat-collections').textContent = collections.length;
      document.getElementById('stat-images').textContent = images.length;
    } catch (err) {
      console.error('[Dashboard] Failed to load stats:', err);
    }
  }

  destroy() {}
}
