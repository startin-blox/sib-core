describe('fields-string', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/fields-string.html');
  });

  it('display strings', () => {
    cy.get('#list-1 > div').as('list1');
    cy.get('#list-2 > div').as('list2');

    cy.get('@list1').children().should('have.length', 4);
    cy.get('@list2').children().should('have.length', 4);

    cy.get('@list1').find('>span').eq(0).should('have.text', 'Name: ');
    cy.get('@list2').find('>span').eq(0).should('have.text', 'Name: ');

    cy.get('@list1').find('>span').eq(1).should('have.text', ', description: ');
    cy.get('@list2').find('>span').eq(1).should('have.text', ', description: ');
  });
});
