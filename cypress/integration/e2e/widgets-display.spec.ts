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
  it('solid-display-link-mailto-label', () => {
    cy.get('solid-display-link-mailto-label')
      .find('label')
      .should('contain', 'mail: ')
    cy.get('solid-display-link-mailto-label')
      .find('a')
      .should('have.attr', 'name', 'test1')
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
  it('solid-display-link-tel-label', () => {
    cy.get('solid-display-link-tel-label')
      .find('label')
      .should('contain', 'tel: ')
    cy.get('solid-display-link-tel-label')
      .find('a')
      .should('have.attr', 'name', 'test1')
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
      .and('have.attr', 'link-text', 'link text')
      .and('contain', 'link text')
  })
  it('solid-display-link-blank-label', () => {
    cy.get('solid-display-link-blank-label')
      .find('label')
      .should('contain', 'blank test: ')
    cy.get('solid-display-link-blank-label')
      .find('a')
      .should('have.attr', 'name', 'test1')
      .and('have.attr', 'href', 'http://example.com')
      .and('contain', 'http://example.com')
  })
  it('solid-display-img', () => {
    cy.get('solid-display-img')
      .find('img')
      .should('have.length', 1)
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'src', 'test-img.png')
      .and('have.attr', 'alt', 'alternative text')
  })
  it('solid-display-boolean', () => {
    cy.get('solid-display-boolean[name=test1]')
      .find('label')
      .should('have.length', 1)
      .and('contain', 'Is displayed ?');
    cy.get('solid-display-boolean[name=test2]')
      .find('label')
      .should('not.exist')
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
    cy.get('solid-action').first()
      .find('solid-link')
      .should('have.attr', 'data-src', 'resource-1.jsonld')
      .and('have.attr', 'next', 'next-page')
      .and('contain', 'test1');
  })
  it('solid-action', () => {
    cy.get('solid-action').last()
      .find('solid-link')
      .should('have.attr', 'data-src', 'resource-1.jsonld')
      .and('have.attr', 'next', 'next-page')
      .and('contain', 'link text');
  })
  it('solid-action-label', () => {
    cy.get('solid-action-label')
      .find('label')
      .should('contain', 'label solid-action: ')
    cy.get('solid-action-label')
      .find('solid-link')
      .should('have.attr', 'data-src', 'resource-1.jsonld')
      .and('have.attr', 'next', 'next-page')
      .and('contain', 'test1');
  })
  it('solid-display-div-markdown', () => {
    cy.get('solid-display-div-markdown')
      .find('div')
      .should('have.attr', 'name', 'test display markdown');
    cy.get('solid-display-div-markdown')
      .find('strong')
      .should('contain', 'bold');
    cy.get('solid-display-div-markdown')
      .find('em')
      .should('contain', 'italic');
    cy.get('solid-display-div-markdown')
      .find('a')
      .should('contain', 'link')
      .and('have.attr', 'href', 'http://corndog.io/');

    // Change value to something else
    cy.get('solid-display-div-markdown')
      .invoke('attr', 'value', '**bold** [link](http://corndog.io/)')
      .find('em').should('not.exist');

      // Change value to empty
    cy.get('solid-display-div-markdown')
      .invoke('attr', 'value', '')
      .find('div[name="test display markdown"]')
      .children().should('have.length', 0)
  });
  it('solid-display-div-autolink', () => {
    cy.get('solid-display-div-autolink > div').children()
      .should('have.length', 2);
    cy.get('solid-display-div-autolink > div').children().eq(0)
      .should('have.attr', 'href', 'http://www.w3.org');
    cy.get('solid-display-div-autolink > div').children().eq(1)
      .should('have.attr', 'href', 'http://www.window-swap.com')
  });
  it('solid-display-value-oembed', () => {
    cy.server();
    cy.route('GET', 'https://ldp-server2.test/oembed/', 'fixture:oembed.jsonld');
    cy.get('solid-display-value-oembed').children()
      .should('have.length', 1);
    cy.get('solid-display-value-oembed > iframe')
      .should('have.attr', 'src', 'https://www.youtube.com/embed/M3r2XDceM6A?feature=oembed')
      .and('have.attr', 'width', '200')
      .and('have.attr', 'height', '113')
      .and('have.attr', 'frameborder', '0')
      .and('have.attr', 'allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')
      .and('have.attr', 'allowfullscreen');
  });
})
