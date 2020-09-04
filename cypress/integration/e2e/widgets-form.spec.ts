describe('form widgets', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/widgets-form.html')
  })

  it('solid-form-text', () => {
    cy.get('solid-form-text')
      .children().should('have.length', 1);

    cy.get('solid-form-text') // check attributes
      .find('input')
      .should('have.attr', 'type', 'text')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', 'test value 1')
      .and('have.attr', 'data-holder');
    cy.get('solid-form-text').then($el => { // check API value
      expect((<any>$el[0]).component.getValue()).to.equal('test value 1'); // form value
    });

    cy.get('solid-form-text > input') // type value
      .clear()
      .type('new value');
    cy.get('solid-form-text > input')
      .and('have.attr', 'value', 'test value 1'); // attr does not change

    cy.get('solid-form-text').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('test value 1'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('new value'); // form value
    });

    cy.get('solid-form-text > input') // clear value
      .clear();
    cy.get('solid-form-text').then($el => { // Check API
      expect((<any>$el[0]).component.getValue()).to.equal(''); // value attribute
    });
  });

  it('solid-form-text + label and placeholders', () => {
    cy.get('solid-form-text-label')
      .children().should('have.length', 2);
    cy.get('solid-form-text-label')
      .find('> label').should('contain', 'My label');

    cy.get('solid-form-text-placeholder')
      .children().should('have.length', 1);
    cy.get('solid-form-text-placeholder')
      .find('> input').should('have.attr', 'placeholder', 'My placeholder');

    cy.get('solid-form-text-label-placeholder')
      .children().should('have.length', 2);
    cy.get('solid-form-text-label-placeholder')
      .find('> label').should('contain', 'test1');
    cy.get('solid-form-text-label-placeholder')
      .find('> input').should('have.attr', 'placeholder', 'test1');
  });

  it('solid-form-textarea', () => {
    cy.get('solid-form-textarea')
      .children().should('have.length', 1);

    cy.get('solid-form-textarea') // check attributes
      .find('textarea')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'data-holder');

    cy.get('solid-form-textarea').then($el => { // check API value
      expect((<any>$el[0]).component.getValue()).to.equal('test value 1'); // form value
    });

    cy.get('solid-form-textarea > textarea') // type value
      .clear()
      .type('new value');


    cy.get('solid-form-textarea').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('test value 1'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('new value'); // form value
    });
  })

  it('solid-form-checkbox', () => {
    cy.get('solid-form-checkbox')
      .children().should('have.length', 1);
    cy.get('solid-form-checkbox > label')
      .children().should('have.length', 2);

    cy.get('solid-form-checkbox') // check attributes
      .find('input')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'type', 'checkbox')
      .and('have.attr', 'data-holder', '')
      .and('have.attr', 'checked');
    cy.get('solid-form-checkbox')
      .find('div')
      .contains('test1');


    cy.get('solid-form-checkbox').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('true'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal(true); // form value
    });


    cy.get('solid-form-checkbox') // Change value
      .find('input').click();


    cy.get('solid-form-checkbox').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('true'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal(false); // form value
    });
  })
  it('solid-form-date', () => {
    cy.get('solid-form-date')
      .children().should('have.length', 1);
    // check attributes
    cy.get('solid-form-date')
      .find('input')
      .should('have.attr', 'type', 'date')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', '2020-05-21')
      .and('have.attr', 'data-holder');
    // type value
    cy.get('solid-form-date > input')
      .clear()
      .type('2020-12-31');
    cy.get('solid-form-date > input')
      .and('have.attr', 'value', '2020-05-21'); // attr does not change

    // Check API
    cy.get('solid-form-date').then($el => {
      expect((<any>$el[0]).component['value']).to.equal('2020-05-21'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('2020-12-31'); // form value
    });
  })

  it('solid-form-number', () => {
    cy.get('solid-form-number')
      .children().should('have.length', 1);

    cy.get('solid-form-number') // check attributes
      .find('input')
      .should('have.attr', 'type', 'number')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', '5')
      .and('have.attr', 'data-holder');

    cy.get('solid-form-number').then($el => { // check API value
      expect((<any>$el[0]).component.getValue()).to.equal(5); // form value
    });

    cy.get('solid-form-number > input') // type value
      .clear()
      .type('8');
    cy.get('solid-form-number > input')
      .and('have.attr', 'value', '5'); // attr does not change


    cy.get('solid-form-number').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('5'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal(8); // form value
    });
  });

  it('solid-form-hidden', () => {
    cy.get('solid-form-hidden')
      .children().should('have.length', 1);

    cy.get('solid-form-hidden') // check attributes
      .find('input')
      .should('have.attr', 'type', 'hidden')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', 'test value 1')
      .and('have.attr', 'data-holder');

    cy.get('solid-form-hidden').then($el => { // check API value
      expect((<any>$el[0]).component.getValue()).to.equal('test value 1'); // form value
    });

    cy.get('solid-form-hidden > input') // type value
      .invoke('attr', 'value', 'new value');

    cy.get('solid-form-hidden').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('test value 1'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('new value'); // form value
    });
  })

  it('solid-form-dropdown', () => {
    // With no initial value
    cy.get('solid-form-dropdown#test1')
      .should('have.attr', 'data-src', '../data/list/skills.jsonld')
      .children().should('have.length', 1);

    cy.get('solid-form-dropdown#test1') // check attributes
      .find('select')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'data-holder', '')
      .children().and('have.length', 9);

    cy.get('solid-form-dropdown#test1 > select > option').eq(0) // check options
      .should('have.attr', 'value', '')
      .contains('-');
    cy.get('solid-form-dropdown#test1 > select > option').eq(1)
      .should('have.attr', 'value', '{"@id": "skill-1.jsonld"}')
      .contains('HTML');

    cy.get('solid-form-dropdown#test1').then($el => { // Check API value
      expect((<any>$el[0]).component.getValue()).to.equal(''); // form value
    });

    cy.get('solid-form-dropdown#test1 > select').select('CSS').should('have.value', '{"@id": "skill-2.jsonld"}'); // test change value

    cy.get('solid-form-dropdown#test1').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal(''); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('{"@id": "skill-2.jsonld"}'); // form value
      expect((<any>$el[0]).component.context).to.be.not.empty; // check storeMixin properties
      expect((<any>$el[0]).component.resourceId).to.be.not.empty; // check storeMixin properties
    });

    // With initial value
    cy.get('solid-form-dropdown#test2 > select').should('have.value', '{"@id": "skill-2.jsonld"}');
    cy.get('solid-form-dropdown#test2').then($el => {
      expect((<any>$el[0]).component['value']).to.equal('skill-2.jsonld'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('{"@id": "skill-2.jsonld"}'); // form value
    });

    // With optionLabel
    cy.get('solid-form-dropdown#test3 > select > option').eq(1)
      .should('have.attr', 'value', '{"@id": "skill-1.jsonld"}')
      .contains('skill-1.jsonld');

    // With multiple
    cy.get('solid-form-dropdown#test4 > select')
      .should('have.attr', 'multiple', 'multiple')
      .children().should('have.length', 8);
    cy.get('solid-form-dropdown#test4').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal([{'@id': 'skill-1.jsonld'}, {'@id': 'skill-3.jsonld'}]); // form value
    });

    cy.get('solid-form-dropdown#test4 > select').select(['CSS', 'Javascript']) // change value
    cy.get('solid-form-dropdown#test4').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal([{'@id': 'skill-2.jsonld'}, {'@id': 'skill-3.jsonld'}]); // form value
    });

    // With order-desc
    cy.get('solid-form-dropdown#test5 > select > option').eq(1)
      .should('contain', 'Python');
    cy.get('solid-form-dropdown#test5 > select > option').eq(2)
      .should('contain', 'PHP');
    cy.get('solid-form-dropdown#test5 > select > option').eq(3)
      .should('contain', 'Node');
    cy.get('solid-form-dropdown#test5 > select > option').eq(4)
      .should('contain', 'Javascript');
    cy.get('solid-form-dropdown#test5 > select > option').eq(5)
      .should('contain', 'HTML');
    cy.get('solid-form-dropdown#test5 > select > option').eq(6)
      .should('contain', 'Git');
    cy.get('solid-form-dropdown#test5 > select > option').eq(7)
      .should('contain', 'DevOps');
    cy.get('solid-form-dropdown#test5 > select > option').eq(8)
      .should('contain', 'CSS');
  })

  it('solid-form-radio', () => {
    // With no initial value
    cy.get('solid-form-radio#test1')
      .should('have.attr', 'data-src', '../data/list/skills.jsonld')
      .children().should('have.length', 1);

    cy.get('solid-form-radio#test1') // check attributes
      .find('> div')
      .and('have.attr', 'name', 'test1')
      .children().and('have.length', 8);

    cy.get('solid-form-radio#test1 > div > label').eq(0) // check options
      .contains('HTML')
      .find('input')
      .should('have.attr', 'type', 'radio')
      .should('have.attr', 'value', '{"@id": "skill-1.jsonld"}');

    cy.get('solid-form-radio#test1').then($el => { // Check API value
      expect((<any>$el[0]).component.getValue()).to.equal(''); // form value
    });

    cy.get('solid-form-radio#test1 > div > label').eq(1).click(); // test change value

    cy.get('solid-form-radio#test1').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal(''); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('{"@id": "skill-2.jsonld"}'); // form value
      expect((<any>$el[0]).component.context).to.be.not.empty; // check storeMixin properties
      expect((<any>$el[0]).component.resourceId).to.be.not.empty; // check storeMixin properties
    });

    // With initial value
    cy.get('solid-form-radio#test2 label').eq(2).find('input').should('have.attr', 'checked', 'checked');
    cy.get('solid-form-radio#test2').then($el => {
      expect((<any>$el[0]).component['value']).to.equal('skill-3.jsonld'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('{"@id": "skill-3.jsonld"}'); // form value
    });
  })

  it('solid-form-rangenumber', () => {
    cy.get('solid-form-rangenumber')
      .children().should('have.length', 2);

    cy.get('solid-form-rangenumber > input').eq(0)
      .should('have.attr', 'data-holder', '')
      .and('have.attr', 'type', 'number')
      .and('have.attr', 'name', 'test1-start');
    cy.get('solid-form-rangenumber > input').eq(1)
      .should('have.attr', 'data-holder', '')
      .and('have.attr', 'type', 'number')
      .and('have.attr', 'name', 'test1-end');

    cy.get('solid-form-rangenumber').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['', '']); // form value
    });

    cy.get('solid-form-rangenumber > input').eq(0).type('8');
    cy.get('solid-form-rangenumber').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal([8, '']); // form value
    });
    cy.get('solid-form-rangenumber > input').eq(1).type('23');
    cy.get('solid-form-rangenumber').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal([8, 23]); // form value
    });
  });

  it('solid-form-rangedate', () => {
    cy.get('solid-form-rangedate')
      .children().should('have.length', 2);

    cy.get('solid-form-rangedate > input').eq(0)
      .should('have.attr', 'data-holder', '')
      .and('have.attr', 'type', 'date')
      .and('have.attr', 'name', 'test1-start');
    cy.get('solid-form-rangedate > input').eq(1)
      .should('have.attr', 'data-holder', '')
      .and('have.attr', 'type', 'date')
      .and('have.attr', 'name', 'test1-end');

    cy.get('solid-form-rangedate').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['', '']); // form value
    });

    cy.get('solid-form-rangedate > input').eq(0).type('2020-02-12');
    cy.get('solid-form-rangedate').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['2020-02-12', '']); // form value
    });
    cy.get('solid-form-rangedate > input').eq(1).type('2020-05-24');
    cy.get('solid-form-rangedate').then($el => {
      expect((<any>$el[0]).component.getValue()).to.deep.equal(['2020-02-12', '2020-05-24']); // form value
    });
  });
})
