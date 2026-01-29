import { Router } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../database/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');

const router = Router();

function formatCollection(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: { es: row.name_es, en: row.name_en, fr: row.name_fr },
    description: { es: row.description_es, en: row.description_en, fr: row.description_fr },
    coverImage: {
      src: row.cover_image_src,
      placeholder: row.cover_image_placeholder,
      alt: { es: row.cover_image_alt_es, en: row.cover_image_alt_en, fr: row.cover_image_alt_fr },
    },
    imageCount: row.image_count,
    layout: row.layout,
    featured: !!row.featured,
    order: row.sort_order,
    metadata: {
      location: row.location,
      yearRange: row.year_range,
      tags: JSON.parse(row.tags || '[]'),
    },
  };
}

function formatImage(row) {
  return {
    id: row.id,
    collectionId: row.collection_id,
    title: { es: row.title_es, en: row.title_en, fr: row.title_fr },
    description: { es: row.description_es, en: row.description_en, fr: row.description_fr },
    files: {
      full: row.file_full,
      large: row.file_large,
      medium: row.file_medium,
      small: row.file_small,
      thumb: row.file_thumb,
      placeholder: row.file_placeholder,
    },
    dimensions: {
      width: row.width,
      height: row.height,
      aspectRatio: row.aspect_ratio,
    },
    metadata: {
      camera: row.camera,
      lens: row.lens,
      settings: row.settings,
      location: row.location,
      date: row.photo_date,
      tags: JSON.parse(row.tags || '[]'),
    },
    order: row.sort_order,
    featured: !!row.featured,
  };
}

// GET /api/public/collections
router.get('/collections', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM collections ORDER BY sort_order').all();
  res.json({ collections: rows.map(formatCollection) });
});

// GET /api/public/images
router.get('/images', (req, res) => {
  const db = getDb();
  const { collection } = req.query;

  let rows;
  if (collection) {
    rows = db.prepare(
      'SELECT * FROM images WHERE collection_id = ? ORDER BY sort_order'
    ).all(collection);
  } else {
    rows = db.prepare('SELECT * FROM images ORDER BY sort_order').all();
  }

  res.json({ images: rows.map(formatImage) });
});

// GET /api/public/site
router.get('/site', (req, res) => {
  // For now, serve the static site.json content
  // This can be migrated to DB later
  res.json({
    meta: {
      title: 'Pedro CARRILLO VICENTE - Luz Andaluza',
      description: 'Fotografía de paisaje, retrato y reportaje desde Cabo de Gata y el mundo',
      author: 'Pedro CARRILLO VICENTE',
      defaultLanguage: 'es',
      availableLanguages: ['es', 'en', 'fr'],
    },
    contact: {
      email: 'contact@photographe-andalou.com',
      instagram: '@photographer_andalou',
      location: 'Carboneras, Andalusia, Spain',
    },
    settings: {
      imagesPerPage: 20,
      enableLazyLoading: true,
      transitionDuration: 800,
    },
  });
});

// GET /api/public/navigation
router.get('/navigation', (req, res) => {
  const data = JSON.parse(readFileSync(join(dataDir, 'navigation.json'), 'utf-8'));
  res.json(data);
});

// GET /api/public/pages
router.get('/pages', (req, res) => {
  const data = JSON.parse(readFileSync(join(dataDir, 'pages.json'), 'utf-8'));
  res.json(data);
});

export default router;
