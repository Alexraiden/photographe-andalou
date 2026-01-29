import express from 'express';
import cors from 'cors';
import { errorHandler } from '../../server/middleware/errorHandler.js';
import authRoutes from '../../server/routes/auth.js';
import collectionsRoutes from '../../server/routes/collections.js';
import imagesRoutes from '../../server/routes/images.js';
import publicRoutes from '../../server/routes/public.js';

/**
 * Create Express app for testing
 */
export function createTestApp() {
  const app = express();

  // Minimal middleware for tests
  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/collections', collectionsRoutes);
  app.use('/api/images', imagesRoutes);
  app.use('/api/public', publicRoutes);

  // Error handler
  app.use(errorHandler);

  return app;
}
