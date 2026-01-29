import { Router } from 'express';
import { getDb } from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import { upload, validateFileContent } from '../middleware/upload.js';
import { validateImageMeta, validateId } from '../middleware/validate.js';
import { processUploadedImage, deleteImageFiles } from '../services/imageProcessor.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);
router.use(apiLimiter);

// GET /api/images
router.get('/', (req, res) => {
  const db = getDb();
  const { collection } = req.query;

  let rows;
  if (collection) {
    rows = db.prepare(
      'SELECT * FROM images WHERE collection_id = ? ORDER BY sort_order'
    ).all(collection);
  } else {
    rows = db.prepare('SELECT * FROM images ORDER BY collection_id, sort_order').all();
  }

  res.json(rows);
});

// GET /api/images/:id
router.get('/:id', validateId, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.json(row);
});

// POST /api/images/upload
router.post(
  '/upload',
  uploadLimiter,
  upload.single('file'),
  validateFileContent,
  async (req, res) => {
    try {
      const db = getDb();

      const collectionId = req.body.collectionId;
      if (!collectionId || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(collectionId)) {
        return res.status(400).json({ error: 'Valid collectionId is required' });
      }

      // Verify collection exists
      const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      // Generate image ID: {collection}-{next_number}
      const lastImage = db.prepare(
        "SELECT id FROM images WHERE collection_id = ? ORDER BY id DESC LIMIT 1"
      ).get(collectionId);

      let nextNum = 1;
      if (lastImage) {
        const match = lastImage.id.match(/-(\d+)$/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }

      const imageId = `${collectionId}-${String(nextNum).padStart(3, '0')}`;

      // Process image (generate all sizes)
      const { files, dimensions } = await processUploadedImage(
        req.file.buffer,
        collection.slug,
        imageId
      );

      // Parse tags
      let tags = [];
      if (req.body.tags) {
        try {
          tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
        } catch {
          return res.status(400).json({ error: 'Invalid tags format. Must be JSON array.' });
        }
      }

      // Determine sort order
      const maxOrder = db.prepare(
        'SELECT MAX(sort_order) as max_order FROM images WHERE collection_id = ?'
      ).get(collectionId);
      const sortOrder = (maxOrder?.max_order || 0) + 1;

      // Insert image record
      db.prepare(`
        INSERT INTO images
          (id, collection_id, title_es, title_en, title_fr,
           description_es, description_en, description_fr,
           file_full, file_large, file_medium, file_small, file_thumb, file_placeholder,
           original_filename, width, height, aspect_ratio,
           camera, lens, settings, location, photo_date,
           tags, sort_order, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        imageId, collectionId,
        req.body.title_es || '', req.body.title_en || '', req.body.title_fr || '',
        req.body.description_es || '', req.body.description_en || '', req.body.description_fr || '',
        files.full, files.large, files.medium, files.small, files.thumb, files.placeholder,
        req.file.originalname,
        dimensions.width, dimensions.height, dimensions.aspectRatio,
        req.body.camera || '', req.body.lens || '', req.body.settings || '',
        req.body.location || '', req.body.photo_date || '',
        JSON.stringify(tags), sortOrder,
        req.body.featured === 'true' ? 1 : 0
      );

      // Update collection image count
      const count = db.prepare(
        'SELECT COUNT(*) as cnt FROM images WHERE collection_id = ?'
      ).get(collectionId);
      db.prepare('UPDATE collections SET image_count = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(count.cnt, collectionId);

      const created = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      res.status(201).json(created);
    } catch (err) {
      console.error('[Images] Upload error:', err);
      res.status(500).json({ error: 'Failed to process image upload' });
    }
  }
);

// PUT /api/images/:id
router.put('/:id', validateId, validateImageMeta, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const fields = [];
  const values = [];

  const allowedFields = [
    'title_es', 'title_en', 'title_fr',
    'description_es', 'description_en', 'description_fr',
    'camera', 'lens', 'settings', 'location', 'photo_date',
    'sort_order', 'featured',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`);
      let value = req.body[field];
      if (field === 'featured') value = value ? 1 : 0;
      values.push(value);
    }
  }

  // Handle tags
  if (req.body.tags !== undefined) {
    fields.push('tags = ?');
    const tags = typeof req.body.tags === 'string' ? req.body.tags : JSON.stringify(req.body.tags);
    values.push(tags);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  fields.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE images SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/images/:id
router.delete('/:id', validateId, async (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Image not found' });
  }

  // Get collection slug for file deletion
  const collection = db.prepare('SELECT slug FROM collections WHERE id = ?').get(existing.collection_id);

  if (collection) {
    try {
      await deleteImageFiles(collection.slug, existing.id);
    } catch (err) {
      console.error(`[Images] Failed to delete files for ${existing.id}:`, err);
    }
  }

  db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id);

  // Update collection image count
  if (existing.collection_id) {
    const count = db.prepare(
      'SELECT COUNT(*) as cnt FROM images WHERE collection_id = ?'
    ).get(existing.collection_id);
    db.prepare('UPDATE collections SET image_count = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(count.cnt, existing.collection_id);
  }

  res.json({ message: 'Image deleted' });
});

export default router;
