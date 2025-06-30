/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-map-gl': 'react-map-gl/dist/esm/index.js'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    css: true,
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
  },
});