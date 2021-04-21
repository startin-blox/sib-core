describe('auto-range attribute', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/auto-range.html')
  })

  it('solid-form-search + simple auto-range-[field]', () => {
    cy.get('#simple-auto-range')
      .should('have.attr', 'range-skills');
    // one auto-range-[field] => one solid-form-dropdown
    cy.get('#simple-auto-range > form')
      .children().should('have.length', 1);
    cy.get('#simple-auto-range')
      .find('select')
      .should('have.attr', 'name', 'skills')
      .children().should('have.length', 5);
    // Skills value visible once in the dropdown
    cy.get('#simple-auto-range > form >  solid-form-dropdown > select > option').eq(1)
      .should('contain', 'HTML');
    cy.get('#simple-auto-range > form >  solid-form-dropdown > select > option').eq(2)
      .should('contain', 'CSS');
    cy.get('#simple-auto-range > form >  solid-form-dropdown > select > option').eq(3)
      .should('contain', 'DevOps');
    cy.get('#simple-auto-range > form >  solid-form-dropdown > select > option').eq(4)
      .should('contain', 'Node');

    // Each skill visible several times
    cy.get('#auto-range1 > div')
      .children().should('have.length', 3)
    cy.get('#auto-range1 > div > solid-display').eq(0)
      .should('have.attr', 'data-src', 'user-2.jsonld')
      .find('solid-display[solid-container]').children().children().should('have.length', 1).and('contain', 'HTML')
    cy.get('#auto-range1 > div > solid-display').eq(1)
      .should('have.attr', 'data-src', 'user-4.jsonld')
      .find('solid-display[solid-container]').children().children().should('have.length', 3).and('contain', 'HTML').and('contain', 'CSS').and('contain', 'DevOps')
    cy.get('#auto-range1 > div > solid-display').eq(2)
      .should('have.attr', 'data-src', 'user-5.jsonld')
      .find('solid-display[solid-container]').children().children().should('have.length', 3).and('contain', 'HTML').and('contain', 'DevOps').and('contain', 'Node')

    // User visible after selection
    cy.get('#simple-auto-range')
      .find('select').select('Node')
    cy.get('#auto-range1 > div').children().should('have.length', 1)
    cy.get('#auto-range1 > div > solid-display')
      .should('have.attr', 'data-src', 'user-5.jsonld')
  });

  it('solid-form-search with 2 auto-range-[field] + 2 solid-display', () => {
    cy.get('#double-auto-range').should('have.attr', 'range-skills')
    cy.get('#double-auto-range').should('have.attr', 'range-profile')
    // two auto-range-[field] => two solid-form-dropdown
    cy.get('#double-auto-range > form')
      .children().should('have.length', 2);
    cy.get('#double-auto-range')
      .find('select[name="profile"]')
      .children().should('have.length', 6);
    cy.get('#double-auto-range')
      .find('select[name="skills"]')
      .children().should('have.length', 6);
    // Each profile value visible once in the dropdown
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="profile"] > select > option').eq(1)
      .should('contain', 'profile 2');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="profile"] > select > option').eq(2)
      .should('contain', 'profile 4');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="profile"] > select > option').eq(3)
      .should('contain', 'profile 5');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="profile"] > select > option').eq(4)
      .should('contain', 'profile 1');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="profile"] > select > option').eq(5)
      .should('contain', 'profile 3');

    // Each skill value visible once in the dropdown
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="skills"] > select > option').eq(1)
      .should('contain', 'HTML');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="skills"] > select > option').eq(2)
      .should('contain', 'CSS');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="skills"] > select > option').eq(3)
      .should('contain', 'DevOps');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="skills"] > select > option').eq(4)
      .should('contain', 'Node');
    cy.get('#double-auto-range > form >  solid-form-dropdown[name="skills"] > select > option').eq(5)
      .should('contain', 'Javascript');

    // User(s) visible after selection
    cy.get('#double-auto-range')
      .find('select[name="skills"]').select('HTML')
    cy.get('#auto-range-double > div').children().should('have.length', 1)
    cy.get('#auto-range-double > div > solid-display')
      .should('have.attr', 'data-src', 'user-2.jsonld')
    cy.get('#auto-range-double2 > div').children().should('have.length', 3)
    cy.get('#auto-range-double2 > div > solid-display').eq(0)
      .should('have.attr', 'data-src', 'user-2.jsonld')
    cy.get('#auto-range-double2 > div > solid-display').eq(1)
      .should('have.attr', 'data-src', 'user-4.jsonld')
    cy.get('#auto-range-double2 > div > solid-display').eq(2)
      .should('have.attr', 'data-src', 'user-5.jsonld')
    
    cy.get('#double-auto-range')
      .find('select[name="profile"]').select('profile 4')
    cy.get('#auto-range-double > div').should('be.empty')
    cy.get('#auto-range-double2 > div').children().should('have.length', 1)
    cy.get('#auto-range-double2 > div > solid-display').eq(0)
      .should('have.attr', 'data-src', 'user-4.jsonld')
  });
})