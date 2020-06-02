describe('Backward Compatibility of sib elements test', function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/sib-backward-compatibility.html');
  });
  it('check solid-form children type', () => {
    cy.get('solid-form').should('have.descendants', 'solid-form-label-text');
    cy.get('solid-form').should('not.have.descendants', 'sib-form-label-text');
  });

  it('check sib-form children type', () => {
    cy.get('sib-form').should('have.descendants', 'sib-form-label-text');
    cy.get('sib-form').should('not.have.descendants', 'solid-form-label-text');
  });
  it('check solid-display children type', () => {
    cy.get('solid-display').should('have.descendants', 'solid-display');
    cy.get('solid-display').should('have.descendants', 'solid-set-default');
    cy.get('solid-display').should('have.descendants', 'solid-display-value');
    cy.get('solid-display').should('have.descendants', 'solid-form');
    cy.get('solid-display').should('not.have.descendants', 'sib-display');
    cy.get('solid-display').should('not.have.descendants', 'sib-set-default');
    cy.get('solid-display').should('not.have.descendants', 'sib-display-value');
    cy.get('solid-display').should('not.have.descendants', 'sib-form');
  });

  it('check sib-display children type', () => {
    cy.get('sib-display').should('have.descendants', 'sib-display');
    cy.get('sib-display').should('have.descendants', 'sib-set-default');
    cy.get('sib-display').should('have.descendants', 'sib-display-value');
    cy.get('sib-display').should('have.descendants', 'sib-form');
    cy.get('sib-display').should('not.have.descendants', 'solid-display');
    cy.get('sib-display').should('not.have.descendants', 'solid-set-default');
    cy.get('sib-display').should('not.have.descendants', 'solid-display-value');
    cy.get('sib-display').should('not.have.descendants', 'solid-form');
  });
});
