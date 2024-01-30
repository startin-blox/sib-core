import { defineConfig } from 'vite'

export default defineConfig({
  root: './', // The root directory of your project
  base: './', // The base URL for your application
  build: {
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
    outDir: 'dist', // The output directory for your build
    sourcemap: true, // Generate source maps
    minify: false, // Don't minify for development (set to true for production)
  },
  optimizeDeps: {
    include: ['src/**/*.ts'], // Include TypeScript files for optimization
  },
  plugins: [
    // Vite doesn't require a separate Babel plugin
    // You can use the "babel" field in your package.json to configure Babel
    // Any TypeScript compilation can be handled through the TypeScript plugin
  ],
})
