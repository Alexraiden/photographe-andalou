import multer from 'multer';
import { config } from '../config.js';

export function errorHandler(err, req, res, _next) {
  // Multer errors (file upload)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Upload one at a time.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Multer file filter errors
  if (err.message && (err.message.includes('extension') || err.message.includes('MIME'))) {
    return res.status(400).json({ error: err.message });
  }

  // Log unexpected errors
  console.error('[Error]', err);

  // Generic error response
  res.status(err.status || 500).json({
    error: config.isDev ? err.message : 'Internal server error',
    ...(config.isDev && { stack: err.stack }),
  });
}
