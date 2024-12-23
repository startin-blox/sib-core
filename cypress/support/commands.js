// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add(
  'uploadFile',
  { prevSubject: true },
  (subject, fileName) => {
    cy.fixture(fileName).then(content => {
      const el = subject[0];
      const testFile = new File([content], fileName);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      el.files = dataTransfer.files;
      cy.wrap(subject).trigger('change', { force: true });
    });
  },
);

Cypress.Commands.add('iframe', { prevSubject: 'element' }, $iframe => {
  return new Cypress.Promise(resolve => {
    $iframe.on('load', () => {
      resolve($iframe.contents().find('body'));
    });
  });
});
