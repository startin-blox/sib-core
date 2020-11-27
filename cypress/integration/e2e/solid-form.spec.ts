describe('solid-form', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-form.html')
  });
  it('creation form', () => {
    cy.get('#form-1 input[type=text]').should('have.length', 2)
    cy.get('#form-1 input[type=text][name=name]').should('have.value', '');
    cy.get('#form-1 input[type=text][name="contact.email"]').should('have.value', '');
    cy.get('#form-1').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({ name: '', contact: { email: '' } });
      });
    });
  });
  it('edition form', () => {
    cy.get('#form-2 input[type=text]').should('have.length', 2)
    cy.get('#form-2 input[type=text][name=name]')
      .should('have.value', 'Coliving')
      .type(' in BZH');
    cy.get('#form-2 input[type=text][name="contact.email"]')
      .should('have.value', 'test-user@example.com')
      .clear()
      .type('admin@example.com');
    cy.get('#form-2').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          "@id": "../data/list/event-1.jsonld",
          contact: {
            email: 'admin@example.com',
            "@id": "user-1.jsonld",
          },
          name: 'Coliving in BZH',
        });
      });
    });
  });
  it('widget creation', () => {
    cy.get('#form-3 solid-form-dropdown')
    .should('have.attr', 'range', '../data/list/skills.jsonld')
    .should('have.attr', 'data-src', '../data/list/skills.jsonld')
    .should('have.attr', 'order-desc', 'name')
    .should('have.attr', 'name', 'skills')

    cy.get('#form-3 solid-form-label-text')
    .should('have.attr', 'label', 'Test label')
    .should('have.attr', 'placeholder', 'test placeholder')
    .should('have.attr', 'class', 'test-class')
    .should('have.attr', 'required')
  });

  it('richtext html rendering', () => {
    cy.get('#form-4 solid-form-richtext')
      .children().should('have.have.length', 2)
      .find('button')
      .and('have.attr', 'class', 'ql-bold');
    cy.get('#form-4 solid-form-richtext').then($el => {
      expect((<any>$el[0]).component.getValue()).to.equal('**Jean-Bernard**\n');
      cy.get('#form-4 solid-form-richtext .ql-editor').type('{selectall}Jean-Claude{selectall}')
      cy.get('#form-4 solid-form-richtext .ql-italic')
        .click()
        cy.get('#form-4 solid-form-richtext .ql-bold')
        .click()
      cy.get('#form-4 solid-form-richtext .ql-editor')
        .find('em')
        .should('have.text', 'Jean-Claude')
      cy.get('#form-4 solid-form-richtext').then($el => {
        expect((<any>$el[0]).component.getValue()).to.equal('_Jean-Claude_\n')
      });
    })
  });

  it('solid-form + pattern, title attributes', () => {
    cy.get('solid-form#form-5')
      .find('input')
      .should('have.attr', 'pattern', '[a-z]{3}')
      .and('have.attr', 'title', '3 lowercase letters');
  });

  it('solid-form with validation popup', () => {
    const stub = cy.stub();
    cy.on('window:confirm', stub)
    cy.get('solid-form#form-6')
      .should('have.attr', 'confirmation-message')
    cy.get('solid-form#form-6')
      .find('input[type=submit]')
      .click()
      .then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Please confirm your choice')
      });
  });

  it('re-render when label on submit-button change', () => {
    cy.get('solid-form#form-7')
      .find('input[type=submit]')
      .should('have.value', 'Register');
    cy.get('solid-form#form-7')
      .then(el => {
        el.attr('submit-button', 'Register the user');
        cy.get('solid-form#form-7')
        .find('input[type=submit]')
        .should('have.value', 'Register the user');
      })
  });

  it('show errors without resetting', () => {
    cy.server();
    cy.route({
      method: 'POST',
      url: '**/events.jsonld',
      status: 400,
      response: {
        "name": [
          "Ensure this field has no more than 10 characters."
        ],
        "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld"
      },
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });

    cy.get('solid-form#form-8')
      .find('input[name=name]')
      .type('Mon très long titre');
    cy.get('solid-form#form-8')
      .find('input[type=submit]')
      .click();
    cy.get('solid-form#form-8')
      .find('[data-id="error"]')
      .should('contain', 'A validation error occured')
      .and('contain', 'Ensure this field has no more than 10 characters.');
    cy.get('solid-form#form-8')
      .find('input[name=name]')
      .should('have.value', 'Mon très long titre')
  });

  it('solid-form with addable attributes', () => {
    // Verify addable's attributes are passed in the solid-form-dropdown-addable
    cy.get('solid-form#form-9 > form > solid-form-dropdown-addable')
    .should('have.attr', 'name', 'skills')
    .and('have.attr', 'addable-data-src', '../data/list/users.jsonld')
    .and('have.attr', 'addable-fields', 'name')
    .and('have.attr', 'addable-widget-name', 'solid-form-text-placeholder-label')
    .and('have.attr', 'addable-placeholder-name', 'Enter your name')
    .and('have.attr', 'addable-submit-button', 'Send name')
  }); 
})
