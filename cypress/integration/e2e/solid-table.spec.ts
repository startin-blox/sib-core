
describe('solid-table', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-table.html')
  });

  it('display users', () => {
    cy.get('#table-users')

      // CHECK DATA
      // 1 child and <table> element
      .children()
      .should('have.length', 1)
      .filter('table')

      // 5 lines and all <tr> element
      .children()
      .should('have.length', 5)
      .filter('tr')
      .should('have.length', 5)

      // first line, 5 <th> elements
      .eq(0)
      .find('th')
      .should('have.length', 5)

      // HEADER
      // Checkbox first
      .children().eq(0)
      .should('have.length', 1)
      .filter('input[type="checkbox"]')

      // Custom label
      .parents('tr')
      .find('th').eq(1)
      .should('contain', 'First Name')

      // Default label
      .parents('tr')
      .find('th').eq(2)
      .should('contain', 'last_name')

      // FIRST LINE
      .parents('table')
      .find('tr').eq(1)
      .should('have.attr', 'data-resource', 'user-3.jsonld')
      .children('td')
      .should('have.length', 5)

      // Checkbox first
      .eq(0)
      .should('have.length', 1)
      .find('input[type="checkbox"]')
      .should('have.attr', 'data-selection', '')

      // First name
      .parents('tr')
      .find('td').eq(1)
      .find('solid-display-value')
      .should('have.text', 'Not A')

      // Custom widget
      .parents('tr')
      .find('td').eq(3)
      .find('solid-display-link-mailto')
      .find('a');
  });

  it('select lines', () => {
    cy.get('#table-users')

      // Line 2
      .find('input[type="checkbox"][data-selection]').eq(1)
      .check()

      // Line 3
      .parents('table').find('input[type="checkbox"][data-selection]').eq(2)
      .check();

    // Check data
    cy.get('#table-users').then($el => {
      expect((<any>$el[0]).component.selectedLines).to.deep.equal([
        'user-2.jsonld', 'user-4.jsonld'
      ])
    });

    // Select all
    cy.get('#table-users')
      .find('input[type="checkbox"]').eq(0).check();
    cy.get('#table-users').then($el => {
      expect((<any>$el[0]).component.selectedLines).to.deep.equal([
        'user-3.jsonld', 'user-2.jsonld', 'user-4.jsonld', 'user-1.jsonld'
      ])
    });

    // Unselect all
    cy.get('#table-users')
      .find('input[type="checkbox"]').eq(0).uncheck();
    cy.get('#table-users').then($el => {
      expect((<any>$el[0]).component.selectedLines).to.deep.equal([])
    });
  });

  it('orders lines', () => {
    cy.get('#table-users solid-display-value[name="first_name"]')
      .eq(0).should('have.text', 'Not A');
    cy.get('#table-users solid-display-value[name="first_name"]')
      .eq(1).should('have.text', 'Paris');
    cy.get('#table-users solid-display-value[name="first_name"]')
      .eq(2).should('have.text', 'Pierre');
    cy.get('#table-users solid-display-value[name="first_name"]')
      .eq(3).should('have.text', 'Test');
  });

  it('shows user-1', () => {
    cy.get('#table-user-1')

      // CHECK DATA
      // 1 child and <table> element
      .children()
      .should('have.length', 1)
      .filter('table')

      // 1 line
      .children()
      .should('have.length', 1)
      .filter('tr')

      // 4 <td> elements
      .eq(0)
      .find('td')
      .should('have.length', 4)

      // First name
      .eq(0)
      .find('solid-display-value')
      .should('have.text', 'Test')
      // Last name
      .parents('tr').find('td')
      .eq(1)
      .find('solid-display-value')
      .should('have.text', 'User')
      // email
      .parents('tr').find('td')
      .eq(2)
      .find('solid-display-value')
      .should('have.text', 'test-user@example.com')
      // username
      .parents('tr').find('td')
      .eq(3)
      .find('solid-display-value')
      .should('have.text', 'admin')
  });

  it('makes cells editable', () => {
    cy.get('#table-users-editable')
      .find('tr').eq(0)

      // first_name
      .find('td').eq(0)
      .find('solid-form')
      .should('have.attr', 'data-src', 'user-1.jsonld')
      .and('have.attr', 'fields', 'first_name')
      .and('have.attr', 'partial', '')
      .find('solid-form-label-text input[type="text"]')
      .should('have.value', 'Test')

      // last_name
      .parents('tr').eq(0)
      .find('td').eq(1)
      .find('solid-form')
      .should('have.attr', 'data-src', 'user-1.jsonld')
      .and('have.attr', 'fields', 'last_name')
      .and('have.attr', 'enum-last_name', 'Smith, Williams, Anderson')
      .and('have.attr', 'partial', '')

      // email
      .parents('tr').eq(0)
      .find('td').eq(2)
      .find('solid-form')
      .should('have.attr', 'data-src', 'user-1.jsonld')
      .and('have.attr', 'fields', 'email')
      .and('have.attr', 'widget-email', 'solid-form-email-label')
      .and('have.attr', 'class', 'email-input')
      .and('have.attr', 'submit-button', 'Validate modifications')
      .and('have.attr', 'partial', '');
  });

  it('keep selected lines', () => {
    cy.get('#table-skills')

      // Line 2 (CSS)
      .find('input[type="checkbox"][data-selection]').eq(1)
      .check()

      // Line 3 (Javascript)
      .parents('table').find('input[type="checkbox"][data-selection]').eq(2)
      .check();

    // Check data
    cy.get('#table-skills').then($el => {
      expect((<any>$el[0]).component.selectedLines).to.deep.equal([
        '/examples/data/list/skill-2.jsonld', '/examples/data/list/skill-3.jsonld'
      ])
    });

    // Order list
    cy.get('#sorter select[name=field]').select('Skill name');

    // Check data
    cy.get('#table-skills').then($el => {
      expect((<any>$el[0]).component.selectedLines).to.deep.equal([
        '/examples/data/list/skill-2.jsonld', '/examples/data/list/skill-3.jsonld'
      ])
    });

    cy.get('#table-skills')

      // Line 1 (CSS)
      .find('input[type="checkbox"][data-selection]').eq(0)
      .should('be.checked')

      // Line 2 (DevOps)
      .parents('table').find('input[type="checkbox"][data-selection]').eq(1)
      .should('not.be.checked')

      // Line 3 (Git)
      .parents('table').find('input[type="checkbox"][data-selection]').eq(2)
      .should('not.be.checked')

      // Line 5 (Javascript)
      .parents('table').find('input[type="checkbox"][data-selection]').eq(4)
      .should('be.checked')
  });
  
  it('numbers displayed', () => {
    cy.get('#table-skills')
    // Check numbers displayed
      .find('solid-display-value[name="order"]').eq(0)
      .should('be.visible').and('contain', '5');
  });

})