describe('solid-form-richtext test', function () {
    this.beforeEach('visit', () => {
      cy.visit('/examples/e2e/required-issue.html');
    });

    it('Submitting form with filled rich text input should not display an error', () => {
        cy.get('solid-form div[data-richtext] p').should('not.have.length', 0);
        cy.get('solid-form input[type="submit"]').click();
        cy.get('solid-form div[data-richtext] .required-error-message').should('not.exist');
        cy.get('solid-form div[data-richtext] .error-border-richtext').should('not.exist');
    });

    it('Submitting form with empty rich text input should display an error mesage', () => {
        cy.get('solid-form div[data-richtext] p').clear();
        cy.get('solid-form input[type="submit"]').click();
        cy.get('solid-form div[data-richtext] .required-error-message').should('exist');
        cy.get('solid-form div[data-richtext].error-border-richtext').should('exist');
    }); 
    
    it('Error message disappears when retyping in rich text input', () => {
        // Empty fields , error is shown
        cy.get('solid-form div[data-richtext] p').clear();
        cy.get('solid-form input[type="submit"]').click();
        cy.get('solid-form div[data-richtext] .required-error-message').should('exist');
        cy.get('solid-form div[data-richtext].error-border-richtext').should('exist');
        
        // Retype text , error disapears
        cy.get('solid-form div[data-richtext] p').type('some text');
        cy.get('solid-form input[type="submit"]').click();
        cy.get('solid-form div[data-richtext] .required-error-message').should('not.exist');
        cy.get('solid-form div[data-richtext] .error-border-richtext').should('not.exist');
    }); 
})  