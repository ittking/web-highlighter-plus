import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'WebHighlighterPlus',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    outDir: 'lib',
    sourcemap: false,
    minify: 'esbuild',
  },
});
