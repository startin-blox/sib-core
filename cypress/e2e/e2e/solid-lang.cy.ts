describe('solid-lang', function() {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/solid-lang.html')
  });
  
  it('test solid-lang', () => {
    // mark in window object to show reload
    cy.window().then((w: any) => w.beforeReload = true)
    
    // initilization of a property
    cy.window().should('have.prop', 'beforeReload', true)
    
    
    cy.contains('English').click().should(() => {
      expect(localStorage.getItem('language')).to.eq('en')
    });

    // reload verification : if no property, it confirms the page reload
    cy.window().should('not.have.prop', 'beforeReload')
  })
})

