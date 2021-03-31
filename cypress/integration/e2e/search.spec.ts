describe('solid-form-search widget', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/search.html')
  })

  it('solid-form-search', () => {

    cy.get('solid-form-search#filter1')
      .find('select')
      .should('have.attr', 'name', 'username')
      .children().and('have.length', 6)
    cy.get('solid-form-search#filter1')
      .find('option').eq(0)
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-form-search#filter1')
      .find('option').eq(1)
      .should('have.attr', 'value', 'admin')
      .contains('admin');
      
    cy.get('solid-form-search#filter2')
      .find('select')
      .should('have.attr', 'name', 'last_name')
      .children().and('have.length', 5);
    cy.get('solid-form-search#filter2')
      .find('option').eq(0)
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-form-search#filter2')
      .find('option').eq(1)
      .should('have.attr', 'value', 'a')
      .contains('User');
  });

  it('solid-form-search + submit-button', () => {
    cy.get('#filter3')
      .find('input[type=submit]').as('btn')
      .should('have.attr', 'value', 'update result');
    cy.get('#filter3 > form').find('div').children('input[type="submit"]');
    cy.get('#display3 > div > solid-display').should('have.length', 4);
    cy.get('#filter3 select').select('User');
    cy.get('#display3 > div > solid-display').should('have.length', 4);
    cy.get('@btn').click()
    cy.get('#display3 > div > solid-display').should('have.length', 1);
  });
  it('solid-form-search + submit-widget', () => {
    cy.get('solid-form-search#filter-submit-widget').find('input[type="submit"]')
      .should('not.exist');
    cy.get('solid-form-search#filter-submit-widget').find('button[type="submit"]')
      .should('exist')
      .and('have.text', 'OK');
  });
  it('solid-form-search + class-submit-button', () => {
    cy.get('solid-form-search#filter-class-submit-button')
      .find('div').should('have.class', 'button-class')
      .find('input').should('exist');
  });

  it('solid-form-search + start-value & end-value', () => {
    cy.get('#filter4 > form')
      .find('solid-form-rangedate')
      .should('have.attr', 'start-value', '2020-06-01')
      .and('have.attr', 'end-value', '2021-01-12');
    cy.get('#display4 > div ')
      .children().should('have.length', 2)

    cy.get('#filter5 > form')
      .find('solid-form-rangenumber')
      .should('have.attr', 'start-value', '2')
      .and('have.attr', 'end-value', '10');
    cy.get('#display5 > div ')
      .children().should('have.length', 3)
  });

  it('solid-form-search + search-[field]', () => {
    cy.get('#filter-search-field > form')
      .find('solid-form-label-text')
      .should('have.attr', 'name', 'global_name')
      .find('input')
      .type('em')

    cy.get('#display-search-field-1 > div')
      .children().should('have.length', 1)
      .filter('solid-display[data-src="user-3.jsonld"]');
    cy.get('#display-search-field-2 > div')
      .children().should('have.length', 1)
      .filter('solid-display[data-src="event-4.jsonld"]');
  });

  it('solid-form-search + solid-form-hidden', () => {
    cy.get('#display-filter-hidden > div')
      .children().should('have.length', 2)
    cy.get('#display-filter-hidden-bool > div')
      .children().should('have.length', 2)
    cy.get('#display-filter-hidden-num > div')
      .children().should('have.length', 2)
  });

  it('solid-form-search + fakeField', () => {
    cy.get('#display-fake-field > div ')
      .children().should('have.length', 4)

    cy.get('#filter-fake-field > form')
      .find('solid-form-label-text')
      .should('have.attr', 'name', 'fakeField')
      .find('input')
      .type('em');

    cy.get('#display-fake-field > div ')
      .children().should('have.length', 0)
  });

  it('solid-form-search + solid-form-hidden', () => {
    cy.get('#display-filter-hidden > div')
      .children().should('have.length', 2)
    cy.get('#display-filter-hidden-bool > div')
      .children().should('have.length', 2)
    cy.get('#display-filter-hidden-num > div')
      .children().should('have.length', 2)
  });

  it('solid-form-search + container', () => {
    cy.get('#filter-container > div ')
      .children().should('have.length', 4)

    cy.get('#skill-search > form')
      .find('select')
      .select('HTML');

    cy.get('#filter-container > div ')
      .children().should('have.length', 2)
  });

  it('solid-form-search + subject=null', () => {
    cy.get('#display-null-subject solid-display-value[name="profile.available"][value=""]').should('exist')
    
    cy.get('#filter-null-subject input').type("foo")
    
    cy.get('#display-null-subject solid-display-value[name="profile.available"][value=""]').should('not.exist')
  });

  it('solid-form-search + empty-widget', () => {
    cy.get('#span-empty-widget > div')
      .children().should('have.length', 4);
    cy.get('#filter-with-empty-widget')
      .find('input').type('rrr');
    cy.get('#span-empty-widget > div')
      .children().should('have.length', 1)
      .and('contain', 'Pierre DLC');
    cy.get('#filter-with-empty-widget')
      .find('input').type('r');
    cy.get('#span-empty-widget > span')
      .children().should('have.length', 1)
      .and('contain', 'No name found');
    cy.get('#filter-with-empty-widget')
      .find('input').type('{backspace}');
    cy.get('#span-empty-widget > div')
      .children().should('have.length', 1)
      .and('contain', 'Pierre DLC');
  })
})