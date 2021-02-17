describe('validation', function () {
  let win: Window;
  let cnsl: Console;
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/validation.html');
    cy.window().then(w => {
      win = w;
      cnsl = (win as Window & typeof globalThis).console;
    });
  });
  it('confirm popup on solid-delete', () => {
    const stub = cy.stub();
    cy.on('window:confirm', stub)
    cy.get('solid-delete#confirm')
      .should('have.attr', 'confirmation-type', 'confirm')
      .and('have.attr', 'confirmation-message')
    cy.get('solid-delete#confirm')
      .find('button')
      .click()
      .then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Are you sure ?')
      });
  });
  it('confirm popup on solid-form', () => {
    const stub = cy.stub();
    cy.on('window:confirm', stub)
    cy.get('solid-form#confirm')
      .find('input[type=submit]')
      .click()
      .then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Please, confirm your choice.') //message by default displayed
      });
  });
  it('dialog popup on solid-form', () => {
    // simple dialog popup
    cy.get('solid-form#simple-dialog > dialog')
      .find('p').should('contain', 'Please, confirm your choice.')//message by default displayed
    cy.get('solid-form#simple-dialog > dialog > div').children().eq(0)
      .should('contain', 'Yes')
    cy.get('solid-form#simple-dialog > dialog > div').children().eq(1)
      .should('contain', 'Cancel')
    cy.get('solid-form#simple-dialog > dialog')
      .find('button').should('have.not.attr', 'class')
    //custom dialog popup
    cy.get('solid-form#custom-dialog > dialog')
      .find('p').should('contain', 'Custom message : Are you sure ?')
    cy.get('solid-form#custom-dialog > dialog > div').children().eq(0)
      .should('contain', 'Certainly')
      .and('have.attr', 'class', 'submit-button')
    cy.get('solid-form#custom-dialog > dialog > div').children().eq(1)
      .should('contain', 'Quit')
      .and('have.attr', 'class', 'cancel-button')
  });
  it('actions on dialog popup', () =>  {
    //dialog modal correctly opened and closed with buttons
    cy.get('solid-form#custom-dialog > form > solid-form-label-text > input')
      .type('{selectall}Presentation')
    cy.get('solid-form#custom-dialog > form > input').click()
    cy.get('solid-form#custom-dialog > dialog')
      .should('have.attr', 'open')
    
    cy.get('solid-form#custom-dialog > dialog > div').children().eq(1).click()
    cy.get('solid-form#custom-dialog > dialog')
      .should('not.have.attr', 'open')
    cy.get('solid-form#custom-dialog > form > input').click()
    cy.get('solid-form#custom-dialog > dialog')
      .should('have.attr', 'open')

    //form well sent, data well deleted
    cy.spy(win.sibStore, 'post');
    cy.get('solid-form#custom-dialog > dialog > div').children().eq(0).click().then(() => {
      expect(win.sibStore.post).to.be.called;
    cy.get('solid-form#custom-dialog > dialog')
      .should('not.have.attr', 'open')
    });
    cy.spy(win.sibStore, 'delete');
    cy.get('solid-delete#delete-data > dialog > div').children().eq(0).click({ force: true }).then(() => {
      expect(win.sibStore.delete).to.be.called;
    cy.get('solid-delete#delete-data > dialog')
      .should('not.have.attr', 'open')
    });
  });
  it('confirmation-type missing', () => {
    cy.spy(cnsl, 'warn');
    cy.get('solid-delete#missing-type').find('button').click().then(() => {
      expect(cnsl.warn).to.be.called;
    });
  });
});