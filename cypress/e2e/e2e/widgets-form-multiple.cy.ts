// TODO: We should make tests run independently of one another
describe('multiple widgets', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/widgets-form-multiple.html');
  });

  it('solid-form-multiple', () => {
    cy.get('solid-form-multiple#test1').children().should('have.length', 1);

    cy.get('solid-form-multiple#test1')
      .find('button')
      .should('contain', '+')
      .click(); // add a line

    // Check new line
    cy.get('solid-form-multiple#test1').children().should('have.length', 2);

    cy.get('solid-form-multiple#test1 > div[data-index="test0"]')
      .children()
      .should('have.length', 2);

    cy.get('solid-form-multiple#test1 > div[data-index="test0"]')
      .find('solid-form-text')
      .should('have.attr', 'data-holder', '')
      .should('have.attr', 'value', '')
      .should('have.attr', 'range', '')
      .should('have.attr', 'name', 'test');

    // Remove line
    cy.get('solid-form-multiple#test1 > div[data-index="test0"]')
      .find('button')
      .should('contain', '×')
      .click();

    cy.get('solid-form-multiple#test1').children().should('have.length', 1);
    cy.get('solid-form-multiple#test1 > div[data-index="test0"]').should(
      'not.exist',
    );
  });

  it('solid-form-multiple and range', () => {
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      cy.get(`solid-form-multiple${prefix}test2`)
        .find('button')
        .contains('+')
        .click(); // add a line

      // Check new line
      cy.get(`solid-form-multiple${prefix}test2`)
        .children()
        .should('have.length', 2);

      cy.get(`solid-form-multiple${prefix}test2 > div[data-index="test0"]`)
        .children()
        .should('have.length', 2);

      cy.get(`solid-form-multiple${prefix}test2 > div[data-index="test0"]`) // check attributes
        .find('solid-form-dropdown')
        .should('have.attr', 'data-holder', '')
        .should('have.attr', 'value', '')
        .should('have.attr', 'range', `/examples/data/${path}/skills.jsonld`)
        .should('have.attr', 'data-src', `/examples/data/${path}/skills.jsonld`)
        .should('have.attr', 'name', 'test');

      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test0"] solid-form-dropdown`,
      )
        .find('select > option') // check options
        .should('have.length', 9)
        .eq(4)
        .should('contain', 'DevOps');

      // add 2 new lines
      cy.get(`solid-form-multiple${prefix}test2`)
        .find('button')
        .contains('+')
        .click()
        .click();

      cy.get(`solid-form-multiple${prefix}test2`) // check children added
        .children()
        .should('have.length', 4);

      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test1"] solid-form-dropdown`,
      )
        .find('select > option')
        .should('have.length', 9); // check options of children

      // Select values
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test0"] solid-form-dropdown > select`,
      ).select('DevOps');
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test1"] solid-form-dropdown > select`,
      ).select('HTML');
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test2"] solid-form-dropdown > select`,
      ).select('Javascript');

      // Remove line
      cy.get(`solid-form-multiple${prefix}test2 > div[data-index="test0"]`)
        .find('button')
        .should('contain', '×')
        .click();

      cy.get(`solid-form-multiple${prefix}test2`) // check children
        .children()
        .should('have.length', 3);
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test0"]`,
      ).should('not.exist');
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test1"]`,
      ).should('exist');
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test2"]`,
      ).should('exist');

      // Check select values still here
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test1"] select`,
      ).should(
        'have.value',
        `{"@id": "/examples/data/${path}/skill-1.jsonld"}`,
      );
      cy.get(
        `solid-form-multiple${prefix}test2 > div[data-index="test2"] select`,
      ).should(
        'have.value',
        `{"@id": "/examples/data/${path}/skill-3.jsonld"}`,
      );

      // Check widget value
      cy.get(`solid-form-multiple${prefix}test2`).then($el => {
        // Check API
        expect((<any>$el[0]).component.value).to.equal(''); // value attribute
        expect((<any>$el[0]).component.getValue()).to.deep.equal([
          `{"@id": "/examples/data/${path}/skill-1.jsonld"}`,
          `{"@id": "/examples/data/${path}/skill-3.jsonld"}`,
        ]); // form value
      });
    });
  });

  it('solid-form-multiple and value', () => {
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      cy.get(`solid-form-multiple${prefix}test3`) // check data-src
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/user-1-skills.jsonld`,
        )
        .children()
        .should('have.length', 3);

      cy.get(`solid-form-multiple${prefix}test3 > button`).should(
        'contain',
        'add',
      );
      cy.get(
        `solid-form-multiple${prefix}test3 > div[data-index="test0"] > button`,
      ).should('contain', 'remove');

      cy.get(
        `solid-form-multiple${prefix}test3 > div[data-index="test0"] solid-form-dropdown`,
      ).should('have.attr', 'value', `/examples/data/${path}/skill-2.jsonld`);
      cy.get(
        `solid-form-multiple${prefix}test3 > div[data-index="test1"] solid-form-dropdown`,
      ).should('have.attr', 'value', `/examples/data/${path}/skill-3.jsonld`);

      // Check widget value
      cy.get(`solid-form-multiple${prefix}test3`).then($el => {
        // Check API
        expect((<any>$el[0]).component.value).to.equal(
          `/examples/data/${path}/user-1-skills.jsonld`,
        ); // value attribute
        expect((<any>$el[0]).component.getValue()).to.deep.equal([
          `{"@id": "/examples/data/${path}/skill-2.jsonld"}`,
          `{"@id": "/examples/data/${path}/skill-3.jsonld"}`,
        ]); // form value
      });

      cy.get(
        `solid-form-multiple${prefix}test3 > div[data-index="test1"] button`,
      ).click(); //remove line

      cy.get(`solid-form-multiple${prefix}test3`).then($el => {
        // Check API
        expect((<any>$el[0]).component.value).to.equal(
          `/examples/data/${path}/user-1-skills.jsonld`,
        ); // value attribute
        expect((<any>$el[0]).component.getValue()).to.deep.equal([
          `{"@id": "/examples/data/${path}/skill-2.jsonld"}`,
        ]); // form value
      });
      cy.get(`solid-form-multiple${prefix}test3 > button`).should(
        'have.class',
        'class-addbutton',
      );
      cy.get(
        `solid-form-multiple${prefix}test3 > div[data-index="test0"] > button`,
      ).should('have.class', 'class-removebutton');
    });
  });

  it('solid-form-multipleselect', () => {
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      cy.get(`solid-form-multipleselect${prefix}test4`) // check data-src
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/user-1-skills.jsonld`,
        )
        .children()
        .should('have.length', 1);

      cy.get(`solid-form-multipleselect${prefix}test4`)
        .find('solid-form-dropdown')
        .should('have.attr', 'multiple', 'multiple')
        .should('have.attr', 'name', 'test')
        .should('have.attr', 'range', `/examples/data/${path}/skills.jsonld`)
        .should('have.attr', 'data-src', `/examples/data/${path}/skills.jsonld`)
        .should(
          'have.attr',
          'values',
          `["/examples/data/${path}/skill-2.jsonld","/examples/data/${path}/skill-3.jsonld"]`,
        );

      cy.get(`solid-form-multipleselect${prefix}test4`).then($el => {
        // Check API
        expect((<any>$el[0]).component.value).to.equal(
          `/examples/data/${path}/user-1-skills.jsonld`,
        ); // value attribute
        expect((<any>$el[0]).component.getValue()).to.deep.equal([
          { '@id': `/examples/data/${path}/skill-2.jsonld` },
          { '@id': `/examples/data/${path}/skill-3.jsonld` },
        ]); // form value
      });

      cy.get(`solid-form-multipleselect${prefix}test4 select`).select([
        'CSS',
        'Javascript',
        'DevOps',
      ]);
      cy.get(`solid-form-multipleselect${prefix}test4`).then($el => {
        // Check API
        expect((<any>$el[0]).component.getValue()).to.deep.equal([
          { '@id': `/examples/data/${path}/skill-2.jsonld` },
          { '@id': `/examples/data/${path}/skill-3.jsonld` },
          { '@id': `/examples/data/${path}/skill-4.jsonld` },
        ]); // form value
      });
    });
  });

  it('solid-form-multipleselect-autocompletion', () => {
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      cy.get(`solid-form-multipleselect-autocompletion${prefix}test5`)
        .find('solid-form-dropdown')
        .should('have.attr', 'data-holder', '')
        .and('have.attr', 'multiple', 'multiple')
        .and('have.attr', 'name', 'test1')
        .and('have.attr', 'range', `/examples/data/${path}/skills.jsonld`)
        .and('have.attr', 'data-src', `/examples/data/${path}/skills.jsonld`)
        .and('have.attr', 'order-asc', 'name');
      cy.get(
        `solid-form-multipleselect-autocompletion${prefix}test5 > solid-form-dropdown`,
      )
        .find('select')
        .should('have.attr', 'data-holder', '')
        .and('have.attr', 'multiple', 'multiple')
        .and('have.attr', 'name', 'test1')
        .and('have.attr', 'style', 'display: none;')
        .and('have.attr', 'data-id');
      cy.get(
        `solid-form-multipleselect-autocompletion${prefix}test5 > div.ss-content > div.ss-list .ss-option`,
      )
        .eq(0)
        .should('contain', 'CSS');
      // select values
      cy.get(`solid-form-multipleselect-autocompletion${prefix}test5 .ss-main`)
        .filter(':visible')
        .eq(0)
        .click();
      cy.get(
        `solid-form-multipleselect-autocompletion${prefix}test5 .ss-content .ss-option`,
      )
        .eq(1)
        .click();
      cy.get(
        `solid-form-multipleselect-autocompletion${prefix}test5 .ss-option`,
      )
        .eq(1)
        .should('have.class', 'ss-selected');
      cy.get(
        `solid-form-multipleselect-autocompletion${prefix}test5 .ss-values`,
      )
        .eq(1)
        .children()
        .should('have.length', 1)
        .should('contain', 'DevOps');
    });
  });

  it('solid-form-autocompletion-placeholder & search attributes', () => {
    // attributes for placeholders and text displayed in SlimSelect
    cy.get('#search-attr')
      .find('.ss-placeholder')
      .filter(':visible')
      .contains('Sélectionne une compétence')
      .click({ force: true });
    cy.get('solid-form-multipleselect-autocompletion-placeholder')
      .find('.ss-search')
      .children()
      .eq(0)
      .should('have.attr', 'placeholder', 'Rechercher par clavier')
      .wait(200)
      .type('00');
    cy.get('#search-attr')
      .find('.ss-list')
      .children()
      .contains('Pas de concordance');
  });

  it('solid-form-checkboxes', () => {
    [{ prefix: '#' }, { prefix: '#dcat-' }].forEach(({ prefix }) => {
      cy.get(`solid-form-checkboxes${prefix}test1`)
        .find(`solid-form-multicheckbox > fieldset`)
        .children()
        .should('have.length', 9);
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(0)
        .should('not.have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(1)
        .should('have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(2)
        .should('have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(3)
        .should('not.have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(4)
        .should('not.have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(5)
        .should('not.have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(6)
        .should('not.have.attr', 'checked');
      cy.get(`solid-form-checkboxes${prefix}test1 input[type=checkbox]`)
        .eq(7)
        .should('not.have.attr', 'checked');

      // Get value
      cy.get(`solid-form-checkboxes${prefix}test2`)
        .find('input[value="html"]')
        .check({ force: true });

      cy.get(`solid-form-checkboxes${prefix}test2`).then($el => {
        // Check API
        expect((<any>$el[0]).component.getValue()).to.deep.equal(['html']); // form value
      });
    });
  });
});
