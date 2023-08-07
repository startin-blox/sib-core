describe('translation', function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/translation.html', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'language', {
          value: 'fr'
        })
      }
    });
  });
  it('French translation in validation attributes, submit buttons, autocompletion mixin', () => {
    // french in confirm and buttons
    const stub = cy.stub();
    cy.on('window:confirm', stub)
    cy.get('solid-delete#confirm')
      .find('button').should('contain', 'Supprimer')
      .click()
      .then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Merci de confirmer votre choix');
      });
    cy.get('solid-form#void-submitbutton')
      .find('input[type=submit]').should('contain', 'Envoyer');
    
      // french in dialog, buttons customized
    cy.get('solid-delete#dialog')
      .find('button').should('contain', 'Delete data');
    cy.get('solid-delete#dialog > dialog')
      .should('contain', 'Merci de confirmer votre choix')
      .and('contain', 'Oui')
      .and('contain', 'Annuler');
    cy.get('solid-form#custom-submitbutton')
      .find('input[type=submit]').should('contain', 'Send form');

    // french in autompletion multipleselect
    cy.get('solid-form-search#translation-autocomp')
      .find('.ss-disabled').should('contain', 'Sélectionner une valeur')
      .click();
    cy.get('solid-form-search#translation-autocomp')
      .find('.ss-search').children().should('have.attr', 'placeholder', 'Rechercher')
      .wait(200).type('00');
    cy.get('solid-form-search#translation-autocomp')
      .find('.ss-list').children().contains('Aucun résultat')
  });
  it('English translation in validation attributes, submit buttons, autocompletion mixin', () => {
    cy.get('#en').click();
    // english in confirm and buttons
    const stub = cy.stub();
    cy.on('window:confirm', stub)
    cy.get('solid-delete#confirm')
      .find('button').should('contain', 'Delete')
      .click()
      .then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Please, confirm your choice');
      });
    cy.get('solid-form#void-submitbutton')
      .find('input[type=submit]').should('contain', 'Submit');
    
    // english in dialog, buttons customized
    cy.get('solid-delete#dialog')
      .find('button').should('contain', 'Delete data');
    cy.get('solid-delete#dialog > dialog')
      .should('contain', 'Please, confirm your choice')
      .and('contain', 'Yes')
      .and('contain', 'Cancel');
    cy.get('solid-form#custom-submitbutton')
      .find('input[type=submit]').should('contain', 'Send form');

    // english in autompletion multipleselect
    cy.get('solid-form-search#translation-autocomp')
      .find('.ss-disabled').should('contain', 'Select a value')
      .click();
    cy.get('solid-form-search#translation-autocomp')
      .find('.ss-search').children().should('have.attr', 'placeholder', 'Search')
      .wait(200).type('00');
    cy.get('solid-form-search#translation-autocomp')
      .find('.ss-list').children().contains('No result')
  });
  it('Missing translation file', () => {
    cy.get('#fr').find('button').click();
    cy.get('solid-delete#confirm').find('button').should('contain', 'Supprimer');
    // Asking to get a missing file, English loaded by default
    cy.get('#it').find('button').click();
    cy.get('solid-delete#confirm').find('button').should('contain', 'Delete');
  })
});