import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDb, closeDb } from './db.js';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8'));
}

/**
 * Resolve an i18n key like "collections.cabo.name" from a translations object.
 */
function resolveKey(translations, key) {
  if (!key) return '';
  const parts = key.split('.');
  let value = translations;
  for (const part of parts) {
    value = value?.[part];
  }
  return typeof value === 'string' ? value : '';
}

function migrate() {
  console.log('Starting migration...');

  const collectionsData = readJson('./data/collections.json');
  const imagesData = readJson('./data/images.json');

  const es = readJson('./data/translations/es.json');
  const en = readJson('./data/translations/en.json');
  const fr = readJson('./data/translations/fr.json');

  const db = getDb();

  const transaction = db.transaction(() => {
    // Migrate collections
    const insertCollection = db.prepare(`
      INSERT OR REPLACE INTO collections
        (id, slug, name_es, name_en, name_fr,
         description_es, description_en, description_fr,
         cover_image_src, cover_image_placeholder,
         cover_image_alt_es, cover_image_alt_en, cover_image_alt_fr,
         image_count, layout, featured, sort_order,
         location, year_range, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const col of collectionsData.collections) {
      insertCollection.run(
        col.id,
        col.slug,
        resolveKey(es, col.nameKey),
        resolveKey(en, col.nameKey),
        resolveKey(fr, col.nameKey),
        resolveKey(es, col.descriptionKey),
        resolveKey(en, col.descriptionKey),
        resolveKey(fr, col.descriptionKey),
        col.coverImage.src,
        col.coverImage.placeholder,
        resolveKey(es, col.coverImage.altKey),
        resolveKey(en, col.coverImage.altKey),
        resolveKey(fr, col.coverImage.altKey),
        col.imageCount,
        col.layout,
        col.featured ? 1 : 0,
        col.order,
        col.metadata.location,
        col.metadata.yearRange,
        JSON.stringify(col.metadata.tags)
      );
    }

    console.log(`Migrated ${collectionsData.collections.length} collections`);

    // Migrate images
    const insertImage = db.prepare(`
      INSERT OR REPLACE INTO images
        (id, collection_id, title_es, title_en, title_fr,
         description_es, description_en, description_fr,
         file_full, file_large, file_medium, file_small, file_thumb, file_placeholder,
         width, height, aspect_ratio,
         camera, lens, settings, location, photo_date,
         tags, sort_order, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const img of imagesData.images) {
      insertImage.run(
        img.id,
        img.collectionId,
        img.title?.es || '',
        img.title?.en || '',
        img.title?.fr || '',
        img.description?.es || '',
        img.description?.en || '',
        img.description?.fr || '',
        img.files.full,
        img.files.large,
        img.files.medium,
        img.files.small,
        img.files.thumb,
        img.files.placeholder,
        img.dimensions.width,
        img.dimensions.height,
        img.dimensions.aspectRatio,
        img.metadata?.camera || '',
        img.metadata?.lens || '',
        img.metadata?.settings || '',
        img.metadata?.location || '',
        img.metadata?.date || '',
        JSON.stringify(img.metadata?.tags || []),
        img.order,
        img.featured ? 1 : 0
      );
    }

    console.log(`Migrated ${imagesData.images.length} images`);
  });

  transaction();
  closeDb();
  console.log('Migration complete.');
}

migrate();
