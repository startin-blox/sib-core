describe('group-by', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/group-by.html')
  })
  /**
  * Groups resource at loading time
  */
  it('groups resources', () => {
    cy.get('#list-1 > div > div') // get groups
    .should('have.length', 3) // check number
    .and('have.class', 'custom-group-class'); // and class
    cy.get('#list-1 > div > div:first-child > span') // check title span
    .should('have.length', 1)
    .contains('2019-07-09')
    .and('have.attr', 'data-title');
    cy.get('#list-1 > div > div:first-child > div') // check content div
    .should('have.length', 1)
    .and('have.attr', 'data-content');
    cy.get('#list-1 > div > div:first-child > div > solid-display') // check solid-display
    .should('have.length', 1);
  })
  /**
  * Group and pagination work together
  */
  it('groups resources and paginate', () => {
    cy.get('#list-2 > div').within(() => { // in list-2
      cy.get('> div').eq(1).as('groupRow'); // get second group
      cy.get('@groupRow').find('nav').as('navPages'); // check if nav is here

      // Test navigation
      cy.get('@navPages').should('not.have.attr', 'hidden'); // and is not hidden
      cy.get('@navPages').find('> span [data-id=current]').contains('1');
      cy.get('@navPages').find('> span [data-id=count]').contains('2');

      // Test content
      cy.get('@groupRow').find('solid-display-value[name]').contains('Workshop');
      cy.get('@navPages').find('[data-id=next]').click();
    });
    cy.get('#list-2 > div > div').eq(1).find('solid-display-value[name]').contains('Assemblée générale');
  })
})
