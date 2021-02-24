describe('form widgets', function() {
  this.beforeAll('visit', () => {
    cy.clock(Date.UTC(2020, 11, 15), ['Date']); // Define fake date for start-value="today" test
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
    cy.get('solid-form-date#test1')
      .children().should('have.length', 1);
    // check attributes
    cy.get('solid-form-date#test1')
      .find('input')
      .should('have.attr', 'type', 'date')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', '2020-05-21')
      .and('have.attr', 'data-holder');
    // type value
    cy.get('solid-form-date#test1 > input')
      .clear()
      .type('2020-12-31');
    cy.get('solid-form-date#test1 > input')
      .and('have.attr', 'value', '2020-05-21'); // attr does not change

    // Check API
    cy.get('solid-form-date#test1').then($el => {
      expect((<any>$el[0]).component['value']).to.equal('2020-05-21'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('2020-12-31'); // form value
    });

    cy.get('solid-form-date#test2')
      .find('input')
      .and('have.attr', 'value', '2020-05-21');
    cy.get('solid-form-date#test3')
      .find('input')
      .and('have.attr', 'value', '');
  })

  it('solid-form-number', () => {
    cy.get('solid-form-number')
      .children().should('have.length', 1);

    cy.get('solid-form-number') // check attributes
      .find('input')
      .should('have.attr', 'type', 'number')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', '5')
      .and('have.attr', 'min', '2')
      .and('have.attr', 'max', '7')
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

  it('solid-form-email', () => {
    cy.get('solid-form-email')
      .children().should('have.length', 1);

    cy.get('solid-form-email') // check attributes
      .find('input')
      .should('have.attr', 'type', 'email')
      .and('have.attr', 'name', 'test1')
      .and('have.attr', 'value', 'test@test.com')
      .and('have.attr', 'data-holder');

    cy.get('solid-form-email').then($el => { // check API value
      expect((<any>$el[0]).component.getValue()).to.equal('test@test.com'); // form value
    });

    cy.get('solid-form-email > input') // type value
      .clear()
      .type('new@example.com');
    cy.get('solid-form-email > input')
      .and('have.attr', 'value', 'test@test.com'); // attr does not change


    cy.get('solid-form-email').then($el => { // Check API
      expect((<any>$el[0]).component['value']).to.equal('test@test.com'); // value attribute
      expect((<any>$el[0]).component.getValue()).to.equal('new@example.com'); // form value
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

    // With federation
    cy.get('solid-form-dropdown#test6 > select > option').eq(1)
      .should('contain', 'Circle from server 1');
    cy.get('solid-form-dropdown#test6 > select > option').eq(2)
      .should('contain', 'Another circle from server 1');
    cy.get('solid-form-dropdown#test6 > select > option').eq(3)
      .should('contain', 'Circle from server 2');
    cy.get('solid-form-dropdown#test6 > select > option').eq(4)
      .should('contain', 'Another circle from server 2');

    // With enumeration in range
    cy.get('solid-form-dropdown#test7 > select')
      .should('have.value', 'option1')
      .children().should('have.length', 5)
      .eq(2)
      .should('have.attr', 'value', 'option2')
      .should('contain', 'option2');
    cy.get('solid-form-dropdown#test8 > select')
      .children().should('have.length', 4)
      .eq(1)
      .should('have.attr', 'value', '1')
      .should('contain', 'option a');

    // With autocompletion and placeholder
    cy.get('solid-form-dropdown-autocompletion-placeholder > select')
      .children()
      .should('have.length', 8);
    cy.get('solid-form-dropdown-autocompletion-placeholder > div')
      .find('div .ss-search').children()
      .eq(0)
      .should('have.attr', 'placeholder', 'Skills :');
    cy.get('solid-form-dropdown-autocompletion-placeholder > div')
      .find('div .ss-list')
      .children()
      .should('have.length', 8)
      .should('not.contain', 'Skills :');
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
      .parent()
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

    cy.get('solid-form-radio#test3')
      .find('> div')
      .and('have.attr', 'name', 'test3')
      .children().and('have.length', '3');

    cy.get('solid-form-radio#test3 > div > label').eq(0)
      .contains('option1')
      .parent()
      .find('input')
      .should('have.attr', 'type', 'radio')
      .should('have.attr', 'value', 'option1');

      // Test click on multiple radio
    cy.get('solid-form-radio#test3 input[type=radio][value="option1"]')
      .check().should('be.checked');
    cy.get('solid-form-radio#test3 input[type=radio][value="option2"]')
      .should('not.be.checked');
    cy.get('solid-form-radio#test3 input[type=radio][value="option3"]')
      .should('not.be.checked');

    cy.get('solid-form-radio#test3 input[type=radio][value="option3"]')
      .check().should('be.checked');
    cy.get('solid-form-radio#test3 input[type=radio][value="option1"]')
      .should('not.be.checked');
    cy.get('solid-form-radio#test3 input[type=radio][value="option2"]')
      .should('not.be.checked');

    cy.get('solid-form-radio#test4')
      .find('> div')
      .and('have.attr', 'name', 'test4')
      .children().and('have.length', '4')

    cy.get('solid-form-radio#test4 > div > label').eq(0)
      .contains('option1')
      .parent()
      .find('input')
      .should('have.attr', 'type', 'radio')
      .should('have.attr', 'value', 'a');
  })

  it('solid-form-checkboxes', () => {
    cy.get('#test-checkboxes')
      .find('label:nth-child(-2n + 6)').click({ multiple:true })
    cy.get('#test-checkboxes').then(async ($el: any) => {
      const values = await $el[0].component.getValue();
      expect(values).to.deep.equal([
        { "@id": "skill-2.jsonld" },
        { "@id": "skill-4.jsonld" },
        { "@id": "skill-6.jsonld" },
      ]);
    });
  })

  it('solid-form-rangenumber', () => {
    cy.get('solid-form-rangenumber[name=test1]')
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

    // Addition start-value-[field] and end-value-[field] attributes
    cy.get('solid-form-rangenumber[name=test2] > input').eq(0)
      .should('have.attr', 'value', '2')
    cy.get('solid-form-rangenumber[name=test2] > input').eq(1)
      .should('have.attr', 'value', '10')
  });
  it('solid-form-rangedate', () => {
    cy.get('solid-form-rangedate[name=test1]')
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

    // Addition start-value-[field] and end-value-[field] attributes
    cy.get('solid-form-rangedate[name=test2] > input').eq(0)
      .should('have.attr', 'value', '2020-12-15')
    cy.get('solid-form-rangedate[name=test2] > input').eq(1)
      .should('have.attr', 'value', '2222-12-22')
  });

  it('solid-form-color', () => {
    cy.get('solid-form-color')
      .children().should('have.length', 1)

    cy.get('solid-form-color > input')
      .should('have.attr', 'type', 'color')
  });
  it('solid-form-text-labellast', () => {
    cy.get('solid-form-text-labellast').children()
      .should('have.length', 2);
    cy.get('solid-form-text-labellast').find('label').last()
      .should('contain', 'test labellast');
  });
  it('solid-form-dropdown-addable', () => {
    // Without addable-data-src provided
    cy.get('solid-form-dropdown-addable#test1')
      .children().should('have.length', 2);
    cy.get('solid-form-dropdown-addable#test1 > solid-form')
      .should('have.attr', 'data-src', '../data/list/skills.jsonld');

    cy.get('solid-form-dropdown-addable#test1 > solid-form > form')
      .children().should('have.length', 3)
    cy.get('solid-form-dropdown-addable#test1 > solid-form > form > solid-form-label-text').eq(0)
      .should('have.attr', 'name', 'name')
    cy.get('solid-form-dropdown-addable#test1 > solid-form > form > solid-form-label-text').eq(1)
      .should('have.attr', 'name', 'order')
    cy.get('solid-form-dropdown-addable#test1 > solid-form > form > input')
      .should('have.attr', 'type', 'submit')

    // With addable-data-src provided

    // Verify attributes are passed in the solid-form created in solid-form-dropdown-addable
    cy.get('solid-form-dropdown-addable#test2 > solid-form')
      .should('have.attr', 'data-src', '../data/list/users.jsonld')
      .and('have.attr', 'fields', 'name, username, age')
      .and('have.attr', 'widget-name', 'solid-form-text-placeholder-label')
      .and('have.attr', 'placeholder-name', 'Enter your name')
      .and('have.attr', 'submit-button', 'Send data')
    cy.get('solid-form-dropdown-addable#test2 > solid-form > form')
      .children().should('have.length', 4)
    // Verify attributes and values in tags created by widget  
    cy.get('solid-form-dropdown-addable#test2 > solid-form > form > solid-form-text-placeholder-label')
      .should('have.attr', 'name', 'name')
      .and('have.attr', 'placeholder', 'Enter your name')
    cy.get('solid-form-dropdown-addable#test2 > solid-form > form > solid-form-text-placeholder-label')
      .find('label').should('contain', 'name')
    cy.get('solid-form-dropdown-addable#test2 > solid-form > form > solid-form-text-placeholder-label')
      .find('input').should('have.attr', 'placeholder', 'Enter your name')

    cy.get('solid-form-dropdown-addable#test2 > solid-form > form > solid-form-label-text').eq(0)
      .should('have.attr', 'name', 'username')
    cy.get('solid-form-dropdown-addable#test2 > solid-form > form > solid-form-label-text').eq(1)
      .should('have.attr', 'name', 'age')
    cy.get('solid-form-dropdown-addable#test2 > solid-form > form > input')
      .should('have.attr', 'type', 'submit')
      .and('have.attr', 'value', 'Send data')
    });
  it('solid-form-password', () => {
    cy.get('solid-form-label-password')
      .children().should('have.length', 2);
    cy.get('solid-form-label-password')
      .children().eq(0).should('contain', 'password');
    cy.get('solid-form-label-password > input')
      .should('have.attr', 'type', 'password')
      .and('have.value', 'password123');
  });
  it('solid-form-time', () => {
    cy.get('solid-form-label-time#time1')
      .children().should('have.length', 2);
    cy.get('solid-form-label-time#time1')
      .children().eq(0).should('contain', 'time');
    cy.get('solid-form-label-time#time1 > input')
      .should('have.attr', 'type', 'time')
      .and('have.value', '15:15');
    
    cy.get('solid-form-label-time#time2')
      .children().eq(0).should('contain', 'start time');
    cy.get('solid-form-label-time#time2 > input')
      .should('have.attr', 'type', 'time')
      .and('have.attr', 'min', "12:00")
      .and('have.attr', 'max', "14:00")
      .and('have.attr', 'step', "3600");
  });
})
