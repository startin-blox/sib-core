// TODO: We should make tests run independently of one another
describe('solid-widget', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-widget.html');
  });

  // Display
  it('simple widget', () => {
    cy.get('#display-1')
      .find('custom-widget-1 label')
      .should('contain.text', 'email');
    cy.get('#display-1')
      .find('custom-widget-1 span')
      .should('contain.text', 'test-user@example.com');
  });

  it('dot field', () => {
    cy.get('#display-2')
      .find('custom-widget-2 span')
      .should('contain.text', 'Paris');
  });

  it('resource', () => {
    cy.get('#display-3')
      .find('custom-widget-3 span')
      .should('contain.text', 'Paris')
      .should('contain.text', '06-03-23-98-23')
      .should('contain.text', 'www.startinblox.com');
  });

  it('nested component', () => {
    cy.get('#display-4')
      .find('custom-widget-4 solid-display')
      .should('have.attr', 'data-src', '/examples/data/list/profile-1.jsonld');

    cy.get('#display-4')
      .find('custom-widget-4 solid-display solid-display-value[name=city]')
      .should('have.text', 'Paris');
  });

  it('src attribute', () => {
    cy.get('#display-5')
      .find('custom-widget-5 span[name=src]')
      .should('have.text', '/examples/data/list/user-1.jsonld');
    cy.get('#display-5')
      .find('custom-widget-5 span[name=value]')
      .should('have.text', 'next-view');
  });

  // Form
  it('form creation', () => {
    cy.get('#form-1')
      .find('custom-form-widget-1 input')
      .type('new-email@example.com');

    cy.get('#form-1').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          email: 'new-email@example.com',
        });
      });
    });
  });

  it('form edition', () => {
    cy.get('#form-2').find('custom-form-widget-2 input');

    cy.get('#form-2').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          email: 'test-user@example.com',
          '@id': '/examples/data/list/user-1.jsonld',
        });
      });
    });
  });

  it('form nested', () => {
    cy.get('#form-3')
      .find('custom-form-widget-3')
      .eq(0)
      .find('solid-form')
      .should(
        'have.attr',
        'data-src',
        '/examples/data/nested-forms/batch-1.jsonld',
      );

    cy.get('#form-3')
      .find('custom-form-widget-3')
      .eq(1)
      .find('solid-form')
      .should(
        'have.attr',
        'data-src',
        '/examples/data/nested-forms/batch-2.jsonld',
      )
      .find('input[name=title]')
      .type(' automatique');

    cy.get('#form-3').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res).to.deep.equal({
          batches: {
            'ldp:contains': [
              {
                title: 'Développement',
                '@id': '/examples/data/nested-forms/batch-1.jsonld',
              },
              {
                title: 'Déploiement automatique',
                '@id': '/examples/data/nested-forms/batch-2.jsonld',
              },
            ],
            '@id':
              '/examples/data/nested-forms/customer-invoice-1-batches.jsonld',
          },
          '@id': '/examples/data/nested-forms/customer-invoice-1.jsonld',
        });
      });
    });
  });

  // TODO : nested form
});
