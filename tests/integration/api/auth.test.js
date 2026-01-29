import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../helpers/testApp.js';
import { createTestDb, seedTestDb, cleanTestDb } from '../../helpers/db.js';
import { setTestDb } from '../../../server/database/db.js';
import { hashPassword } from '../../../server/services/authService.js';

describe('Auth API Integration Tests', () => {
  let app;
  let db;

  beforeAll(async () => {
    // Create test database
    db = createTestDb();

    // Insert test admin user with known password
    const hashedPassword = await hashPassword('testpassword123');
    db.prepare(`
      INSERT INTO admin_users (email, password, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(
      'admin@test.com',
      hashedPassword,
      new Date().toISOString(),
      new Date().toISOString()
    );

    // Set test database globally
    setTestDb(db);

    // Create test app
    app = createTestApp();
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  describe('POST /api/auth/login', () => {
    it('devrait se connecter avec des credentials valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpassword123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user).toHaveProperty('email', 'admin@test.com');
      expect(typeof response.body.token).toBe('string');
    });

    it('devrait rejeter avec un email invalide', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: 'testpassword123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });

    it('devrait rejeter avec un password invalide', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });

    it('devrait valider le format email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpassword123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('devrait valider la longueur du password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'short'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/auth/verify', () => {
    let validToken;

    beforeAll(async () => {
      // Get a valid token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpassword123'
        });
      validToken = response.body.token;
    });

    it('devrait vérifier un token valide', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body.user).toHaveProperty('email', 'admin@test.com');
    });

    it('devrait rejeter sans token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('devrait rejeter avec un token invalide', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('devrait rejeter avec un format Authorization incorrect', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Basic ${validToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });
  });
});
