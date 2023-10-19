describe('solid-map', function() {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/solid-map.html')
  })

  it('display markers', () => {
    cy.get('#map-1 .leaflet-marker-pane').children().should('have.length', 6)
  })

  it('display content in popup markers', () => {
    cy.get('#map-2 .leaflet-marker-pane').children().first().click({force: true})
    cy.get('#map-2 .leaflet-popup-pane').children().should('have.length', 1)
    cy.get('#map-2 .leaflet-popup-content solid-display')
      .should('have.length', 1)
      .and('have.attr', 'data-src', 'event-1.jsonld')
    cy.get('#map-2 .leaflet-popup-content solid-display > div > solid-set-default')
      .should('have.length', 1)
      .and('have.attr', 'name', 'infos')
    cy.get('#map-2 .leaflet-popup-content solid-display > div > solid-set-default[name=infos] > solid-display-value').should('have.length', 2)
    cy.get('#map-2 .leaflet-popup-content solid-display > div > solid-set-default[name=infos] > solid-display-value[name=name]').contains('Test 1')
    cy.get('#map-2 .leaflet-popup-content solid-display > div > solid-set-default[name=infos] > solid-display-value[name=category]').contains('showcase event')
  })

  it('groups markers', () => {
    cy.get('#map-3 .leaflet-marker-pane .group-meetup').should('have.length', 4)
    cy.get('#map-3 .leaflet-marker-pane .group-showcaseevent').should('have.length', 2)
  })

  it('applies attributes', () => {
    cy.get('#map-4 .leaflet-marker-pane').children().first().click({force: true})
    cy.get('#map-4 .leaflet-popup-content solid-display-div[name=name]')
      .should('have.length', 1)
      .should('have.class', 'test-class-name')
    cy.get('#map-4 .leaflet-popup-content solid-display-div[name=name] button')
      .should('have.length', 1)
      .contains('Modifier')
      .click()
    cy.get('#map-4 .leaflet-popup-content solid-display-div[name=name] > div')
      .should('have.attr', "contenteditable")
  })

  it('filters markers', () => {
    cy.get('#filter input[name=category]').type('showcase')
    cy.get('#map-5 .leaflet-marker-pane').children().should('have.length', 2)
    cy.get('#map-5 span#counter').contains('2 results')
    cy.get('#filter input[name=category]').clear().type('mee')
    cy.get('#map-5 .leaflet-marker-pane').children().should('have.length', 4)
    cy.get('#map-5 span#counter').contains('4 results')
  })

  it('markers clusters', () => {
    cy.get('#map-6 .leaflet-marker-pane').children().should('have.length', 3)
    cy.get('#map-6 .leaflet-marker-pane').children().eq(2)
      .find('span').should('contain', '4')
  })

  it('display federated markers', () => {
    cy.get('#map-federated .leaflet-marker-pane').children().should('have.length', 7)
  })
})
