import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: '.',
  publicDir: false,
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
