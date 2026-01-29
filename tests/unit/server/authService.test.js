import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../../server/services/authService.js';

describe('AuthService', () => {
  describe('hashPassword()', () => {
    it('devrait générer un hash bcrypt valide', async () => {
      const plaintext = 'mypassword123';
      const hash = await hashPassword(plaintext);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plaintext);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('devrait générer des hash différents pour le même password', async () => {
      const plaintext = 'mypassword123';
      const hash1 = await hashPassword(plaintext);
      const hash2 = await hashPassword(plaintext);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword()', () => {
    let hashedPassword;

    beforeAll(async () => {
      hashedPassword = await hashPassword('correctpassword');
    });

    it('devrait vérifier un password correct', async () => {
      const isValid = await verifyPassword('correctpassword', hashedPassword);
      expect(isValid).toBe(true);
    });

    it('devrait rejeter un password incorrect', async () => {
      const isValid = await verifyPassword('wrongpassword', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('devrait être case-sensitive', async () => {
      const isValid = await verifyPassword('CorrectPassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('signToken()', () => {
    it('devrait générer un JWT token valide', () => {
      const payload = { userId: 'test-user-123', username: 'testuser' };
      const token = signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('devrait inclure le payload dans le token', () => {
      const payload = { userId: 'test-user-123' };
      const token = signToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe('test-user-123');
    });
  });

  describe('verifyToken()', () => {
    it('devrait vérifier un token valide', () => {
      const payload = { userId: 'test-user-123' };
      const token = signToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('test-user-123');
    });

    it('devrait rejeter un token malformé', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('devrait rejeter un token avec mauvaise signature', () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlIn0.fakesignature';
      expect(() => verifyToken(fakeToken)).toThrow();
    });

    it('devrait inclure les métadonnées JWT', () => {
      const payload = { userId: 'test-user-123' };
      const token = signToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
      expect(decoded).toHaveProperty('iss'); // issuer
    });
  });
});
