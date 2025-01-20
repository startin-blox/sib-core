import { resolve } from 'node:path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  resolve: {
    preserveSymlinks: true,
    alias: {
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    include: ['stream-browserify'],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sib',
      formats: ['es'],
    },
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: ['./src/index.ts', './src/libs/helpers.ts'],
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
