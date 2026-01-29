import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Environment
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:8000'
      }
    },

    // Globals (optionnel, pour éviter imports dans chaque test)
    globals: true,

    // Coverage (via v8)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        'server/database/seed.js',
        'server/database/migrate.js',
        'uploads/'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },

    // Test separation
    include: ['tests/**/*.test.js'],

    // Setup files
    setupFiles: ['./tests/setup.js'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode exclusions
    watchExclude: ['**/node_modules/**', '**/uploads/**']
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './assets/js'),
      '@server': path.resolve(__dirname, './server')
    }
  }
});
