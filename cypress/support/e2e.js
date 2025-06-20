// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands.js';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import '@rckeller/cypress-unfetch';

// Plugin to use tab key for testing
import 'cypress-plugin-tab';
// Plugin to test editorMixin (tinyMce in iframe)
import 'cypress-iframe';

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});
