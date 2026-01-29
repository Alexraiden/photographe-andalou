import { adminAuth } from '../authService.js';
import { adminApi } from '../adminApi.js';

export class CollectionsPage {
  async init() {
    const appRoot = document.getElementById('app-root');

    appRoot.innerHTML = `
      <div class="admin-layout">
        <header class="admin-header">
          <h1 class="admin-header__title">Collections</h1>
          <div class="admin-header__actions">
            <button id="logout-btn" class="admin-btn admin-btn--ghost">Déconnexion</button>
          </div>
        </header>
        <nav class="admin-nav">
          <a href="#/admin" class="admin-nav__link">Dashboard</a>
          <a href="#/admin/photos" class="admin-nav__link">Photos</a>
          <a href="#/admin/collections" class="admin-nav__link admin-nav__link--active">Collections</a>
          <a href="#/" class="admin-nav__link admin-nav__link--back">← Voir le site</a>
        </nav>
        <main class="admin-main">
          <!-- Create Collection -->
          <section class="admin-section">
            <h2>Nouvelle collection</h2>
            <form id="collection-form" class="admin-form">
              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label for="col-slug">Slug (URL) *</label>
                  <input type="text" id="col-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*"
                         placeholder="architecture" maxlength="100">
                  <small>Minuscules, chiffres et tirets uniquement</small>
                </div>
                <div class="admin-form__group">
                  <label for="col-layout">Layout</label>
                  <select id="col-layout">
                    <option value="grid">Grille</option>
                    <option value="masonry">Masonry</option>
                    <option value="cinematic">Cinématique</option>
                    <option value="horizontal-scroll">Scroll horizontal</option>
                  </select>
                </div>
              </div>

              <div class="admin-form__row admin-form__row--3">
                <div class="admin-form__group">
                  <label for="col-name-es">Nom (ES) *</label>
                  <input type="text" id="col-name-es" required maxlength="200">
                </div>
                <div class="admin-form__group">
                  <label for="col-name-en">Nom (EN) *</label>
                  <input type="text" id="col-name-en" required maxlength="200">
                </div>
                <div class="admin-form__group">
                  <label for="col-name-fr">Nom (FR) *</label>
                  <input type="text" id="col-name-fr" required maxlength="200">
                </div>
              </div>

              <div class="admin-form__row admin-form__row--3">
                <div class="admin-form__group">
                  <label for="col-desc-es">Description (ES)</label>
                  <textarea id="col-desc-es" rows="2" maxlength="1000"></textarea>
                </div>
                <div class="admin-form__group">
                  <label for="col-desc-en">Description (EN)</label>
                  <textarea id="col-desc-en" rows="2" maxlength="1000"></textarea>
                </div>
                <div class="admin-form__group">
                  <label for="col-desc-fr">Description (FR)</label>
                  <textarea id="col-desc-fr" rows="2" maxlength="1000"></textarea>
                </div>
              </div>

              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label for="col-location">Lieu</label>
                  <input type="text" id="col-location" maxlength="200" placeholder="Cabo de Gata, Almería">
                </div>
                <div class="admin-form__group">
                  <label for="col-years">Période</label>
                  <input type="text" id="col-years" maxlength="20" placeholder="2020-2024">
                </div>
              </div>

              <div class="admin-form__group">
                <label for="col-tags">Tags (séparés par des virgules)</label>
                <input type="text" id="col-tags" maxlength="500" placeholder="landscape, sea, nature">
              </div>

              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label for="col-order">Ordre d'affichage</label>
                  <input type="number" id="col-order" min="0" max="1000" value="0">
                </div>
                <div class="admin-form__group" style="align-self: end;">
                  <label class="admin-checkbox">
                    <input type="checkbox" id="col-featured">
                    <span>Collection mise en avant</span>
                  </label>
                </div>
              </div>

              <div id="col-error" class="admin-alert admin-alert--error" hidden></div>
              <div id="col-success" class="admin-alert admin-alert--success" hidden></div>

              <div class="admin-form__actions">
                <button type="submit" class="admin-btn admin-btn--primary" id="col-submit">
                  Créer la collection
                </button>
              </div>
            </form>
          </section>

          <!-- Existing Collections -->
          <section class="admin-section">
            <h2>Collections existantes</h2>
            <div id="collections-list">
              <p class="admin-loading">Chargement...</p>
            </div>
          </section>
        </main>
      </div>
    `;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => adminAuth.logout());

