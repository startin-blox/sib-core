describe('paginate-by', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/paginate-by.html')
  });
  /**
  * Paginates at loading time
  */
  it('paginates resources', () => {
    cy.get('#list-1 > nav').as('nav')
    .should('have.length', 1);

    // Check buttons
    cy.get('@nav').find('button[data-id="prev"]')
    .should('have.length', 1)
    .and('be.disabled');
    cy.get('@nav').find('button[data-id="next"]')
    .should('have.length', 1)
    .and('not.be.disabled');

    // Check page infos
    cy.get('@nav').find('> span > span:first-child')
    .should('have.attr', 'data-id', 'current')
    .contains('1');

    cy.get('@nav').find('> span > span:last-child')
    .should('have.attr', 'data-id', 'count')
    .contains('2');
  });

  /**
  * Navigate between pages
  */
  it('goes to prev/next page', () => {
    cy.get('#list-1').as('list');
    cy.get('#list-1 > nav').as('nav');

    // Click next
    cy.get('@list').contains('user-1.jsonld');
    cy.get('@list').contains('user-2.jsonld');
    cy.get('@list').contains('user-3.jsonld').should('not.exist');
    cy.get('@list').contains('user-4.jsonld').should('not.exist');

    cy.get('@nav').find('button[data-id="next"]').click();

    cy.get('@list').contains('user-1.jsonld').should('not.exist');
    cy.get('@list').contains('user-2.jsonld').should('not.exist');
    cy.get('@list').contains('user-3.jsonld');
    cy.get('@list').contains('user-4.jsonld');

    // Check pager buttons
    cy.get('@nav').find('button[data-id="prev"]')
    .should('not.be.disabled');
    cy.get('@nav').find('button[data-id="next"]')
    .should('be.disabled');

    // Check pager infos
    cy.get('@nav').find('> span [data-id=current]')
    .contains('2');

    cy.get('@nav').find('> span [data-id=count]')
    .contains('2');

    // Click prev
    cy.get('@nav').find('button[data-id="prev"]').click();

    cy.get('@list').contains('user-1.jsonld');
    cy.get('@list').contains('user-2.jsonld');
    cy.get('@list').contains('user-3.jsonld').should('not.exist');
    cy.get('@list').contains('user-4.jsonld').should('not.exist');

    // Check pager buttons
    cy.get('@nav').find('button[data-id="prev"]')
    .should('be.disabled');
    cy.get('@nav').find('button[data-id="next"]')
    .should('not.be.disabled');

    // Check pager infos
    cy.get('@nav').find('> span [data-id=current]')
    .contains('1');

    cy.get('@nav').find('> span [data-id=count]')
    .contains('2');
  });

  /**
  * Pagination loop
  */
  it('loops pagination', () => {
    cy.get('#list-2').as('list');
    cy.get('#list-2 > nav').as('nav');

    // Check content after click
    cy.get('@list').contains('user-1.jsonld');
    cy.get('@list').contains('user-2.jsonld');
    cy.get('@list').contains('user-3.jsonld').should('not.exist');
    cy.get('@list').contains('user-4.jsonld').should('not.exist');

    cy.get('@nav').find('button[data-id="next"]').click();

    cy.get('@list').contains('user-1.jsonld').should('not.exist');
    cy.get('@list').contains('user-2.jsonld').should('not.exist');
    cy.get('@list').contains('user-3.jsonld');
    cy.get('@list').contains('user-4.jsonld');

    // Check pager buttons
    cy.get('@nav').find('button[data-id="prev"]')
    .should('not.be.disabled');
    cy.get('@nav').find('button[data-id="next"]')
    .should('not.be.disabled');

    // Check pager infos
    cy.get('@nav').find('> span [data-id=current]')
    .contains('2');

    cy.get('@nav').find('> span [data-id=count]')
    .contains('2');

    // Click next again
    cy.get('@nav').find('button[data-id="next"]').click();

    cy.get('@list').contains('user-1.jsonld');
    cy.get('@list').contains('user-2.jsonld');
    cy.get('@list').contains('user-3.jsonld').should('not.exist');
    cy.get('@list').contains('user-4.jsonld').should('not.exist');

    // Check pager buttons
    cy.get('@nav').find('button[data-id="prev"]')
    .should('not.be.disabled');
    cy.get('@nav').find('button[data-id="next"]')
    .should('not.be.disabled');

    // Check pager infos
    cy.get('@nav').find('> span [data-id=current]')
    .contains('1');

    cy.get('@nav').find('> span [data-id=count]')
    .contains('2');

    // Click previous
    cy.get('@nav').find('button[data-id="prev"]').click();

    cy.get('@list').contains('user-1.jsonld').should('not.exist');
    cy.get('@list').contains('user-2.jsonld').should('not.exist');
    cy.get('@list').contains('user-3.jsonld');
    cy.get('@list').contains('user-4.jsonld');

    // Check pager buttons
    cy.get('@nav').find('button[data-id="prev"]')
    .should('not.be.disabled');
    cy.get('@nav').find('button[data-id="next"]')
    .should('not.be.disabled');

    // Check pager infos
    cy.get('@nav').find('> span [data-id=current]')
    .contains('2');

    cy.get('@nav').find('> span [data-id=count]')
    .contains('2');
  });
})
