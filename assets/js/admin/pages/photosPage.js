import { adminAuth } from '../authService.js';
import { adminApi } from '../adminApi.js';

export class PhotosPage {
  async init() {
    const appRoot = document.getElementById('app-root');

    appRoot.innerHTML = `
      <div class="admin-layout">
        <header class="admin-header">
          <h1 class="admin-header__title">Photos</h1>
          <div class="admin-header__actions">
            <button id="logout-btn" class="admin-btn admin-btn--ghost">Déconnexion</button>
          </div>
        </header>
        <nav class="admin-nav">
          <a href="#/admin" class="admin-nav__link">Dashboard</a>
          <a href="#/admin/photos" class="admin-nav__link admin-nav__link--active">Photos</a>
          <a href="#/admin/collections" class="admin-nav__link">Collections</a>
          <a href="#/" class="admin-nav__link admin-nav__link--back">← Voir le site</a>
        </nav>
        <main class="admin-main">
          <!-- Upload Mode Tabs -->
          <section class="admin-section">
            <div class="admin-tabs">
              <button class="admin-tabs__btn admin-tabs__btn--active" data-tab="single">Ajouter une photo</button>
              <button class="admin-tabs__btn" data-tab="bulk">Upload en lot</button>
            </div>

            <!-- Single Upload -->
            <div id="tab-single" class="admin-tab-content admin-tab-content--active">
              <form id="upload-form" class="admin-form">
                <div class="admin-form__row">
                  <div class="admin-form__group">
                    <label for="upload-collection">Collection *</label>
                    <select id="upload-collection" required>
                      <option value="">-- Sélectionner --</option>
                    </select>
                  </div>
                </div>

                <div class="admin-form__group">
                  <label for="upload-file">Fichier image *</label>
                  <div class="admin-dropzone" id="dropzone">
                    <input type="file" id="upload-file" accept="image/jpeg,image/png,image/webp,image/tiff" required hidden>
                    <p class="admin-dropzone__text">Glisser une image ici ou <button type="button" class="admin-link" id="browse-btn">parcourir</button></p>
                    <p class="admin-dropzone__hint">JPEG, PNG, WebP ou TIFF — max 25 Mo</p>
                    <div class="admin-dropzone__preview" id="file-preview" hidden>
                      <img id="preview-img" alt="Aperçu">
                      <span id="preview-name"></span>
                      <button type="button" class="admin-btn admin-btn--ghost admin-btn--sm" id="clear-file">Retirer</button>
                    </div>
                  </div>
                </div>

                <div class="admin-form__row admin-form__row--3">
                  <div class="admin-form__group">
                    <label for="upload-title-es">Titre (ES) *</label>
                    <input type="text" id="upload-title-es" required maxlength="200">
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-title-en">Titre (EN)</label>
                    <input type="text" id="upload-title-en" maxlength="200">
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-title-fr">Titre (FR)</label>
                    <input type="text" id="upload-title-fr" maxlength="200">
                  </div>
                </div>

                <div class="admin-form__row admin-form__row--3">
                  <div class="admin-form__group">
                    <label for="upload-desc-es">Description (ES)</label>
                    <textarea id="upload-desc-es" rows="2" maxlength="500"></textarea>
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-desc-en">Description (EN)</label>
                    <textarea id="upload-desc-en" rows="2" maxlength="500"></textarea>
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-desc-fr">Description (FR)</label>
                    <textarea id="upload-desc-fr" rows="2" maxlength="500"></textarea>
                  </div>
                </div>

                <div class="admin-form__row admin-form__row--3">
                  <div class="admin-form__group">
                    <label for="upload-camera">Appareil</label>
                    <input type="text" id="upload-camera" placeholder="Canon EOS R5" maxlength="100">
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-lens">Objectif</label>
                    <input type="text" id="upload-lens" placeholder="RF 24-70mm f/2.8" maxlength="100">
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-settings">Réglages</label>
                    <input type="text" id="upload-settings" placeholder="ISO 100, f/8, 1/250s" maxlength="100">
                  </div>
                </div>

                <div class="admin-form__row">
                  <div class="admin-form__group">
                    <label for="upload-location">Lieu</label>
                    <input type="text" id="upload-location" placeholder="Cabo de Gata, Almería" maxlength="200">
                  </div>
                  <div class="admin-form__group">
                    <label for="upload-date">Date de prise de vue</label>
                    <input type="date" id="upload-date">
                  </div>
                </div>

                <div class="admin-form__group">
                  <label for="upload-tags">Tags (séparés par des virgules)</label>
                  <input type="text" id="upload-tags" placeholder="landscape, sea, cabo-de-gata" maxlength="500">
                </div>

                <div class="admin-form__group">
                  <label class="admin-checkbox">
                    <input type="checkbox" id="upload-featured">
                    <span>Photo mise en avant</span>
                  </label>
                </div>

                <div id="upload-error" class="admin-alert admin-alert--error" hidden></div>
                <div id="upload-success" class="admin-alert admin-alert--success" hidden></div>

                <div class="admin-form__actions">
                  <button type="submit" class="admin-btn admin-btn--primary" id="upload-submit">
                    Uploader la photo
                  </button>
                </div>

                <div class="admin-progress" id="upload-progress" hidden>
                  <div class="admin-progress__bar" id="progress-bar"></div>
                  <span class="admin-progress__text" id="progress-text">Traitement en cours...</span>
                </div>
              </form>
            </div>

            <!-- Bulk Upload -->
            <div id="tab-bulk" class="admin-tab-content">
              <form id="bulk-upload-form" class="admin-form">
                <div class="admin-form__row">
                  <div class="admin-form__group">
                    <label for="bulk-collection">Collection *</label>
                    <select id="bulk-collection" required>
                      <option value="">-- Sélectionner --</option>
                    </select>
                  </div>
                </div>

                <div class="admin-form__group">
                  <label>Fichiers images *</label>
                  <div class="admin-dropzone" id="bulk-dropzone">
                    <input type="file" id="bulk-files" accept="image/jpeg,image/png,image/webp,image/tiff" multiple hidden>
                    <p class="admin-dropzone__text">Glisser des images ici ou <button type="button" class="admin-link" id="bulk-browse-btn">parcourir</button></p>
                    <p class="admin-dropzone__hint">JPEG, PNG, WebP ou TIFF — max 25 Mo par fichier</p>
                  </div>
                  <div id="bulk-file-list" class="admin-bulk-list" hidden></div>
                </div>

                <h3 class="admin-form__subtitle">Métadonnées partagées</h3>
                <p class="admin-form__help">Ces informations seront appliquées à toutes les photos. Le titre sera généré à partir du nom de fichier.</p>

                <div class="admin-form__row admin-form__row--3">
                  <div class="admin-form__group">
                    <label for="bulk-camera">Appareil</label>
                    <input type="text" id="bulk-camera" placeholder="Canon EOS R5" maxlength="100">
                  </div>
                  <div class="admin-form__group">
                    <label for="bulk-lens">Objectif</label>
                    <input type="text" id="bulk-lens" placeholder="RF 24-70mm f/2.8" maxlength="100">
                  </div>
                  <div class="admin-form__group">
                    <label for="bulk-settings">Réglages</label>
                    <input type="text" id="bulk-settings" placeholder="ISO 100, f/8, 1/250s" maxlength="100">
                  </div>
                </div>

                <div class="admin-form__row">
                  <div class="admin-form__group">
                    <label for="bulk-location">Lieu</label>
                    <input type="text" id="bulk-location" placeholder="Cabo de Gata, Almería" maxlength="200">
                  </div>
                  <div class="admin-form__group">
                    <label for="bulk-date">Date de prise de vue</label>
                    <input type="date" id="bulk-date">
                  </div>
                </div>

                <div class="admin-form__group">
                  <label for="bulk-tags">Tags (séparés par des virgules)</label>
                  <input type="text" id="bulk-tags" placeholder="landscape, sea, cabo-de-gata" maxlength="500">
                </div>

                <div id="bulk-error" class="admin-alert admin-alert--error" hidden></div>
                <div id="bulk-success" class="admin-alert admin-alert--success" hidden></div>

                <div class="admin-form__actions">
                  <button type="submit" class="admin-btn admin-btn--primary" id="bulk-submit" disabled>
                    Uploader les photos
                  </button>
                  <button type="button" class="admin-btn admin-btn--ghost" id="bulk-clear" hidden>
                    Tout retirer
                  </button>
                </div>

                <div id="bulk-progress-section" hidden>
                  <div class="admin-bulk-progress-header">
                    <span id="bulk-progress-text">0 / 0</span>
                    <span id="bulk-progress-status"></span>
                  </div>
                  <div class="admin-progress">
                    <div class="admin-progress__bar admin-progress__bar--determinate" id="bulk-progress-bar" style="width: 0%"></div>
                  </div>
                  <div id="bulk-results" class="admin-bulk-results"></div>
                </div>
              </form>
            </div>
          </section>

          <!-- Images List -->
          <section class="admin-section">
            <div class="admin-section__header">
              <h2>Photos existantes</h2>
              <div class="admin-filter">
                <label for="filter-collection">Filtrer par collection:</label>
                <select id="filter-collection">
                  <option value="">Toutes</option>
                </select>
              </div>
            </div>
            <div class="admin-grid" id="images-grid">
              <p class="admin-loading">Chargement...</p>
            </div>
          </section>
        </main>
      </div>
    `;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => adminAuth.logout());

