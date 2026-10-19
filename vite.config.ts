/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5500, host: true },
  // three y gsap solo se importan desde el hero 3D (React.lazy / import()), así que quedan fuera del bundle inicial.
  build: { target: 'es2022' },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
});
