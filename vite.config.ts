import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sib',
      formats: ['es'],
    },
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: [
        './src/index.ts',
        './src/libs/helpers.ts',
      ],
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    minify: false,
  },
});
