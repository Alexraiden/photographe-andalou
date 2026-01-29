import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const loginLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => `${req.ip}-${req.body?.email || 'unknown'}`,
});

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: { error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: config.rateLimit.upload.windowMs,
  max: config.rateLimit.upload.max,
  message: { error: 'Upload limit reached. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
