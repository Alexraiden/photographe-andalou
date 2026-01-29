import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from '../../../../server/middleware/auth.js';
import { signToken } from '../../../../server/services/authService.js';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  describe('requireAuth()', () => {
    it('devrait rejeter sans header Authorization', () => {
      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter si Authorization ne commence pas par Bearer', () => {
      req.headers.authorization = 'Basic token123';

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter un token invalide', () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait accepter un token valide', () => {
      const payload = { userId: 'test-user-123' };
      const token = signToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('test-user-123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('devrait extraire correctement le token après Bearer', () => {
      const payload = { userId: 'test-user-456' };
      const token = signToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(req.user.userId).toBe('test-user-456');
      expect(next).toHaveBeenCalled();
    });
  });
});
