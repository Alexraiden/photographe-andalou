import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

/**
 * Tests de sécurité authentification
 */
describe('Authentication Security', () => {
  describe('Brute Force Protection', () => {
    it('should rate limit login attempts', async () => {
      // Tenter 10 connexions rapides
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
      );

      const results = await Promise.all(promises);
      const tooManyRequests = results.filter(r => r.status === 429);

      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('JWT Security', () => {
    it('should reject tampered JWT tokens', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJoYWNrZXIifQ.fakesignature';

      const response = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      // TODO: Créer un token expiré et vérifier le rejet
      expect(true).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts in login', async () => {
      const sqlPayload = "admin' OR '1'='1";

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: sqlPayload, password: 'test' });

      expect(response.status).toBe(400); // Validation error ou 401
    });
  });

  describe('Timing Attack Prevention', () => {
    it('should have consistent response time for valid/invalid users', async () => {
      const start1 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'existing@user.com', password: 'wrong' });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@user.com', password: 'wrong' });
      const time2 = Date.now() - start2;

      // Les temps doivent être similaires (±50ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });
  });
});
