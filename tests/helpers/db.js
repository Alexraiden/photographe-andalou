import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createTestDb() {
  const db = new Database(':memory:');

  // Load and execute schema
  const schemaPath = join(__dirname, '../../server/database/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  return db;
}

export function seedTestDb(db) {
  // Insert test admin user
  db.prepare(`
    INSERT INTO admin_users (email, password, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(
    'admin@test.com',
    '$2b$10$XqoP8HQGvWf2rBZaZ8vJReY6v1xR5j0UaXhN9l4.UY5Ix8WJqIcpW', // password: testpassword123
    new Date().toISOString(),
    new Date().toISOString()
  );

  // Insert test collection
  db.prepare(`
    INSERT INTO collections (
      id, slug, name_es, name_en, name_fr,
      description_es, description_en, description_fr,
      layout, featured, sort_order,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'test-collection',
    'test-collection',
    'Colección de Prueba',
    'Test Collection',
    'Collection de Test',
    'Descripción de prueba',
    'Test description',
    'Description de test',
    'grid',
    0,
    0,
    new Date().toISOString(),
    new Date().toISOString()
  );

  // Insert test image
  db.prepare(`
    INSERT INTO images (
      id, collection_id, file_full, title_es, title_en, title_fr,
      description_es, description_en, description_fr,
      width, height, sort_order, featured,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'test-image',
    'test-collection',
    'test-image.jpg',
    'Imagen de Prueba',
    'Test Image',
    'Image de Test',
    'Descripción de imagen',
    'Image description',
    'Description de l\'image',
    1920,
    1080,
    0,
    0,
    new Date().toISOString(),
    new Date().toISOString()
  );

  return db;
}

export function cleanTestDb(db) {
  db.prepare('DELETE FROM images').run();
  db.prepare('DELETE FROM collections').run();
  db.prepare('DELETE FROM admin_users').run();
}
