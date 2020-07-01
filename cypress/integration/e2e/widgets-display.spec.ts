describe('group-by', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/widgets-display.html')
  })
  it('solid-display-value', () => {
    cy.get('solid-display-value')
      .should('contain', 'test value 1')
      .children().should('have.length', 0);
  })
  it('solid-display-div', () => {
    cy.get('solid-display-div')
      .should('contain', 'test value 1')
      .find('> div')
      .should('have.length', 1)
      .should('have.attr', 'name', 'test1')
  })
  it('solid-display-link', () => {
    cy.get('solid-display-link')
      .find('a')
      .should('have.length', 1)
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'href', 'http://example.com')
      .and('contain', 'http://example.com')
  })
  it('solid-display-link-mailto', () => {
    cy.get('solid-display-link-mailto')
      .find('a')
      .should('have.length', 1)
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'href', 'mailto:http://example.com')
      .and('contain', 'http://example.com')
  })
  it('solid-display-link-tel', () => {
    cy.get('solid-display-link-tel')
      .find('a')
      .should('have.length', 1)
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'href', 'tel:http://example.com')
      .and('contain', 'http://example.com')
  })
  it('solid-display-link-blank', () => {
    cy.get('solid-display-link-blank')
      .find('a')
      .should('have.length', 1)
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'href', 'http://example.com')
      .and('have.attr', 'target', '_blank')
      .and('contain', 'link text')
  })
  it('solid-display-img', () => {
    cy.get('solid-display-img')
      .find('img')
      .should('have.length', 1)
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'src', 'test-img.png')
  })
  it('solid-display-boolean', () => {
    cy.get('solid-display-boolean[name=test1]')
      .find('label')
      .should('have.length', 1)
      .and('contain', 'Is displayed ?');
    cy.get('solid-display-boolean[name=test2]')
      .find('label')
      .should('have.length', 0)
      .and('not.contain', 'Is displayed ?');
  })
  it('solid-display-label-div', () => {
    cy.get('solid-display-label-div[name=test1]')
      .find('label')
      .should('have.length', 1)
      .and('contain', 'test1');
    cy.get('solid-display-label-div[name=test1]')
      .find('> div')
      .should('have.length', 1)
      .and('contain', 'test value 1');

    cy.get('solid-display-label-div[name=test2]')
      .find('label')
      .should('have.length', 1)
      .and('contain', 'Test field');
    cy.get('solid-display-label-div[name=test2]')
      .find('> div')
      .should('have.length', 1)
      .and('contain', 'test value 1');
  })
  it('solid-display-date-div', () => {
    cy.get('solid-display-date-div')
      .find('> div')
      .should('have.length', 1)
      .and('contain', '28/05/2020')
  })
  it('solid-display-datetime-div', () => {
    cy.get('solid-display-datetime-div')
      .find('> div')
      .should('have.length', 1)
      .and('contain', '28/05/2020 à 02:00:00')
  })
  it('solid-display-multiline-div', () => {
    cy.get('solid-display-multiline-div')
      .find('> div')
      .should('have.length', 1)
      .and('contain.html', '<br>')
  })
})
