// Vitest settings: Node environment, dummy env vars, shared DB/mock setup, generous timeouts.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    // Dummy values so config/env.ts validates; tests never reach Atlas or Pixabay.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused-in-tests',
      PIXABAY_API_KEY: 'test-pixabay-key',
      JWT_SECRET: 'test-jwt-secret-at-least-16-chars',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
    testTimeout: 30000,
    hookTimeout: 180000,
    // Each test file gets its own in-memory database; running files one at a time keeps it simple.
    fileParallelism: false,
  },
});
