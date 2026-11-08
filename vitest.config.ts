import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // Testler yerel .env.local'dan etkilenmesin (gerçek AI'ya istek gitmesin)
    env: {
      VITE_AI_BASE_URL: '',
      VITE_AI_MODEL: '',
      VITE_AI_KEY: '',
    },
    testTimeout: 20000,
  },
});
