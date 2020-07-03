describe('display widgets', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/widgets-display.html')
  })
  it('solid-display-value', () => {
    cy.get('solid-display-value')
      .should('contain', 'test value 1')
      .children().should('have.length', 0);
  })
  it('solid-display-div', () => {
    cy.get('solid-display-div#test1')
      .should('contain', 'test value 1')
      .find('> div')
      .should('have.length', 1)
      .should('have.attr', 'name', 'test1')
  })
  it('solid-display-div editable', () => {
    cy.server();
    cy.route({
      method: 'PATCH',
      url: '**/resource-1.jsonld',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });
    cy.route({
      method: 'GET',
      url: '**/resource-1.jsonld',
      status: 200,
      response: {},
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });
    cy.get('solid-display-div#test2')
      .children().should('have.length', 2);
    cy.get('solid-display-div#test2')
      .find('> div')
      .should('have.attr', 'data-editable', '');
    cy.get('solid-display-div#test2')
      .find('> button')
      .should('contain', 'Modifier')
      .click()
      .should('have.attr', 'disabled', 'disabled');
    cy.get('solid-display-div#test2')
      .find('> div')
      .should('have.attr', 'contenteditable', '');
  });
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
      .and('not.contain', '2020-05-28')
      .and('contain', '28')
      .and('contain', '5')
      .and('contain', '2020');
  })
  it('solid-display-datetime-div', () => {
    cy.get('solid-display-datetime-div')
      .find('> div')
      .should('have.length', 1)
      .and('not.contain', '2020-05-28')
      .and('contain', '28')
      .and('contain', '5')
      .and('contain', '2020')
      .and('contain', '00')
      .and('contain', ':');
  })
  it('solid-display-multiline-div', () => {
    cy.get('solid-display-multiline-div')
      .find('> div')
      .should('have.length', 1)
      .and('contain.html', '<br>')
  })
  it('solid-multiple', () => {
    cy.get('solid-multiple')
      .find('> solid-display')
      .should('have.length', 1)
      .and('have.attr', 'data-src', '../data/list/user-1-skills.jsonld')
      .and('have.attr', 'fields', 'name');

    cy.get('solid-multiple > solid-display > div > solid-display')
      .should('have.length', 2)
      .and('contain', 'CSS')
      .and('contain', 'Javascript')
      .and('not.contain', 'DevOps')
      .and('not.contain', 'HTML')
  })
  it('solid-action', () => {
    cy.get('solid-action')
      .find('solid-link')
      .should('have.attr', 'data-src', 'resource-1.jsonld')
      .and('have.attr', 'next', 'next-page')
      .and('contain', 'test1');
  })
})
