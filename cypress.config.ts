import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 20000,
  screenshotOnRunFailure: false,
  video: false,
  e2e: {
    specPattern: ['cypress/e2e/unit/*.cy.ts', 'cypress/e2e/e2e/*.cy.ts'],
    baseUrl: 'http://0.0.0.0:3000',
    experimentalRunAllSpecs: true,
    chromeWebSecurity: false,
  },
});
