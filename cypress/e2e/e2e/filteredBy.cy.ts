describe('simple Startin’blox e2e test', () => {
  it('check children count', () => {
    cy.visit('/examples/e2e/filtered.html');
    cy.get('#filter1 input').type('MâÿèR'); // match "mayer"
    cy.get('#filter2 input').type('lin'); // match "lindsay", "collins" & "rollins"
    cy.get('main > div:nth-child(1) > solid-display > div > solid-display')
      .its('length')
      .should('eq', 1);
    cy.get('main > div:nth-child(2) > solid-display > div > solid-display')
      .its('length')
      .should('eq', 1);
    cy.get('#filter1 input').clear().type('john'); // match "johnston.ashley" & "frye.johns"
    cy.get('main > div:nth-child(1) > solid-display > div > solid-display')
      .its('length')
      .should('eq', 2);
    cy.get('main > div:nth-child(2) > form input[value="filter2"]').click({
      force: true,
    });
    cy.get('main > div:nth-child(2) > solid-display > div > solid-display')
      .its('length')
      .should('eq', 5);
  });
});
