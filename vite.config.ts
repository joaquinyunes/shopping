/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** El build de demostración (`--mode demo`) no se indexa: que nadie encuentre en Google una tienda de ejemplo. */
const sinIndexarLaDemo = (): Plugin => {
  let demo = false;
  return {
    name: 'sin-indexar-la-demo',
    configResolved: c => { demo = c.mode === 'demo'; },
    transformIndexHtml: html => (demo ? html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>') : html),
  };
};

export default defineConfig({
  plugins: [react(), sinIndexarLaDemo()],
  server: { port: 5500, host: true },
  // three y gsap solo se importan desde el hero 3D (React.lazy / import()), así que quedan fuera del bundle inicial.
  build: { target: 'es2022' },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
});
