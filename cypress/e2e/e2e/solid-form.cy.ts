// TODO: We should make tests run independently of one another
describe('solid-form', { testIsolation: false }, function () {
  let win: Window;
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-form.html');
    cy.window().then(w => {
      win = w;
    });
  });

  it('creation form', () => {
    cy.get('#form-1 input[type=text]').should('have.length', 2);
    cy.get('#form-1 input[type=text][name=name]').should('have.value', '');
    cy.get('#form-1 input[type=text][name="contact.email"]').should(
      'have.value',
      '',
    );
    cy.get('#form-1').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({ name: '', contact: { email: '' } });
      });
    });
  });

  it('form ignores empty set', () => {
    cy.get('#form-0').within(() => {
      cy.get('input[type=text]').should('have.length', 2);
      cy.get('input[name=with]').should('exist');
      cy.get('input[name=field]').should('exist');
    });
  });

  it('edition form', () => {
    cy.get('#form-edition-1 input[type=text]').should('have.length', 2);
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
          '@id': '/examples/data/list/event-1.jsonld',
          contact: {
            email: 'admin@example.com',
            '@id': '/examples/data/list/user-1.jsonld',
          },
          name: 'Coliving in BZH',
        });
      });
    });

    cy.intercept('PUT', '**/event-1.jsonld', {
      headers: {
        contentType: 'application/ld+json',
      },
    });

    cy.get('#form-edition-2 input[type=text][name=name]').type(' in BZH');
    cy.get('#form-edition-2 select').select('Pierre DLC');
    cy.get('#form-edition-2').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          name: 'Coliving in BZH',
          contact: {
            '@id': '/examples/data/list/user-4.jsonld',
          },
          '@id': '/examples/data/list/event-1.jsonld',
        });
      });
    });
    cy.get('#form-edition-2 input[type="submit"]').click();
    // After submit, form is re-rendered properly
    cy.get('#form-edition-2 input[type=text][name=name]').should(
      'have.value',
      'Coliving',
    );
    cy.get('#form-edition-2 select').should(
      'have.value',
      '{"@id": "/examples/data/list/user-1.jsonld"}',
    );

    // Nested container
    cy.get('#form-edition-3').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          skills: {
            'ldp:contains': [
              { '@id': '/examples/data/list/skill-2.jsonld' },
              { '@id': '/examples/data/list/skill-3.jsonld' },
            ],
            '@id': '/examples/data/list/user-1-skills.jsonld',
          },
          '@id': '/examples/data/list/user-1.jsonld',
        });
      });
    });
  });

  it('widget creation', () => {
    cy.get('#form-3 solid-form-dropdown')
      .should('have.attr', 'range', '/examples/data/list/skills.jsonld')
      .should('have.attr', 'data-src', '/examples/data/list/skills.jsonld')
      .should('have.attr', 'order-desc', 'name')
      .should('have.attr', 'name', 'skills');

    cy.get('#form-3 solid-form-label-placeholder-text')
      .should('have.attr', 'label', 'Test label')
      .should('have.attr', 'placeholder', 'test placeholder')
      .should('have.attr', 'class', 'solid-form-label-placeholder-text test-class')
      .should('have.attr', 'required');

    cy.get('#form-3 solid-form-label-placeholder-text')
      .find('input')
      .should('have.attr', 'placeholder', 'test placeholder');
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
    cy.get('solid-form-search#form-search-6')
      .find('input[type=submit]')
      .should('have.value', 'Register');

    cy.get('solid-form#form-6').then(el => {
      el.attr('submit-button', 'Register the user');
      cy.get('solid-form#form-6')
        .find('input[type=submit]')
        .should('have.value', 'Register the user');
    });
    cy.get('solid-form-search#form-search-6').then(el => {
      el.attr('submit-button', 'Register the user');
      cy.get('solid-form-search#form-search-6')
        .find('input[type=submit]')
        .should('have.value', 'Register the user');
    });
  });

  it('show errors without resetting', () => {
    cy.intercept('POST', '**/events.jsonld', {
      statusCode: 400,
      body: {
        name: ['Ensure this field has no more than 10 characters.'],
        batches: {
          title: ['Title too long', 'Title not unique'],
          tasks: {
            '@id': ['Task with this urlid already exists.'],
            amount: ['Should be > 0'],
          },
        },
        '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
      },
      headers: {
        'content-type': 'application/ld+json',
      },
    });

    cy.get('solid-form#form-7')
      .find('input[name=name]')
      .type('Mon très long titre');
    cy.get('solid-form#form-7').find('input[type=submit]').click();
    cy.get('solid-form#form-7')
      .find('[data-id="error"]')
      .should('contain', 'A validation error occurred.')
      .and('not.contain', '@context');
    cy.get('solid-form#form-7')
      .find('input[name=name]')
      .should('have.value', 'Mon très long titre');
    cy.get('solid-form#form-7')
      .find('.error[name=name] .error-message')
      .should('contain', 'Ensure this field has no more than 10 characters.');
    cy.get('solid-form#form-7')
      .find('.error[name="batches.title"] .error-message')
      .should('contain', 'Title too long');
    cy.get('solid-form#form-7')
      .find('.error[name="batches.tasks"] .error-message')
      .should('contain', 'Task with this urlid already exists.');
    cy.get('solid-form#form-7')
      .find('.error[name="batches.tasks"] .error-message')
      .should('contain', 'Should be > 0');

    // removes error after new submission
    cy.intercept('POST', '**/events.jsonld', {
      headers: {
        contentType: 'application/ld+json',
      },
      body: 'ok',
    });

    cy.get('solid-form#form-7').find('input[type=submit]').click();
    cy.get('solid-form#form-7').find('[data-id="error"]').should('be.empty');
  });

  it('partial attribute', () => {
    cy.spy(win.sibStore, 'put');
    cy.get('#form-8')
      .find('input[type=submit]')
      .click()
      .then(() => {
        expect(win.sibStore.put).to.be.called;
      });
    cy.spy(win.sibStore, 'patch');
    cy.get('#form-9')
      .find('input[type=submit]')
      .click()
      .then(() => {
        expect(win.sibStore.patch).to.be.called;
      });
  });

  it('naked attribute', () => {
    cy.get('#form-10').find('input[type=submit]').should('not.exist');
  });

  it('loader-id attribute', () => {
    cy.get('#form-loader').should('have.attr', 'hidden');
    cy.intercept('POST', '**/users.jsonld', {
      delay: 3000,
    });

    cy.get('#form-11').find('input[name=name]').type('Tryphon');
    cy.get('#form-11').find('input[type=submit]').click();
    cy.get('#form-loader').should('not.have.attr', 'hidden');
  });

  it('solid-form with addable attributes', () => {
    // Verify addable's attributes are passed in the solid-form-dropdown-addable
    cy.get('solid-form#form-addable > form > solid-form-dropdown-addable')
      .should('have.attr', 'name', 'skills')
      .and('have.attr', 'addable-data-src', '/examples/data/list/users.jsonld')
      .and('have.attr', 'addable-fields', 'name')
      .and(
        'have.attr',
        'addable-widget-name',
        'solid-form-text-placeholder-label',
      )
      .and('have.attr', 'addable-placeholder-name', 'Enter skill name')
      .and('have.attr', 'addable-submit-button', 'Send name');
  });

  it('autocomplete attribute', () => {
    cy.get('solid-form#form-12 > form > solid-form-label-text')
      .eq(0)
      .should('have.attr', 'autocomplete', 'off');
    cy.get('solid-form#form-12 > form > solid-form-label-text')
      .eq(0)
      .find('input[type=text]')
      .should('have.attr', 'autocomplete', 'off');
    cy.get('solid-form#form-12 > form > solid-form-label-text')
      .eq(1)
      .should('not.have.attr', 'autocomplete');
  });

  it('autosaves form', () => {
    cy.spy(win.sibStore, 'patch');
    cy.get('solid-form#form-autosave')
      .find('input[type="submit"]')
      .should('not.exist');
    cy.get('solid-form#form-autosave input[name="username"]')
      .type('a')
      .then(() => {
        expect(win.sibStore.patch).to.have.callCount(0);
      });
    cy.get('solid-form#form-autosave input[name="username"]')
      .blur()
      .then(() => {
        cy.wait(200).then(() => {
          expect(win.sibStore.patch).to.have.callCount(1);
        });
      });
    cy.get('solid-form#form-autosave [data-index="skills0"] button')
      .click()
      .then(() => {
        expect(win.sibStore.patch).to.have.callCount(2);
      });
    cy.get('solid-form#form-autosave [data-index="skills1"] select')
      .select('PHP')
      .then(() => {
        cy.wait(200).then(() => {
          expect(win.sibStore.patch).to.have.callCount(3);
        });
      });

    // Without autosave, no requests
    cy.get('solid-form#form-autosave').then($el => {
      $el.removeAttr('autosave');
      cy.get('solid-form#form-autosave input[name="username"]')
        .type('a')
        .blur()
        .then(() => {
          expect(win.sibStore.patch).to.have.callCount(3);
        });
    });
  });

  it('submit-widget attribute', () => {
    cy.get('solid-form#form-submit-widget')
      .find('input[type="submit"]')
      .should('not.exist');
    cy.get('solid-form#form-submit-widget')
      .find('div')
      .children('button[type="submit"]')
      .should('exist')
      .and('have.text', 'OK');
  });

  it('solid-form-time widget with attributes', () => {
    cy.spy(win.sibStore, 'post');
    cy.get('solid-form#time-widget').find('input[name="name"]').type('webinar');
    // Check min attribute consideration
    cy.get('solid-form#time-widget').find('input[type="time"]').type('11:00');
    cy.get('solid-form#time-widget')
      .find('input[type="submit"]')
      .click()
      .then(() => {
        expect(win.sibStore.post).not.be.called;
      });
    // Check max attribute consideration
    cy.get('solid-form#time-widget').find('input[type="time"]').type('16:00');
    cy.get('solid-form#time-widget')
      .find('input[type="submit"]')
      .click()
      .then(() => {
        expect(win.sibStore.post).not.be.called;
      });
    // Check step attribute consideration
    cy.get('solid-form#time-widget').find('input[type="time"]').type('13:10');
    cy.get('solid-form#time-widget')
      .find('input[type="submit"]')
      .click()
      .then(() => {
        expect(win.sibStore.post).not.be.called;
      });
    cy.get('solid-form#time-widget').find('input[type="time"]').type('13:00');
    cy.get('solid-form#time-widget')
      .find('input[type="submit"]')
      .click()
      .then(() => {
        expect(win.sibStore.post).to.be.called;
      });
  });

  it('minlength attribute', () => {
    cy.spy(win.sibStore, 'post');
    cy.get('solid-form#minlength')
      .find('input[type="text"]')
      .type('{selectall}Sacha');
    cy.get('solid-form#minlength')
      .find('input[type="submit"]')
      .click()
      .then(() => {
        expect(win.sibStore.post).not.be.called;
      });
  });

  it('class-submit-button attribute', () => {
    cy.get('solid-form#class-submit-button > form')
      .find('div')
      .should('have.attr', 'class', 'submitB-class')
      .find('input[type="submit"]')
      .should('exist');
    cy.get('solid-form#class-submit-button2 > form')
      .find('div')
      .should('have.attr', 'class', 'submitB-class2')
      .find('button')
      .should('exist');
  });
});
