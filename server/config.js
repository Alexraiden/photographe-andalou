import 'dotenv/config';

// Parse PORT with fallback to 3000 if invalid
const parsePort = (value) => {
  const port = parseInt(value);
  return !isNaN(port) && port > 0 && port < 65536 ? port : 3000;
};

export const config = {
  port: parsePort(process.env.PORT || '3000'),
  isDev: process.env.NODE_ENV !== 'production',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '4h',
    issuer: 'photographe-andalou',
  },

  bcrypt: {
    saltRounds: 12,
  },

  upload: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
    tempDir: './uploads',
  },

  images: {
    outputDir: './assets/images/collections',
    sizes: {
      thumb:       { width: 200,  quality: 70 },
      small:       { width: 400,  quality: 75 },
      medium:      { width: 800,  quality: 80 },
      large:       { width: 1600, quality: 85 },
      full:        { width: 3200, quality: 90 },
      placeholder: { width: 40,   quality: 30 },
    },
  },

  rateLimit: {
    login:  { windowMs: 15 * 60 * 1000, max: 5 },
    api:    { windowMs: 15 * 60 * 1000, max: 100 },
    upload: { windowMs: 60 * 60 * 1000, max: 50 },
  },

  db: {
    path: process.env.DB_PATH || './data/database.sqlite',
  },
};

// Fail fast if JWT_SECRET is missing
if (!config.jwt.secret) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}
