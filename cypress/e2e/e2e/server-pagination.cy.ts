// TODO: We should make tests run independently of one another
describe('server-pagination', { testIsolation: false }, function () {
    this.beforeAll('visit', () => {
        cy.visit('/examples/e2e/server-pagination.html')
    });
    
    /**
    * Paginates from server
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
        .contains('1000');
    });

    it('goes to prev/next page', () => {
        cy.get('#list-1').as('list');
        cy.get('#list-1 > nav').as('nav');
    
        // Click next -> To investigate how to answer paginated responses in the test context (static files)
        cy.get('@list').contains('/examples/data/list/--user-0.jsonld');
        cy.get('@list').contains('/examples/data/list/--user-1.jsonld');
        // cy.get('@list').contains('user-3.jsonld').should('not.exist');
        // cy.get('@list').contains('user-4.jsonld').should('not.exist');
    
        cy.get('@nav').find('button[data-id="next"]').click();
        
        // Click next -> To investigate how to answer paginated responses in the test context (static files)
        // cy.get('@list').contains('user-1.jsonld').should('not.exist');
        // cy.get('@list').contains('user-2.jsonld').should('not.exist');
        cy.get('@list').contains('/examples/data/list/--user-2.jsonld');
        cy.get('@list').contains('/examples/data/list/--user-3.jsonld');
    
        // Check pager buttons
        cy.get('@nav').find('button[data-id="prev"]')
        .should('not.be.disabled');

        // Check pager infos
        cy.get('@nav').find('> span [data-id=current]')
        .contains('2');

        cy.get('@nav').find('> span [data-id=count]')
        .contains('1000');

        // Click prev
        cy.get('@nav').find('button[data-id="prev"]').click();

        // Check pager buttons
        cy.get('@nav').find('button[data-id="prev"]')
        .should('be.disabled');
        cy.get('@nav').find('button[data-id="next"]')
        .should('not.be.disabled');

        // Check pager infos
        cy.get('@nav').find('> span [data-id=current]')
        .contains('1');

        cy.get('@nav').find('> span [data-id=count]')
        .contains('1000'); 
    });

  /**
  * Paginate and search
  */
  it('search and paginate', () => {
    cy.get('#list-2').as('list');
    cy.get('@list').find('button[data-id="next"]').click();

    // cy.get('@list').contains('user-1.jsonld').should('not.exist');
    // cy.get('@list').contains('user-2.jsonld').should('not.exist');
    cy.get('@list').contains('/examples/data/list/--user-2.jsonld');
    cy.get('@list').contains('/examples/data/list/--user-3.jsonld');

    // search
    cy.get('#username-form').find('input[name="username"]').type('henry');

    cy.get('@list').contains('/examples/data/list/--user-10.jsonld').should('exist');
    cy.get('@list').contains('/examples/data/list/--user-6.jsonld').should('not.exist');
    cy.get('@list').contains('/examples/data/list/--user-7.jsonld').should('not.exist');
    cy.get('@list').contains('/examples/data/list/--user-8.jsonld').should('not.exist');

    //TODO: Improvement: hide the navigation when searching
    // cy.get('#list-2 > nav').should('be.hidden');
  });
});