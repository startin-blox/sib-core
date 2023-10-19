import { defineConfig } from 'cypress'

export default defineConfig({
  defaultCommandTimeout: 8000,
  screenshotOnRunFailure: false,
  video: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://0.0.0.0:3000',
  },
})
