import { defineConfig } from '@farmfe/core';

export default defineConfig({
  compilation: {
    input: {
      index: './src/index.ts',
      helpers: './src/helpers.ts',
    },
    sourcemap: 'inline',
  },
});
