import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../helpers/testApp.js';
import { createTestDb, seedTestDb, cleanTestDb } from '../../helpers/db.js';
import { setTestDb } from '../../../server/database/db.js';
import { signToken, hashPassword } from '../../../server/services/authService.js';

describe('Collections API Integration Tests', () => {
  let app;
  let db;
  let authToken;

  beforeAll(async () => {
    // Create test database
    db = createTestDb();

    // Insert test admin user
    const hashedPassword = await hashPassword('testpassword123');
    db.prepare(`
      INSERT INTO admin_users (email, password)
      VALUES (?, ?)
    `).run('admin@test.com', hashedPassword);

    // Generate auth token
    authToken = signToken({ userId: 1, email: 'admin@test.com' });

    // Set test database globally
    setTestDb(db);

    // Create test app
    app = createTestApp();
  });

  beforeEach(() => {
    // Clean collections before each test
    db.prepare('DELETE FROM images').run();
    db.prepare('DELETE FROM collections').run();
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  describe('GET /api/collections', () => {
    it('devrait retourner la liste des collections', async () => {
      // Insert test collection
      db.prepare(`
        INSERT INTO collections (id, slug, name_es, name_en, name_fr)
        VALUES (?, ?, ?, ?, ?)
      `).run('test-col', 'test-col', 'Test ES', 'Test EN', 'Test FR');

      const response = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('slug', 'test-col');
    });

    it('devrait rejeter sans authentification', async () => {
      await request(app)
        .get('/api/collections')
        .expect(401);
    });
  });

  describe('GET /api/collections/:id', () => {
    it('devrait retourner une collection existante', async () => {
      db.prepare(`
        INSERT INTO collections (id, slug, name_es, name_en, name_fr)
        VALUES (?, ?, ?, ?, ?)
      `).run('test-col', 'test-col', 'Test ES', 'Test EN', 'Test FR');

      const response = await request(app)
        .get('/api/collections/test-col')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'test-col');
      expect(response.body).toHaveProperty('name_es', 'Test ES');
    });

    it('devrait retourner 404 pour collection inexistante', async () => {
      await request(app)
        .get('/api/collections/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/collections', () => {
    it('devrait créer une nouvelle collection', async () => {
      const newCollection = {
        slug: 'new-collection',
        name_es: 'Nueva Colección',
        name_en: 'New Collection',
        name_fr: 'Nouvelle Collection',
        layout: 'grid',
        featured: false,
        sort_order: 0
      };

      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newCollection)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('slug', 'new-collection');

      // Verify in database
      const dbCollection = db.prepare('SELECT * FROM collections WHERE slug = ?').get('new-collection');
      expect(dbCollection).toBeDefined();
      expect(dbCollection.name_es).toBe('Nueva Colección');
    });

    it('devrait rejeter avec slug invalide', async () => {
      const newCollection = {
        slug: 'INVALID SLUG',
        name_es: 'Test',
        name_en: 'Test',
        name_fr: 'Test'
      };

      await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newCollection)
        .expect(400);
    });
  });
});
