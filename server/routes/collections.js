import { Router } from 'express';
import { getDb } from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { validateCollection, validateCollectionUpdate, validateId } from '../middleware/validate.js';
import { slugify } from '../utils/slugify.js';
import { deleteImageFiles } from '../services/imageProcessor.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);
router.use(apiLimiter);

// GET /api/collections
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM collections ORDER BY sort_order').all();
  res.json(rows);
});

// GET /api/collections/:id
router.get('/:id', validateId, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  res.json(row);
});

// POST /api/collections
router.post('/', validateCollection, (req, res) => {
  const db = getDb();
  const {
    slug, name_es, name_en, name_fr,
    description_es = '', description_en = '', description_fr = '',
    layout = 'grid', featured = false, sort_order = 0,
    location = '', year_range = '', tags = [],
  } = req.body;

  const id = slug || slugify(name_es);

  // Check uniqueness
  const existing = db.prepare('SELECT id FROM collections WHERE id = ? OR slug = ?').get(id, slug);
  if (existing) {
    return res.status(409).json({ error: 'Collection with this slug already exists' });
  }

  db.prepare(`
    INSERT INTO collections
      (id, slug, name_es, name_en, name_fr, description_es, description_en, description_fr,
       layout, featured, sort_order, location, year_range, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, slug || id, name_es, name_en, name_fr,
    description_es, description_en, description_fr,
    layout, featured ? 1 : 0, sort_order,
    location, year_range, JSON.stringify(tags)
  );

  const created = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PUT /api/collections/:id
router.put('/:id', validateId, validateCollectionUpdate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  const fields = [];
  const values = [];

  const allowedFields = [
    'slug', 'name_es', 'name_en', 'name_fr',
    'description_es', 'description_en', 'description_fr',
    'layout', 'featured', 'sort_order', 'location', 'year_range',
    'cover_image_src', 'cover_image_placeholder',
    'cover_image_alt_es', 'cover_image_alt_en', 'cover_image_alt_fr',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`);
      let value = req.body[field];
      if (field === 'featured') value = value ? 1 : 0;
      values.push(value);
    }
  }

  // Handle tags array
  if (req.body.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(req.body.tags));
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  fields.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/collections/:id
router.delete('/:id', validateId, async (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  // Delete all image files for this collection
  const images = db.prepare('SELECT id FROM images WHERE collection_id = ?').all(req.params.id);
  for (const img of images) {
    try {
      await deleteImageFiles(existing.slug, img.id);
    } catch (err) {
      console.error(`[Collections] Failed to delete files for image ${img.id}:`, err);
    }
  }

  // CASCADE will delete images rows
  db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);

  res.json({ message: 'Collection deleted', deletedImages: images.length });
});

export default router;