    // Init
    this._bulkFiles = [];
    await this._loadCollections();
    this._initTabs();
    this._initUploadForm();
    this._initDropzone();
    this._initBulkUpload();
    await this._loadImages();
  }

  async _loadCollections() {
    try {
      const collections = await adminApi.getCollections();
      this._collections = collections;

      const uploadSelect = document.getElementById('upload-collection');
      const filterSelect = document.getElementById('filter-collection');
      const bulkSelect = document.getElementById('bulk-collection');

      collections.forEach(col => {
        const name = col.name_es || col.slug;
        uploadSelect.add(new Option(name, col.id));
        filterSelect.add(new Option(name, col.id));
        bulkSelect.add(new Option(name, col.id));
      });

      filterSelect.addEventListener('change', () => this._loadImages());
    } catch (err) {
      console.error('[Photos] Failed to load collections:', err);
    }
  }

  _initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('upload-file');
    const browseBtn = document.getElementById('browse-btn');
    const preview = document.getElementById('file-preview');
    const previewImg = document.getElementById('preview-img');
    const previewName = document.getElementById('preview-name');
    const clearBtn = document.getElementById('clear-file');

    browseBtn.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('admin-dropzone--active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('admin-dropzone--active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('admin-dropzone--active');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        this._showPreview(fileInput.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        this._showPreview(fileInput.files[0]);
      }
    });

    clearBtn.addEventListener('click', () => {
      fileInput.value = '';
      preview.hidden = true;
      dropzone.querySelector('.admin-dropzone__text').hidden = false;
      dropzone.querySelector('.admin-dropzone__hint').hidden = false;
    });
  }

  _showPreview(file) {
    const preview = document.getElementById('file-preview');
    const previewImg = document.getElementById('preview-img');
    const previewName = document.getElementById('preview-name');
    const dropzone = document.getElementById('dropzone');

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);

    previewName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} Mo)`;
    preview.hidden = false;
    dropzone.querySelector('.admin-dropzone__text').hidden = true;
    dropzone.querySelector('.admin-dropzone__hint').hidden = true;
  }

  _initUploadForm() {
    const form = document.getElementById('upload-form');
    const errorEl = document.getElementById('upload-error');
    const successEl = document.getElementById('upload-success');
    const submitBtn = document.getElementById('upload-submit');
    const progress = document.getElementById('upload-progress');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      successEl.hidden = true;

      const file = document.getElementById('upload-file').files[0];
      if (!file) {
        errorEl.textContent = 'Veuillez sélectionner un fichier.';
        errorEl.hidden = false;
        return;
      }

      const tagsRaw = document.getElementById('upload-tags').value;
      const tags = tagsRaw
        ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const metadata = {
        collectionId: document.getElementById('upload-collection').value,
        title_es: document.getElementById('upload-title-es').value,
        title_en: document.getElementById('upload-title-en').value,
        title_fr: document.getElementById('upload-title-fr').value,
        description_es: document.getElementById('upload-desc-es').value,
        description_en: document.getElementById('upload-desc-en').value,
        description_fr: document.getElementById('upload-desc-fr').value,
        camera: document.getElementById('upload-camera').value,
        lens: document.getElementById('upload-lens').value,
        settings: document.getElementById('upload-settings').value,
        location: document.getElementById('upload-location').value,
        photo_date: document.getElementById('upload-date').value,
        tags,
        featured: document.getElementById('upload-featured').checked,
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Upload en cours...';
      progress.hidden = false;

      try {
        await adminApi.uploadImage(file, metadata);
        successEl.textContent = 'Photo uploadée avec succès ! Les différentes tailles ont été générées.';
        successEl.hidden = false;
        form.reset();
        document.getElementById('file-preview').hidden = true;
        document.getElementById('dropzone').querySelector('.admin-dropzone__text').hidden = false;
        document.getElementById('dropzone').querySelector('.admin-dropzone__hint').hidden = false;
        await this._loadImages();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Uploader la photo';
        progress.hidden = true;
      }
    });
  }

  async _loadImages() {
    const grid = document.getElementById('images-grid');
    const filter = document.getElementById('filter-collection').value;

    try {
      const images = await adminApi.getImages(filter || undefined);

      if (images.length === 0) {
        grid.innerHTML = '<p class="admin-empty">Aucune photo trouvée.</p>';
        return;
      }

      grid.innerHTML = images.map(img => `
        <div class="admin-image-card" data-id="${img.id}">
          <div class="admin-image-card__img">
            <img src="${img.file_thumb || img.file_small || ''}" alt="${img.title_es || ''}" loading="lazy">
          </div>
          <div class="admin-image-card__info">
            <h4 class="admin-image-card__title">${img.title_es || img.id}</h4>
            <p class="admin-image-card__meta">${img.collection_id}</p>
            <div class="admin-image-card__tags">
              ${(JSON.parse(img.tags || '[]')).map(tag =>
                `<span class="admin-tag">${tag}</span>`
              ).join('')}
            </div>
          </div>
          <div class="admin-image-card__actions">
            <button class="admin-btn admin-btn--ghost admin-btn--sm btn-edit-image" data-id="${img.id}">Modifier</button>
            <button class="admin-btn admin-btn--danger admin-btn--sm btn-delete-image" data-id="${img.id}">Supprimer</button>
          </div>
        </div>
      `).join('');

      // Delete handlers
      grid.querySelectorAll('.btn-delete-image').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (!confirm(`Supprimer l'image ${id} ? Cette action est irréversible.`)) return;

          try {
            await adminApi.deleteImage(id);
            await this._loadImages();
          } catch (err) {
            alert('Erreur: ' + err.message);
          }
        });
      });

      // Edit handlers
      grid.querySelectorAll('.btn-edit-image').forEach(btn => {
        btn.addEventListener('click', () => {
          this._openEditModal(btn.dataset.id);
        });
      });
    } catch (err) {
      grid.innerHTML = `<p class="admin-error">Erreur: ${err.message}</p>`;
    }
  }

  async _openEditModal(imageId) {
    try {
      const img = await adminApi.getImage(imageId);
      const tags = JSON.parse(img.tags || '[]');

      const modal = document.createElement('div');
      modal.className = 'admin-modal active';
      modal.innerHTML = `
        <div class="admin-modal__backdrop"></div>
        <div class="admin-modal__content">
          <h3>Modifier: ${img.title_es || img.id}</h3>
          <form id="edit-image-form" class="admin-form">
            <div class="admin-form__row admin-form__row--3">
              <div class="admin-form__group">
                <label>Titre (ES)</label>
                <input type="text" name="title_es" value="${img.title_es || ''}" maxlength="200">
              </div>
              <div class="admin-form__group">
                <label>Titre (EN)</label>
                <input type="text" name="title_en" value="${img.title_en || ''}" maxlength="200">
              </div>
              <div class="admin-form__group">
                <label>Titre (FR)</label>
                <input type="text" name="title_fr" value="${img.title_fr || ''}" maxlength="200">
              </div>
            </div>
            <div class="admin-form__group">
              <label>Tags (séparés par des virgules)</label>
              <input type="text" name="tags" value="${tags.join(', ')}" maxlength="500">
            </div>
            <div class="admin-form__row">
              <div class="admin-form__group">
                <label>Lieu</label>
                <input type="text" name="location" value="${img.location || ''}" maxlength="200">
              </div>
              <div class="admin-form__group">
                <label>Date</label>
                <input type="date" name="photo_date" value="${img.photo_date || ''}">
              </div>
            </div>
            <div class="admin-form__group">
              <label class="admin-checkbox">
                <input type="checkbox" name="featured" ${img.featured ? 'checked' : ''}>
                <span>Photo mise en avant</span>
              </label>
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

      // Close
      modal.querySelector('.admin-modal__backdrop').addEventListener('click', () => modal.remove());
      modal.querySelector('#edit-cancel').addEventListener('click', () => modal.remove());

      // Submit
      modal.querySelector('#edit-image-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const tagsStr = formData.get('tags');
        const editTags = tagsStr
          ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        try {
          await adminApi.updateImage(imageId, {
            title_es: formData.get('title_es'),
            title_en: formData.get('title_en'),
            title_fr: formData.get('title_fr'),
            tags: JSON.stringify(editTags),
            location: formData.get('location'),
            photo_date: formData.get('photo_date'),
            featured: formData.get('featured') === 'on',
          });
          modal.remove();
          await this._loadImages();
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

  _initTabs() {
    document.querySelectorAll('.admin-tabs__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tabs__btn').forEach(b => b.classList.remove('admin-tabs__btn--active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('admin-tab-content--active'));
        btn.classList.add('admin-tabs__btn--active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('admin-tab-content--active');
      });
    });
  }

  _initBulkUpload() {
    const dropzone = document.getElementById('bulk-dropzone');
    const fileInput = document.getElementById('bulk-files');
    const browseBtn = document.getElementById('bulk-browse-btn');

    browseBtn.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('admin-dropzone--active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('admin-dropzone--active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('admin-dropzone--active');
      if (e.dataTransfer.files.length) {
        this._addBulkFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        this._addBulkFiles(Array.from(fileInput.files));
        fileInput.value = '';
      }
    });

    document.getElementById('bulk-clear').addEventListener('click', () => {
      this._bulkFiles = [];
      this._renderBulkFileList();
    });

    // Bulk form submit
    document.getElementById('bulk-upload-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this._startBulkUpload();
    });
  }

  _addBulkFiles(newFiles) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
    const maxSize = 25 * 1024 * 1024;

    for (const file of newFiles) {
      if (!allowed.includes(file.type)) continue;
      if (file.size > maxSize) continue;
      // Avoid duplicates by name+size
      const exists = this._bulkFiles.some(f => f.name === file.name && f.size === file.size);
      if (!exists) {
        this._bulkFiles.push(file);
      }
    }

    this._renderBulkFileList();
  }

  _renderBulkFileList() {
    const listEl = document.getElementById('bulk-file-list');
    const clearBtn = document.getElementById('bulk-clear');
    const submitBtn = document.getElementById('bulk-submit');

    if (this._bulkFiles.length === 0) {
      listEl.hidden = true;
      clearBtn.hidden = true;
      submitBtn.disabled = true;
      return;
    }

    listEl.hidden = false;
    clearBtn.hidden = false;
    submitBtn.disabled = false;

    listEl.innerHTML = this._bulkFiles.map((file, i) => `
      <div class="admin-bulk-item" data-index="${i}">
        <span class="admin-bulk-item__name">${file.name}</span>
        <span class="admin-bulk-item__size">${(file.size / 1024 / 1024).toFixed(1)} Mo</span>
        <span class="admin-bulk-item__status" id="bulk-status-${i}"></span>
        <button type="button" class="admin-btn admin-btn--ghost admin-btn--sm bulk-remove-btn" data-index="${i}">×</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.bulk-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._bulkFiles.splice(parseInt(btn.dataset.index), 1);
        this._renderBulkFileList();
      });
    });
  }

  _fileNameToTitle(filename) {
    return filename
      .replace(/\.[^.]+$/, '')       // remove extension
      .replace(/[-_]+/g, ' ')        // dashes/underscores to spaces
      .replace(/\s+/g, ' ')          // collapse spaces
      .trim()
      .replace(/^./, c => c.toUpperCase()); // capitalize first letter
  }

  async _startBulkUpload() {
    const errorEl = document.getElementById('bulk-error');
    const successEl = document.getElementById('bulk-success');
    const submitBtn = document.getElementById('bulk-submit');
    const progressSection = document.getElementById('bulk-progress-section');
    const progressText = document.getElementById('bulk-progress-text');
    const progressStatus = document.getElementById('bulk-progress-status');
    const progressBar = document.getElementById('bulk-progress-bar');
    const resultsEl = document.getElementById('bulk-results');

    errorEl.hidden = true;
    successEl.hidden = true;

    const collectionId = document.getElementById('bulk-collection').value;
    if (!collectionId) {
      errorEl.textContent = 'Veuillez sélectionner une collection.';
      errorEl.hidden = false;
      return;
    }

    if (this._bulkFiles.length === 0) {
      errorEl.textContent = 'Aucun fichier sélectionné.';
      errorEl.hidden = false;
      return;
    }

    const tagsRaw = document.getElementById('bulk-tags').value;
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const sharedMeta = {
      collectionId,
      camera: document.getElementById('bulk-camera').value,
      lens: document.getElementById('bulk-lens').value,
      settings: document.getElementById('bulk-settings').value,
      location: document.getElementById('bulk-location').value,
      photo_date: document.getElementById('bulk-date').value,
      tags,
      featured: false,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Upload en cours...';
    progressSection.hidden = false;
    resultsEl.innerHTML = '';

    const total = this._bulkFiles.length;
    let done = 0;
    let errors = 0;

    for (let i = 0; i < total; i++) {
      const file = this._bulkFiles[i];
      const statusEl = document.getElementById(`bulk-status-${i}`);

      progressText.textContent = `${i + 1} / ${total}`;
      progressStatus.textContent = file.name;
      progressBar.style.width = `${((i) / total) * 100}%`;

      if (statusEl) {
        statusEl.textContent = 'En cours...';
        statusEl.className = 'admin-bulk-item__status admin-bulk-item__status--uploading';
      }

      const metadata = {
        ...sharedMeta,
        title_es: this._fileNameToTitle(file.name),
        title_en: '',
        title_fr: '',
        description_es: '',
        description_en: '',
        description_fr: '',
      };

      try {
        await adminApi.uploadImage(file, metadata);
        done++;
        if (statusEl) {
          statusEl.textContent = 'OK';
          statusEl.className = 'admin-bulk-item__status admin-bulk-item__status--done';
        }
      } catch (err) {
        errors++;
        if (statusEl) {
          statusEl.textContent = err.message;
          statusEl.className = 'admin-bulk-item__status admin-bulk-item__status--error';
        }
      }
    }

    progressBar.style.width = '100%';
    progressText.textContent = `${total} / ${total}`;
    progressStatus.textContent = '';

    if (errors === 0) {
      successEl.textContent = `${done} photo${done > 1 ? 's' : ''} uploadée${done > 1 ? 's' : ''} avec succès.`;
      successEl.hidden = false;
      this._bulkFiles = [];
      this._renderBulkFileList();
    } else {
      errorEl.textContent = `${done} réussie${done > 1 ? 's' : ''}, ${errors} erreur${errors > 1 ? 's' : ''}.`;
      errorEl.hidden = false;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Uploader les photos';
    await this._loadImages();
  }

  destroy() {}
}
