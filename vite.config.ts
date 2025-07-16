import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sib',
      formats: ['es'],
    },
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: ['./src/index.ts', './src/store.ts', './src/libs/helpers.ts'],
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    minify: false,
    reportCompressedSize: false,
  },
});
