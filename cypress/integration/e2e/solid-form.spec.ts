describe('solid-form', function() {
  let win: Window;
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-form.html');
    cy.window().then(w => {
      win = w;
    });

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
    cy.get('#form-edition-1 input[type=text]').should('have.length', 2)
    cy.get('#form-edition-1 input[type=text][name=name]')
      .should('have.value', 'Coliving')
      .type(' in BZH');
    cy.get('#form-edition-1 input[type=text][name="contact.email"]')
      .should('have.value', 'test-user@example.com')
      .clear()
      .type('admin@example.com');
    cy.get('#form-edition-1').then($el => {
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


    cy.server();
    cy.route({
      method: 'PUT',
      url: '**/event-1.jsonld',
      status: 200,
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });
    cy.get('#form-edition-2 input[type=text][name=name]')
      .type(' in BZH');
    cy.get('#form-edition-2 select').select('Pierre DLC')
    cy.get('#form-edition-2').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          name: 'Coliving in BZH',
          contact: {
            "@id": "user-4.jsonld",
          },
          "@id": "../data/list/event-1.jsonld",
        });
      });
    });
    cy.get('#form-edition-2 input[type="submit"]').click();
    // After submit, form is re-rendered properly
    cy.get('#form-edition-2 input[type=text][name=name]')
      .should('have.value', 'Coliving');
    cy.get('#form-edition-2 select')
      .should('have.value', '{"@id": "user-1.jsonld"}');
  });
  it('widget creation', () => {
    cy.get('#form-3 solid-form-dropdown')
      .should('have.attr', 'range', '../data/list/skills.jsonld')
      .should('have.attr', 'data-src', '../data/list/skills.jsonld')
      .should('have.attr', 'order-desc', 'name')
      .should('have.attr', 'name', 'skills')

    cy.get('#form-3 solid-form-label-placeholder-text')
      .should('have.attr', 'label', 'Test label')
      .should('have.attr', 'placeholder', 'test placeholder')
      .should('have.attr', 'class', 'test-class')
      .should('have.attr', 'required')

    cy.get('#form-3 solid-form-label-placeholder-text')
      .find('input')
      .should('have.attr', 'placeholder', 'test placeholder')
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
  it('partial attribute', () => {
    cy.spy(win.sibStore, 'put');
    cy.get('#form-9').find('input[type=submit]').click().then(() => {
      expect(win.sibStore.put).to.be.called;
    });  
    cy.spy(win.sibStore, 'patch');
    cy.get('#form-10').find('input[type=submit]').click().then(() => {
      expect(win.sibStore.patch).to.be.called;
    });
  });
  it('naked attribute', () => {
    cy.get('#form-11').find('input[type=submit]').should('not.exist');
  });
  it('loader-id attribute', () => {
    cy.get('#form-loader').should('have.attr', 'hidden');
    cy.server();
    cy.route({
      method: 'POST',
      url: '**/users.jsonld',
      response: {},
      delay: 3000
    });
    cy.get('#form-12')
      .find('input[name=name]')
      .type('Tryphon');
    cy.get('#form-12')
      .find('input[type=submit]')
      .click();
    cy.get('#form-loader').should('not.have.attr', 'hidden');
  });
})
