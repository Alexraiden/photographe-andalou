import { Router } from 'express';
import { getDb } from '../database/db.js';
import { verifyPassword, signToken } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { validateLogin } from '../middleware/validate.js';

const router = Router();

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);

    // Always compare to prevent timing attacks (even if user not found)
    if (!user) {
      // Hash a dummy password to keep constant timing
      await verifyPassword(password, '$2b$12$000000000000000000000uGcvU7Rb0FPvQceMSxMbvNd3BI3W.gEy');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      token,
      expiresIn: 14400, // 4h in seconds
      user: { email: user.email },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/verify
router.get('/verify', requireAuth, (req, res) => {
  res.json({ valid: true, user: { email: req.user.email } });
});

export default router;