    // Init form
    this._initCreateForm();
    await this._loadCollections();
  }

  _initCreateForm() {
    const form = document.getElementById('collection-form');
    const errorEl = document.getElementById('col-error');
    const successEl = document.getElementById('col-success');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      successEl.hidden = true;

      const tagsRaw = document.getElementById('col-tags').value;
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

      const data = {
        slug: document.getElementById('col-slug').value,
        name_es: document.getElementById('col-name-es').value,
        name_en: document.getElementById('col-name-en').value,
        name_fr: document.getElementById('col-name-fr').value,
        description_es: document.getElementById('col-desc-es').value,
        description_en: document.getElementById('col-desc-en').value,
        description_fr: document.getElementById('col-desc-fr').value,
        layout: document.getElementById('col-layout').value,
        location: document.getElementById('col-location').value,
        year_range: document.getElementById('col-years').value,
        tags,
        sort_order: parseInt(document.getElementById('col-order').value) || 0,
        featured: document.getElementById('col-featured').checked,
      };

      const submitBtn = document.getElementById('col-submit');
      submitBtn.disabled = true;

      try {
        await adminApi.createCollection(data);
        successEl.textContent = `Collection "${data.name_es}" créée avec succès !`;
        successEl.hidden = false;
        form.reset();
        await this._loadCollections();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  async _loadCollections() {
    const list = document.getElementById('collections-list');

    try {
      const collections = await adminApi.getCollections();

      if (collections.length === 0) {
        list.innerHTML = '<p class="admin-empty">Aucune collection.</p>';
        return;
      }

      list.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Layout</th>
              <th>Images</th>
              <th>Ordre</th>
              <th>En avant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${collections.map(col => `
              <tr>
                <td><strong>${col.name_es || col.slug}</strong></td>
                <td><code>${col.slug}</code></td>
                <td>${col.layout}</td>
                <td>${col.image_count}</td>
                <td>${col.sort_order}</td>
                <td>${col.featured ? 'Oui' : 'Non'}</td>
                <td>
                  <button class="admin-btn admin-btn--ghost admin-btn--sm btn-edit-col"
                          data-id="${col.id}">
                    Modifier
                  </button>
                  <button class="admin-btn admin-btn--danger admin-btn--sm btn-delete-col"
                          data-id="${col.id}" data-name="${col.name_es}">
                    Supprimer
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Edit handlers
      list.querySelectorAll('.btn-edit-col').forEach(btn => {
        btn.addEventListener('click', () => {
          this._openEditModal(btn.dataset.id);
        });
      });

      // Delete handlers
      list.querySelectorAll('.btn-delete-col').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          if (!confirm(`Supprimer la collection "${name}" et toutes ses images ? Cette action est irréversible.`)) return;

          try {
            await adminApi.deleteCollection(id);
            await this._loadCollections();
          } catch (err) {
            alert('Erreur: ' + err.message);
          }
        });
      });
    } catch (err) {
      list.innerHTML = `<p class="admin-error">Erreur: ${err.message}</p>`;
    }
  }

  async _openEditModal(collectionId) {
    try {
      const col = await adminApi.getCollection(collectionId);
      const tags = JSON.parse(col.tags || '[]');

      const modal = document.createElement('div');
      modal.className = 'admin-modal active';
      modal.innerHTML = `
        <div class="admin-modal__backdrop"></div>
        <div class="admin-modal__content">
          <h3>Modifier la collection: ${col.name_es || col.slug}</h3>
          <form id="edit-collection-form" class="admin-form">
            <div class="admin-form__row">
              <div class="admin-form__group">
                <label>Slug (URL)</label>
                <input type="text" name="slug" value="${col.slug}"
                       pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100">
                <small>Minuscules, chiffres et tirets uniquement</small>
              </div>
              <div class="admin-form__group">
                <label>Layout</label>
                <select name="layout">
                  <option value="grid" ${col.layout === 'grid' ? 'selected' : ''}>Grille</option>
                  <option value="masonry" ${col.layout === 'masonry' ? 'selected' : ''}>Masonry</option>
                  <option value="cinematic" ${col.layout === 'cinematic' ? 'selected' : ''}>Cinématique</option>
                  <option value="horizontal-scroll" ${col.layout === 'horizontal-scroll' ? 'selected' : ''}>Scroll horizontal</option>
                </select>
              </div>
            </div>

            <div class="admin-form__row admin-form__row--3">
              <div class="admin-form__group">
                <label>Nom (ES)</label>
                <input type="text" name="name_es" value="${col.name_es || ''}" maxlength="200">
              </div>
              <div class="admin-form__group">
                <label>Nom (EN)</label>
                <input type="text" name="name_en" value="${col.name_en || ''}" maxlength="200">
              </div>
              <div class="admin-form__group">
                <label>Nom (FR)</label>
                <input type="text" name="name_fr" value="${col.name_fr || ''}" maxlength="200">
              </div>
            </div>

            <div class="admin-form__row admin-form__row--3">
              <div class="admin-form__group">
                <label>Description (ES)</label>
                <textarea name="description_es" rows="2" maxlength="1000">${col.description_es || ''}</textarea>
              </div>
              <div class="admin-form__group">
                <label>Description (EN)</label>
                <textarea name="description_en" rows="2" maxlength="1000">${col.description_en || ''}</textarea>
              </div>
              <div class="admin-form__group">
                <label>Description (FR)</label>
                <textarea name="description_fr" rows="2" maxlength="1000">${col.description_fr || ''}</textarea>
              </div>
            </div>

            <div class="admin-form__row">
              <div class="admin-form__group">
                <label>Lieu</label>
                <input type="text" name="location" value="${col.location || ''}" maxlength="200">
              </div>
              <div class="admin-form__group">
                <label>Période</label>
                <input type="text" name="year_range" value="${col.year_range || ''}" maxlength="20">
              </div>
            </div>

            <div class="admin-form__group">
              <label>Tags (séparés par des virgules)</label>
              <input type="text" name="tags" value="${tags.join(', ')}" maxlength="500">
            </div>

            <div class="admin-form__row">
              <div class="admin-form__group">
                <label>Ordre d'affichage</label>
                <input type="number" name="sort_order" value="${col.sort_order || 0}" min="0" max="1000">
              </div>
              <div class="admin-form__group" style="align-self: end;">
                <label class="admin-checkbox">
                  <input type="checkbox" name="featured" ${col.featured ? 'checked' : ''}>
                  <span>Collection mise en avant</span>
                </label>
              </div>
            </div>

            <div id="edit-error" class="admin-alert admin-alert--error" hidden></div>

            <div class="admin-form__actions">
              <button type="button" class="admin-btn admin-btn--ghost" id="edit-cancel">Annuler</button>
              <button type="submit" class="admin-btn admin-btn--primary">Sauvegarder</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      // Close handlers
      modal.querySelector('.admin-modal__backdrop').addEventListener('click', () => modal.remove());
      modal.querySelector('#edit-cancel').addEventListener('click', () => modal.remove());

      // Submit handler
      modal.querySelector('#edit-collection-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Convert tags from comma-separated string to array
        const tagsStr = formData.get('tags');
        const editTags = tagsStr
          ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        const updateData = {
          slug: formData.get('slug'),
          name_es: formData.get('name_es'),
          name_en: formData.get('name_en'),
          name_fr: formData.get('name_fr'),
          description_es: formData.get('description_es'),
          description_en: formData.get('description_en'),
          description_fr: formData.get('description_fr'),
          layout: formData.get('layout'),
          location: formData.get('location'),
          year_range: formData.get('year_range'),
          tags: editTags,
          sort_order: parseInt(formData.get('sort_order')) || 0,
          featured: formData.get('featured') === 'on',
        };

        try {
          await adminApi.updateCollection(collectionId, updateData);
          modal.remove();
          await this._loadCollections();
        } catch (err) {
          const errorEl = modal.querySelector('#edit-error');
          errorEl.textContent = err.message;
          errorEl.hidden = false;
        }
      });

    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  }

  destroy() {}
}
