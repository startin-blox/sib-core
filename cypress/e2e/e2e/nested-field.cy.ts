describe('nested-field', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/nested-field.html');
  });

  it('nested-[field]', () => {
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      // data-src in solid-display pointed on skill-*.jsonld
      cy.get(`${prefix}display-skills > div`)
        .children()
        .eq(0)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/skill-2.jsonld`,
        );
      cy.get(`${prefix}display-skills > div`)
        .children()
        .eq(1)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/skill-3.jsonld`,
        );
      // User's name not displayed
      cy.get(`${prefix}display-skills > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('not.contain.value', 'Test User');
      cy.get(`${prefix}display-skills > div`)
        .children()
        .eq(1)
        .find('solid-display-value')
        .should('not.contain.value', 'Test User');
      // Skills' name displayed
      cy.get(`${prefix}display-skills > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('have.attr', 'value', 'CSS');
      cy.get(`${prefix}display-skills > div`)
        .children()
        .eq(1)
        .find('solid-display-value')
        .should('have.attr', 'value', 'Javascript');
    });
  });

  it('nested-[field] on related object', () => {
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      // data-src in solid-display pointed on skill-*.jsonld
      cy.get(`${prefix}display-job-skills > div`)
        .children()
        .eq(0)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/skill-1.jsonld`,
        );
      cy.get(`${prefix}display-job-skills > div`)
        .children()
        .eq(1)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/skill-4.jsonld`,
        );
      // User's name not displayed
      cy.get(`${prefix}display-job-skills > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('not.contain.value', 'Test User');
      cy.get(`${prefix}display-job-skills > div`)
        .children()
        .eq(1)
        .find('solid-display-value')
        .should('not.contain.value', 'Test User');
      // Skills' name displayed
      cy.get(`${prefix}display-job-skills > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('have.attr', 'value', 'HTML');
      cy.get(`${prefix}display-job-skills > div`)
        .children()
        .eq(1)
        .find('solid-display-value')
        .should('have.attr', 'value', 'DevOps');
    });
  });
});
