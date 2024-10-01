describe('server-search', function () {
    this.beforeEach('visit', () => {
        cy.visit('/examples/e2e/server-search.html');
    })

    /**
     * Server Search only test
     */
    it('server search', () => {
        // Get forms
        cy.get("#search-form-1").as('forms');

        // Check firstname field
        cy.get("@forms").find("input[name='first_name']").as('first_name')
        cy.get('@first_name').type('Santiago')

        // Start Search
        cy.get('@forms').find('input[type="submit"]').as("forms_submit")
        cy.get('@forms_submit').click()

        // Check result
        cy.get('#result1')
            .should('have.attr', 'data-src', '/mock/users.jsonld')
            .find('div > solid-display').should('have.length', 1);
    })

    /**
     * Server Search with Server pagination test
     */
    it('server-search with server-pagination', () => {
        // Get forms
        cy.get("#search-form-2").as('forms');

        // Check firstname field
        cy.get("@forms").find("input[name='first_name']").as('first_name')
        cy.get('@first_name').type('an')

        // Start Search
        cy.get('@forms').find('input[type="submit"]').as("forms_submit")
        cy.get('@forms_submit').click()

        // Check result
        cy.get('#result2')
            .should('have.attr', 'data-src', '/mock/users.jsonld')
            .find('div > solid-display').should('have.length', 5);
    });
})