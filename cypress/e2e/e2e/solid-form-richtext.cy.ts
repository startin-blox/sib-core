describe('solid-form-richtext test', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/solid-form-richtext.html');
  });

  it('Submitting form with filled rich text input should not display an error', () => {
    cy.get('solid-form div[data-richtext] p').should('not.have.length', 0);
    cy.get('#form-1 input[type="submit"]').click();
    cy.get('#form-1 div[data-richtext] .required-error-message').should(
      'not.exist',
    );
    cy.get('#form-1 div[data-richtext] .error-border-richtext').should(
      'not.exist',
    );
  });

  it('Submitting form with empty rich text input should display an error mesage', () => {
    cy.get('#form-1 div[data-richtext] [contenteditable]')
      .should('have.text', 'some description')
      .clear();
    cy.get('#form-1 div[data-richtext] p').clear();
    cy.get('#form-1 input[type="submit"]').click();
    cy.get('#form-1 div[data-richtext] .required-error-message').should(
      'exist',
    );
    cy.get('#form-1 div[data-richtext].error-border-richtext').should('exist');
  });

  it('Error message disappears when retyping in rich text input', () => {
    // Empty fields , error is shown
    cy.get('#form-1 div[data-richtext] [contenteditable]')
      .should('have.text', 'some description')
      .clear();
    cy.get('#form-1 input[type="submit"]').click();
    cy.get('#form-1 div[data-richtext] .required-error-message').should(
      'exist',
    );
    cy.get('#form-1 div[data-richtext].error-border-richtext').should('exist');

    // Retype text , error disapears
    cy.get('#form-1 div[data-richtext] p').type('some text');
    cy.get('#form-1 input[type="submit"]').click();
    cy.get('#form-1 div[data-richtext] .required-error-message').should(
      'not.exist',
    );
    cy.get('#form-1 div[data-richtext] .error-border-richtext').should(
      'not.exist',
    );
  });

  it('Placeholder is displayed text value is empty if placeholder is assigned', () => {
    cy.get('#form-1 div[data-richtext] p').clear();
    cy.get('#form-1 div[data-richtext] div[data-placeholder]').should('exist');
    cy.get('#form-1 div[data-richtext] div[data-placeholder]').should(
      'have.attr',
      'data-placeholder',
      'some placeholder',
    );
  });

  it('richtext html rendering', () => {
    cy.get('#form-2 solid-form-richtext')
      .children()
      .should('have.have.length', 2)
      .find('button')
      .and('have.attr', 'class', 'ql-bold');
    cy.get('#form-2 solid-form-richtext').then($el => {
      expect((<any>$el[0]).component.getValue()).to.equal('**Jean-Bernard**\n');
      cy.get('#form-2 solid-form-richtext .ql-editor').type(
        '{selectall}Jean-Claude{selectall}',
      );
      cy.get('#form-2 solid-form-richtext .ql-italic').click();
      cy.get('#form-2 solid-form-richtext .ql-bold').click();
      cy.get('#form-2 solid-form-richtext .ql-editor')
        .find('em')
        .should('have.text', 'Jean-Claude');
      cy.get('#form-2 solid-form-richtext').then($el => {
        expect((<any>$el[0]).component.getValue()).to.equal('_Jean-Claude_\n');
      });
    });
    // add link button in richtext mixin
    cy.get('#form-3 solid-form-richtext > div ')
      .children()
      .eq(4)
      .find('button')
      .and('have.attr', 'class', 'ql-link');
    cy.get('#form-3 solid-form-richtext .ql-editor').type(
      '{selectall}test link{selectall}',
    );
    cy.get('#form-3 solid-form-richtext .ql-link').click();
    cy.get(
      '#form-3 solid-form-richtext > div[name=name] > div[data-mode=link] > input[type=text]',
    ).type('http://www.yesnoif.com/');
    cy.get(
      '#form-3 solid-form-richtext > div[name=name] > div[data-mode=link] > a[class=ql-action]',
    ).click();
    cy.get('#form-3 solid-form-richtext .ql-editor')
      .find('a')
      .should('have.attr', 'href', 'http://www.yesnoif.com/')
      .and('contain', 'test link');
    // verify value format sent in the form
    cy.get('#form-3 input[type=submit]').click();
    cy.get('#form-3').then($el => {
      return (<any>$el[0]).component.getFormValue().then(res => {
        expect(res.name).to.equal('[test link](http://www.yesnoif.com/)\n');
      });
    });
    // value stocked in markdown well displayed in the solid-form-richtext
    cy.get('#form-4 solid-form-richtext > div[name=website]')
      .find('a')
      .should('have.attr', 'href', 'http://drawing.garden/')
      .and('contain', 'my site');
  });
});
