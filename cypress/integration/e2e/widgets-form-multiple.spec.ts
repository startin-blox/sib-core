describe('group-by', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/widgets-form-multiple.html')
  })

  it('solid-form-multiple', () => {
    cy.get('solid-form-multiple#test1')
      .children().should('have.length', 1);

    cy.get('solid-form-multiple#test1')
      .find('button')
      .should('contain', '+')
      .click(); // add a line

    // Check new line
    cy.get('solid-form-multiple#test1')
      .children().should('have.length', 2);

    cy.get('solid-form-multiple#test1 > div[data-index="test0"]')
      .children().should('have.length', 2);

    cy.get('solid-form-multiple#test1 > div[data-index="test0"]')
      .find('solid-form-text')
      .should('have.attr', 'data-holder', '')
      .should('have.attr', 'value', '')
      .should('have.attr', 'range', '')
      .should('have.attr', 'name', 'test')

    // Remove line
    cy.get('solid-form-multiple#test1 > div[data-index="test0"]')
      .find('button')
      .should('contain', 'x')
      .click();

    cy.get('solid-form-multiple#test1')
      .children().should('have.length', 1);
    cy.get('solid-form-multiple#test1 > div[data-index="test0"]').should('not.exist')
  })

  it('solid-form-multiple and range', () => {
    cy.get('solid-form-multiple#test2')
      .find('button').contains('+')
      .click(); // add a line

    // Check new line
    cy.get('solid-form-multiple#test2')
      .children().should('have.length', 2);

    cy.get('solid-form-multiple#test2 > div[data-index="test0"]')
      .children().should('have.length', 2);

    cy.get('solid-form-multiple#test2 > div[data-index="test0"]') // check attributes
      .find('solid-form-dropdown')
      .should('have.attr', 'data-holder', '')
      .should('have.attr', 'value', '')
      .should('have.attr', 'range', '../data/list/skills.jsonld')
      .should('have.attr', 'data-src', '../data/list/skills.jsonld')
      .should('have.attr', 'name', 'test')

    cy.get('solid-form-multiple#test2 > div[data-index="test0"] solid-form-dropdown')
      .find('select > option') // check options
      .should('have.length', 5)
      .eq(4).should('contain', 'DevOps');

    // add 2 new lines
    cy.get('solid-form-multiple#test2')
      .find('button').contains('+')
      .click()
      .click();

    cy.get('solid-form-multiple#test2') // check children added
      .children().should('have.length', 4);

    cy.get('solid-form-multiple#test2 > div[data-index="test1"] solid-form-dropdown')
      .find('select > option').should('have.length', 5); // check options of children

    // Select values
    cy.get('solid-form-multiple#test2 > div[data-index="test0"] solid-form-dropdown > select')
      .select('DevOps');
    cy.get('solid-form-multiple#test2 > div[data-index="test1"] solid-form-dropdown > select')
      .select('HTML');
    cy.get('solid-form-multiple#test2 > div[data-index="test2"] solid-form-dropdown > select')
      .select('Javascript');

    // Remove line
    cy.get('solid-form-multiple#test2 > div[data-index="test0"]')
      .find('button')
      .should('contain', 'x')
      .click();

    cy.get('solid-form-multiple#test2') // check children
      .children().should('have.length', 3);
    cy.get('solid-form-multiple#test2 > div[data-index="test0"]').should('not.exist')
    cy.get('solid-form-multiple#test2 > div[data-index="test1"]').should('exist')
    cy.get('solid-form-multiple#test2 > div[data-index="test2"]').should('exist')

    // Check select values still here
    cy.get('solid-form-multiple#test2 > div[data-index="test1"] select')
      .should('have.value', '{"@id": "skill-1.jsonld"}');
    cy.get('solid-form-multiple#test2 > div[data-index="test2"] select')
      .should('have.value', '{"@id": "skill-3.jsonld"}');

    // Check widget value
    cy.get('solid-form-multiple#test2').then($el => { // Check API
      expect((<any>$el[0]).component.value).to.equal(''); // value attribute
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['{"@id": "skill-1.jsonld"}', '{"@id": "skill-3.jsonld"}']); // form value
    });
  })

  it('solid-form-multiple and value', () => {
    cy.get('solid-form-multiple#test3') // check data-src
      .should('have.attr', 'data-src', '../data/list/user-1-skills.jsonld')
      .children().should('have.length', 3);

    cy.get('solid-form-multiple#test3 > button')
      .should('contain', 'add');
    cy.get('solid-form-multiple#test3 > div[data-index="test0"] > button')
        .should('contain', 'remove');

    cy.get('solid-form-multiple#test3 > div[data-index="test0"] solid-form-dropdown')
      .should('have.attr', 'value', 'skill-2.jsonld');
    cy.get('solid-form-multiple#test3 > div[data-index="test1"] solid-form-dropdown')
      .should('have.attr', 'value', 'skill-3.jsonld');

    // Check widget value
    cy.get('solid-form-multiple#test3').then($el => { // Check API
      expect((<any>$el[0]).component.value).to.equal('../data/list/user-1-skills.jsonld'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['{"@id": "skill-2.jsonld"}', '{"@id": "skill-3.jsonld"}']); // form value
    });

    cy.get('solid-form-multiple#test3 > div[data-index="test1"] button').click(); //remove line

    cy.get('solid-form-multiple#test3').then($el => { // Check API
      expect((<any>$el[0]).component.value).to.equal('../data/list/user-1-skills.jsonld'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['{"@id": "skill-2.jsonld"}']); // form value
    });
  });


  it('solid-form-multipleselect', () => {
    cy.get('solid-form-multipleselect') // check data-src
      .should('have.attr', 'data-src', '../data/list/user-1-skills.jsonld')
      .children().should('have.length', 1);

    cy.get('solid-form-multipleselect')
      .find('solid-form-dropdown')
      .should('have.attr', 'multiple', 'multiple')
      .should('have.attr', 'name', 'test')
      .should('have.attr', 'range', '../data/list/skills.jsonld')
      .should('have.attr', 'data-src', '../data/list/skills.jsonld')
      .should('have.attr', 'values', '["skill-2.jsonld","skill-3.jsonld"]');

    cy.get('solid-form-multipleselect').then($el => { // Check API
      expect((<any>$el[0]).component.value).to.equal('../data/list/user-1-skills.jsonld'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.deep.equal([{"@id": "skill-2.jsonld"}, {"@id": "skill-3.jsonld"}]); // form value
    });

    cy.get('solid-form-multipleselect select').select(['CSS', 'Javascript', 'DevOps']);
    cy.get('solid-form-multipleselect').then($el => { // Check API
      expect((<any>$el[0]).component.getValue()).to.deep.equal([{"@id": "skill-2.jsonld"}, {"@id": "skill-3.jsonld"}, {"@id": "skill-4.jsonld"}]); // form value
    });
  });
})
