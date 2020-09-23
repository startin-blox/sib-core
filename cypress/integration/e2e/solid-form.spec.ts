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
    cy.get('#form-4 solid-form-richtext .ql-editor').type('Jean-Bernard{selectall}')
    cy.get('#form-4 solid-form-richtext .ql-bold')
    .click()
    cy.get('#form-4 solid-form-richtext .ql-editor')
    .find('strong')
    .should('have.text', 'Jean-Bernard')
    cy.get('#form-4 solid-form-richtext').then($el => {
      expect((<any>$el[0]).component.getValue()).to.equal('<p><strong>Jean-Bernard</strong></p>');
      (<any>$el[0]).setAttribute('value', '<p><strong>Jean-Claude</strong></p>');
      cy.wait(1000)
      expect((<any>$el[0]).component.getValue()).to.equal('<p><strong>Jean-Claude</strong></p>');
      cy.get('#form-4 solid-form-richtext .ql-editor')
      .find('strong')
      .should('have.text', 'Jean-Claude')
    })
  });
})
