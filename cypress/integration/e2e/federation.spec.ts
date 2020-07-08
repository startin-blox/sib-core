describe('federation', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/federation.html')
  })
  it('check children', () => {
    cy.get('body > solid-display > div').children().should('have.length', 4)
    cy.get('body > solid-display > div > solid-display').eq(0)
      .should('have.attr', 'data-src', 'circles-1.jsonld')
      .and('contain.text', 'circles-1.jsonld')
      .and('contain.text', 'Circle from server 1');
    cy.get('body > solid-display > div > solid-display').eq(1)
      .should('have.attr', 'data-src', 'circles-2.jsonld')
      .and('contain.text', 'circles-2.jsonld')
      .and('contain.text', 'Another circle from server 1');
    cy.get('body > solid-display > div > solid-display').eq(2)
      .should('have.attr', 'data-src', 'circles-3.jsonld')
      .and('contain.text', 'circles-3.jsonld')
      .and('contain.text', 'Circle from server 2');
    cy.get('body > solid-display > div > solid-display').eq(3)
      .should('have.attr', 'data-src', 'circles-4.jsonld')
      .and('contain.text', 'circles-4.jsonld')
      .and('contain.text', 'Another circle from server 2');
  });

  it('can fail one source', () => {
    cy.server();
    cy.route({
      method: 'GET',
      url: '**/circles-server2.jsonld',
      status: 403,
      response: {},
    });
    cy.reload();
    cy.get('body > solid-display > div').children().should('have.length', 2);
    cy.get('body > solid-display > div > solid-display').eq(0)
      .should('have.attr', 'data-src', 'circles-1.jsonld')
      .and('contain.text', 'circles-1.jsonld')
      .and('contain.text', 'Circle from server 1');
    cy.get('body > solid-display > div > solid-display').eq(1)
      .should('have.attr', 'data-src', 'circles-2.jsonld')
      .and('contain.text', 'circles-2.jsonld')
      .and('contain.text', 'Another circle from server 1');
  });
})
