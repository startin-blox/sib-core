describe('nested-field', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/nested-field.html');
  });

  it('nested-[field]', () => {
    // data-src in solid-display pointed on skill-*.jsonld
    cy.get('#display-skills > div')
      .children()
      .eq(0)
      .should('have.attr', 'data-src', '/examples/data/list/skill-2.jsonld');
    cy.get('#display-skills > div')
      .children()
      .eq(1)
      .should('have.attr', 'data-src', '/examples/data/list/skill-3.jsonld');
    // User's name not displayed
    cy.get('#display-skills > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('not.contain.value', 'Test User');
    cy.get('#display-skills > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('not.contain.value', 'Test User');
    // Skills' name displayed
    cy.get('#display-skills > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('have.attr', 'value', 'CSS');
    cy.get('#display-skills > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('have.attr', 'value', 'Javascript');
  });

  it('nested-[field] on related object', () => {
    // data-src in solid-display pointed on skill-*.jsonld
    cy.get('#display-job-skills > div')
      .children()
      .eq(0)
      .should('have.attr', 'data-src', '/examples/data/list/skill-1.jsonld');
    cy.get('#display-job-skills > div')
      .children()
      .eq(1)
      .should('have.attr', 'data-src', '/examples/data/list/skill-4.jsonld');
    // User's name not displayed
    cy.get('#display-job-skills > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('not.contain.value', 'Test User');
    cy.get('#display-job-skills > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('not.contain.value', 'Test User');
    // Skills' name displayed
    cy.get('#display-job-skills > div')
      .children()
      .eq(0)
      .find('solid-display-value')
      .should('have.attr', 'value', 'HTML');
    cy.get('#display-job-skills > div')
      .children()
      .eq(1)
      .find('solid-display-value')
      .should('have.attr', 'value', 'DevOps');
  });
});
