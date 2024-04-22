describe('alias', function() {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/alias.html')
  });

  it('display users with alias', () => {
    cy.get('#alias-test > div').children().eq(0)
      .should('have.attr', 'data-src', '/examples/data/list/user-1.jsonld');

    cy.get('#alias-test > div > solid-display > div').children().eq(0)
      .should('have.attr', 'name', '@id')
      .should('have.attr', 'value', '/examples/data/list/user-1.jsonld');

    cy.get('#alias-test > div > solid-display > div').children().eq(1)
      .should('have.attr', 'name', '@id as user_id')
      .should('have.attr', 'value', '/examples/data/list/user-1.jsonld');

    cy.get('#alias-test > div > solid-display > div').children().eq(2)
      .should('have.attr', 'name', 'username')
      .should('have.attr', 'value', 'admin');

    cy.get('#alias-test > div > solid-display > div').children().eq(3)
      .should('have.attr', 'name', 'username as strangename')
      .should('have.attr', 'value', 'admin');

    cy.get('#alias-test > div').children().eq(1)
      .should('have.attr', 'data-src', '/examples/data/list/user-2.jsonld');

    cy.get('#alias-test > div').children().eq(1)
      .find('div > solid-display-value:nth-child(2)')
      .should(($element) => {
        expect($element).to.have.attr('name', '@id as user_id');
        expect($element).to.have.attr('value', '/examples/data/list/user-2.jsonld');
      });

    cy.get('#alias-test > div').children().eq(1)
      .find('div > solid-display-value:nth-child(4)')
      .should(($element) => {
        expect($element).to.have.attr('name', 'username as strangename');
        expect($element).to.have.attr('value', 'paris');
      });

    cy.get('#alias-test > div').children().eq(2)
      .find('div > solid-display-value:nth-child(2)')
      .should(($element) => {
        expect($element).to.have.attr('name', '@id as user_id');
        expect($element).to.have.attr('value', '/examples/data/list/user-4.jsonld');
      });

    cy.get('#alias-test > div').children().eq(2)
      .find('div > solid-display-value:nth-child(4)')
      .should(($element) => {
        expect($element).to.have.attr('name', 'username as strangename');
        expect($element).to.have.attr('value', 'pierre');
      });
  });

  it('display users with alias for additional fields and sets', () => {
    cy.get('#alias-test-2 > div').children().eq(0)
      .find('div > solid-display-value:nth-child(6)')
      .should(($element) => {
        expect($element).to.have.attr('name', 'email as ratatouille');
        expect($element).to.have.attr('value', 'test-user@example.com');
      });

    cy.get('#alias-test-2 > div').children().eq(1)
      .find('div > solid-display-value:nth-child(6)')
      .should(($element) => {
        expect($element).to.have.attr('name', 'email as ratatouille');
        expect($element).to.have.attr('value', 'paris@hilton.hi');
      });

    cy.get('#alias-test-2 > div').children().eq(2)
      .find('div > solid-set-default > solid-display-value:nth-child(2)')
      .should(($element) => {
        expect($element).to.have.attr('name', 'username as strangename');
        expect($element).to.have.attr('value', 'pierre');
      });
    
  });
});