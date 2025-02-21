// biome-ignore lint/complexity/noForEach: Allow forEach in Cypress tests
// TODO: We should make tests run independently of one another
describe('solid-table', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-table.html');
  });

  it('display users (+dcat)', () => {
    ['#table-users', '#dcat-table-users'].forEach(tableId => {
      cy.get(tableId) // CHECK DATA
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
        .children()
        .eq(0)
        .should('have.length', 1)
        .filter('input[type="checkbox"]')

        // Custom label
        .parents('tr')
        .find('th')
        .eq(1)
        .should('contain', 'First Name')

        // Default label
        .parents('tr')
        .find('th')
        .eq(2)
        .should('contain', 'last_name')

        // FIRST LINE
        .parents('table')
        .find('tr')
        .eq(1)
        .should(
          'have.attr',
          'data-resource',
          '/examples/data/list/user-3.jsonld',
        )
        .children('td')
        .should('have.length', 5)

        // Checkbox first
        .eq(0)
        .should('have.length', 1)
        .find('input[type="checkbox"]')
        .should('have.attr', 'data-selection', '')

        // First name
        .parents('tr')
        .find('td')
        .eq(1)
        .find('solid-display-value')
        .should('have.text', 'Not A')

        // Custom widget
        .parents('tr')
        .find('td')
        .eq(3)
        .find('solid-display-link-mailto')
        .find('a');
    });
  });

  it('select lines (+dcat)', () => {
    ['#table-users', '#dcat-table-users'].forEach(tableId => {
      cy.get(tableId)

        // Line 2
        .find('input[type="checkbox"][data-selection]')
        .eq(1)
        .check()

        // Line 3
        .parents('table')
        .find('input[type="checkbox"][data-selection]')
        .eq(2)
        .check();

      // Check data
      cy.get(tableId).then($el => {
        expect((<any>$el[0]).component.selectedLines).to.deep.equal([
          '/examples/data/list/user-2.jsonld',
          '/examples/data/list/user-4.jsonld',
        ]);
      });

      // Select all
      cy.get(tableId).find('input[type="checkbox"]').eq(0).check();
      cy.get(tableId).then($el => {
        expect((<any>$el[0]).component.selectedLines).to.deep.equal([
          '/examples/data/list/user-3.jsonld',
          '/examples/data/list/user-2.jsonld',
          '/examples/data/list/user-4.jsonld',
          '/examples/data/list/user-1.jsonld',
        ]);
      });

      // Unselect all
      cy.get(tableId).find('input[type="checkbox"]').eq(0).uncheck();
      cy.get(tableId).then($el => {
        expect((<any>$el[0]).component.selectedLines).to.deep.equal([]);
      });
    });
  });

  it('orders lines (+dcat)', () => {
    cy.get('#table-users, #dcat-table-users').each($table => {
      cy.wrap($table).within(() => {
        cy.get(`solid-display-value[name="first_name"]`)
          .eq(0)
          .should('have.text', 'Not A');
        cy.get(`solid-display-value[name="first_name"]`)
          .eq(1)
          .should('have.text', 'Paris');
        cy.get(`solid-display-value[name="first_name"]`)
          .eq(2)
          .should('have.text', 'Pierre');
        cy.get(`solid-display-value[name="first_name"]`)
          .eq(3)
          .should('have.text', 'Test');
      });
    });
  });

  it('shows user-1 (+dcat)', () => {
    cy.get('#table-user-1, #dcat-table-user-1').each($table => {
      cy.wrap($table).within(() => {
        cy.get('table').should('exist').children().should('have.length', 1);
        cy.get('tr').should('have.length', 1);
        cy.get('tr').eq(0).find('td').should('have.length', 4);
        cy.get('tr')
          .eq(0)
          .find('td')
          .eq(0)
          .find('solid-display-value')
          .should('have.text', 'Test');
        cy.get('tr')
          .eq(0)
          .find('td')
          .eq(1)
          .find('solid-display-value')
          .should('have.text', 'User');
        cy.get('tr')
          .eq(0)
          .find('td')
          .eq(2)
          .find('solid-display-value')
          .should('have.text', 'test-user@example.com');
        cy.get('tr')
          .eq(0)
          .find('td')
          .eq(3)
          .find('solid-display-value')
          .should('have.text', 'admin');
      });
    });
  });

  it('makes cells editable (+dcat)', () => {
    cy.get('#table-users-editable, #dcat-table-users-editable').each($table => {
      cy.wrap($table).within(() => {
        cy.get('table')
          .find('tr')
          .eq(0)

          // first_name
          .find('td')
          .eq(0)
          .find('solid-form')
          .should('have.attr', 'data-src', '/examples/data/list/user-1.jsonld')
          .and('have.attr', 'fields', 'first_name')
          .and('have.attr', 'partial', '')
          .find('solid-form-label-text input[type="text"]')
          .should('have.value', 'Test')

          // last_name
          .parents('tr')
          .eq(0)
          .find('td')
          .eq(1)
          .find('solid-form')
          .should('have.attr', 'data-src', '/examples/data/list/user-1.jsonld')
          .and('have.attr', 'fields', 'last_name')
          .and('have.attr', 'enum-last_name', 'Smith, Williams, Anderson')
          .and('have.attr', 'partial', '')

          // email
          .parents('tr')
          .eq(0)
          .find('td')
          .eq(2)
          .find('solid-form')
          .should('have.attr', 'data-src', '/examples/data/list/user-1.jsonld')
          .and('have.attr', 'fields', 'email')
          .and('have.attr', 'widget-email', 'solid-form-email-label')
          .and('have.attr', 'class', 'email-input')
          .and('have.attr', 'submit-button', 'Validate modifications')
          .and('have.attr', 'partial', '');
      });
    });
  });

  it('keep selected lines (+dcat)', () => {
    ['#', '#dcat-'].forEach(tablePrefix => {
      cy.get(`${tablePrefix}table-skills`)
        // Line 2 (CSS)
        .find('input[type="checkbox"][data-selection]')
        .eq(1)
        .check()

        // Line 3 (Javascript)
        .parents('table')
        .find('input[type="checkbox"][data-selection]')
        .eq(2)
        .check();

      // Check data
      cy.get(`${tablePrefix}table-skills`).then($el => {
        expect((<any>$el[0]).component.selectedLines).to.deep.equal([
          '/examples/data/list/skill-2.jsonld',
          '/examples/data/list/skill-3.jsonld',
        ]);
      });

      // Order list
      cy.get(`${tablePrefix}sorter select[name=field]`).select('Skill name');

      // Check data
      cy.get(`${tablePrefix}table-skills`).then($el => {
        expect((<any>$el[0]).component.selectedLines).to.deep.equal([
          '/examples/data/list/skill-2.jsonld',
          '/examples/data/list/skill-3.jsonld',
        ]);
      });

      cy.get(`${tablePrefix}table-skills`)

        // Line 1 (CSS)
        .find('input[type="checkbox"][data-selection]')
        .eq(0)
        .should('be.checked')

        // Line 2 (DevOps)
        .parents('table')
        .find('input[type="checkbox"][data-selection]')
        .eq(1)
        .should('not.be.checked')

        // Line 3 (Git)
        .parents('table')
        .find('input[type="checkbox"][data-selection]')
        .eq(2)
        .should('not.be.checked')

        // Line 5 (Javascript)
        .parents('table')
        .find('input[type="checkbox"][data-selection]')
        .eq(4)
        .should('be.checked');
    });
  });

  it('numbers displayed (+dcat)', () => {
    ['#table-skills', '#dcat-table-skills'].forEach(tableId => {
      cy.get(tableId)
        // Check numbers displayed
        .find('solid-display-value[name="order"]')
        .eq(0)
        .should('be.visible')
        .and('contain', '5');
    });
  });

  it('grouped ordered tables (+dcat)', () => {
    cy.get('#grouped-table, #dcat-grouped-table').each($table => {
      cy.wrap($table).within(() => {
        cy.get('solid-group-default').should('have.length', 4);
        cy.get('solid-group-default').each((item, index) => {
          if (index === 0) {
            cy.wrap(item).find('span').contains('Opéra3');
          }
          if (index === 1) {
            cy.wrap(item).find('span').contains('Opéra2');
          }
          if (index === 2) {
            cy.wrap(item).find('span').contains('Opéra');
          }
        });
      });
    });

    cy.get('#grouped-table-year-desc, #dcat-grouped-table-year-desc').each(
      $table => {
        cy.wrap($table).within(() => {
          cy.get('solid-group-default').should('have.length', 4);
          cy.get('solid-group-default').each((item, index) => {
            if (index === 0) {
              cy.wrap(item).find('span').contains('2020');
            }
            if (index === 1) {
              cy.wrap(item).find('span').contains('2019');
            }
            if (index === 2) {
              cy.wrap(item).find('span').contains('2017');
            }
            if (index === 3) {
              cy.wrap(item).find('span').contains('2015');
            }
          });
        });
      },
    );

    cy.get('#grouped-table-year-asc, #dcat-grouped-table-year-asc').each(
      $table => {
        cy.wrap($table).within(() => {
          cy.get('solid-group-default').should('have.length', 4);
          cy.get('solid-group-default').each((item, index) => {
            if (index === 0) {
              cy.wrap(item).find('span').contains('2015');
            }
            if (index === 1) {
              cy.wrap(item).find('span').contains('2017');
            }
            if (index === 2) {
              cy.wrap(item).find('span').contains('2019');
            }
            if (index === 3) {
              cy.wrap(item).find('span').contains('2020');
            }
          });
        });
      },
    );

    cy.get('#grouped-table-date-desc, #dcat-grouped-table-date-desc').each(
      $table => {
        cy.wrap($table).within(() => {
          cy.get('solid-group-default').should('have.length', 4);
          cy.get('solid-group-default').each((item, index) => {
            if (index === 0) {
              cy.wrap(item).find('span').contains('2020-07-09');
            }
            if (index === 1) {
              cy.wrap(item).find('span').contains('2020-05-10');
            }
            if (index === 2) {
              cy.wrap(item).find('span').contains('2017-05-10');
            }
            if (index === 3) {
              cy.wrap(item).find('span').contains('2015-05-10');
            }
          });
        });
      },
    );

    cy.get('#grouped-table-date-asc, #dcat-grouped-table-date-asc').each(
      $table => {
        cy.wrap($table).within(() => {
          cy.get('solid-group-default').should('have.length', 4);
          cy.get('solid-group-default').each((item, index) => {
            if (index === 0) {
              cy.wrap(item).find('span').contains('2015-05-10');
            }
            if (index === 1) {
              cy.wrap(item).find('span').contains('2017-05-10');
            }
            if (index === 2) {
              cy.wrap(item).find('span').contains('2020-05-10');
            }
            if (index === 3) {
              cy.wrap(item).find('span').contains('2020-07-09');
            }
          });
        });
      },
    );
  });
});
