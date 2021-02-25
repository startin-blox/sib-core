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
    });
    // add link button in richtext mixin
    cy.get('#form-4bis solid-form-richtext > div ').children().eq(4)
      .find('button')
      .and('have.attr', 'class', 'ql-link');
    cy.get('#form-4bis solid-form-richtext .ql-editor').type('{selectall}test link{selectall}')
    cy.get('#form-4bis solid-form-richtext .ql-link')
      .click()
    cy.get('#form-4bis solid-form-richtext > div[name=name] > div[data-mode=link] > input[type=text]')
      .type('http://www.yesnoif.com/')
    cy.get('#form-4bis solid-form-richtext > div[name=name] > div[data-mode=link] > a[class=ql-action]')
      .click()
    cy.get('#form-4bis solid-form-richtext .ql-editor')
      .find('a').should('have.attr', 'href', 'http://www.yesnoif.com/')
      .and('contain', 'test link');
    // verify value format sent in the form
    cy.get('#form-4bis input[type=submit]').click()
    cy.get('#form-4bis').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res.name).to.equal('[test link](http://www.yesnoif.com/)\n');
      });
    });
    // value stocked in markdown well displayed in the solid-form-richtext
    cy.get('#form-4ter solid-form-richtext > div[name=website]')
      .find('a').should('have.attr', 'href', 'http://drawing.garden/')
      .and('contain', 'my site')
  });

  it('solid-form + pattern, title attributes', () => {
    cy.get('solid-form#form-5')
      .find('input')
      .should('have.attr', 'pattern', '[a-z]{3}')
      .and('have.attr', 'title', '3 lowercase letters');
  });
  it('re-render when label on submit-button change', () => {
    cy.get('solid-form#form-6')
      .find('input[type=submit]')
      .should('have.value', 'Register');
    cy.get('solid-form#form-6')
      .then(el => {
        el.attr('submit-button', 'Register the user');
        cy.get('solid-form#form-6')
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
        "batches": {
              "title": ["Title too long", "Title not unique"],
              "tasks": {
                "@id": ["Task with this urlid already exists."],
                "amount": ["Should be > 0"]
              }
        },
        "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld"
      },
      onRequest: (xhr) => { xhr.setRequestHeader('content-type', 'application/ld+json') }
    });

    cy.get('solid-form#form-7')
      .find('input[name=name]')
      .type('Mon très long titre');
    cy.get('solid-form#form-7')
      .find('input[type=submit]')
      .click();
    cy.get('solid-form#form-7')
      .find('[data-id="error"]')
      .should('contain', 'A validation error occured')
      .and('contain', 'name: Ensure this field has no more than 10 characters.')
      .and('contain', 'batches - title: Title too long, Title not unique')
      .and('contain', 'batches - tasks - @id: Task with this urlid already exists.')
      .and('contain', 'batches - tasks - amount: Should be > 0')
      .and('not.contain', '@context');
    cy.get('solid-form#form-7')
      .find('input[name=name]')
      .should('have.value', 'Mon très long titre')
  });
  it('partial attribute', () => {
    cy.spy(win.sibStore, 'put');
    cy.get('#form-8').find('input[type=submit]').click().then(() => {
      expect(win.sibStore.put).to.be.called;
    });
    cy.spy(win.sibStore, 'patch');
    cy.get('#form-9').find('input[type=submit]').click().then(() => {
      expect(win.sibStore.patch).to.be.called;
    });
  });
  it('naked attribute', () => {
    cy.get('#form-10').find('input[type=submit]').should('not.exist');
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
    cy.get('#form-11')
      .find('input[name=name]')
      .type('Tryphon');
    cy.get('#form-11')
      .find('input[type=submit]')
      .click();
    cy.get('#form-loader').should('not.have.attr', 'hidden');
  });
  it('solid-form with addable attributes', () => {
    // Verify addable's attributes are passed in the solid-form-dropdown-addable
    cy.get('solid-form#form-addable > form > solid-form-dropdown-addable')
    .should('have.attr', 'name', 'skills')
    .and('have.attr', 'addable-data-src', '../data/list/users.jsonld')
    .and('have.attr', 'addable-fields', 'name')
    .and('have.attr', 'addable-widget-name', 'solid-form-text-placeholder-label')
    .and('have.attr', 'addable-placeholder-name', 'Enter your name')
    .and('have.attr', 'addable-submit-button', 'Send name')
  });
  it('autocomplete attribute', () => {
    cy.get('solid-form#form-12 > form > solid-form-label-text').eq(0)
      .should('have.attr', 'autocomplete', 'off')
    cy.get('solid-form#form-12 > form > solid-form-label-text').eq(0)
      .find('input[type=text]')
      .should('have.attr', 'autocomplete', 'off')
    cy.get('solid-form#form-12 > form > solid-form-label-text').eq(1)
      .should('not.have.attr', 'autocomplete')
  });
  it('autosaves form', () => {
    cy.spy(win.sibStore, 'patch');
    cy.get('solid-form#form-autosave').find('input[type="submit"]')
      .should('not.exist');
    cy.get('solid-form#form-autosave input[name="username"]').type('a').then(() => {
      expect(win.sibStore.patch).to.have.callCount(0);
    });
    cy.get('solid-form#form-autosave input[name="username"]').blur().then(() => {
      cy.wait(200).then(() => {
        expect(win.sibStore.patch).to.have.callCount(1);
      });
    });
    cy.get('solid-form#form-autosave [data-index="skills0"] button').click().then(() => {
      expect(win.sibStore.patch).to.have.callCount(2);
    });
    cy.get('solid-form#form-autosave [data-index="skills1"] select').select('{"@id": "skill-5.jsonld"}').then(() => {
      cy.wait(200).then(() => {
        expect(win.sibStore.patch).to.have.callCount(3);
      })
    });

    // Without autosave, no requests
    cy.get('solid-form#form-autosave').then(($el) => {
      $el.removeAttr('autosave');
      cy.get('solid-form#form-autosave input[name="username"]').type('a').blur().then(() => {
        expect(win.sibStore.patch).to.have.callCount(3);
      });
    });
  });
  it('submit-widget attribute', () => {
    cy.get('solid-form#form-submit-widget').find('input[type="submit"]')
      .should('not.exist');
    cy.get('solid-form#form-submit-widget').find('button[type="submit"]')
      .should('exist')
      .and('have.text', 'OK');
  });
  it('solid-form-time widget with attributes', () => {
    cy.spy(win.sibStore, 'post');
    cy.get('solid-form#time-widget').find('input[name="name"]')
      .type('webinar');
    // Check min attribute consideration
    cy.get('solid-form#time-widget').find('input[type="time"]')
      .type('11:00');
    cy.get('solid-form#time-widget').find('input[type="submit"]')
      .click().then(() => {
        expect(win.sibStore.post).not.be.called;
      });
    // Check max attribute consideration
    cy.get('solid-form#time-widget').find('input[type="time"]')
      .type('16:00');
    cy.get('solid-form#time-widget').find('input[type="submit"]')
      .click().then(() => {
        expect(win.sibStore.post).not.be.called;
      });
    // Check step attribute consideration
    cy.get('solid-form#time-widget').find('input[type="time"]')
      .type('13:10');
    cy.get('solid-form#time-widget').find('input[type="submit"]')
      .click().then(() => {
        expect(win.sibStore.post).not.be.called;
      });
    cy.get('solid-form#time-widget').find('input[type="time"]')
      .type('13:00');
    cy.get('solid-form#time-widget').find('input[type="submit"]')
      .click().then(() => {
        expect(win.sibStore.post).to.be.called;
      });
  });
  it('minlength attribute', () => {
    cy.spy(win.sibStore, 'post');
    cy.get('solid-form#minlength').find('input[type="text"]')
      .type('{selectall}Sacha');
    cy.get('solid-form#minlength').find('input[type="submit"]').click()
      .then(() => {
        expect(win.sibStore.post).not.be.called;
      });
  });
})
