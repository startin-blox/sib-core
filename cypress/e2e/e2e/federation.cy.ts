// TODO: We should make tests run independently of one another
let beenCalled = false;
describe('federation', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/federation.html');
  })

  this.beforeEach(() => {
    cy.intercept('http://server.com/skills', (req) => {
      beenCalled = true;
      req.reply({
        body: {
          "@context": "https://cdn.happy-dev.fr/owl/hdcontext.jsonld",
          "@id": "http://server.com/skills",
          "@type": "ldp:Container",
          "ldp:contains": [
            {"@id": "http://server.com/skills/1", "name": "HTML"}
          ]
        }
      })
    })
  });

  it('check children', () => {
    cy.get('#federation-1').as('federation');
    cy.get('@federation').find('> div').children().should('have.length', 4)
    cy.get('@federation').find('> div > solid-display').eq(0)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-1.jsonld')
      .and('contain.text', '/examples/data/federation/circles-1.jsonld')
      .and('contain.text', 'Circle from server 1');
    cy.get('@federation').find('> div > solid-display').eq(1)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-2.jsonld')
      .and('contain.text', '/examples/data/federation/circles-2.jsonld')
      .and('contain.text', 'Another circle from server 1');
    cy.get('@federation').find('> div > solid-display').eq(2)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-3.jsonld')
      .and('contain.text', '/examples/data/federation/circles-3.jsonld')
      .and('contain.text', 'Circle from server 2');
    cy.get('@federation').find('> div > solid-display').eq(3)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-4.jsonld')
      .and('contain.text', '/examples/data/federation/circles-4.jsonld')
      .and('contain.text', 'Another circle from server 2');
  });

  it('supports nested sources', () => {
    cy.get('#federation-2').as('federation');
    cy.get('@federation').find('> div').children().should('have.length', 6)
    cy.get('@federation').find('> div > solid-display').eq(0)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-1.jsonld')
      .and('contain.text', '/examples/data/federation/circles-1.jsonld')
      .and('contain.text', 'Circle from server 1');
    cy.get('@federation').find('> div > solid-display').eq(1)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-2.jsonld')
      .and('contain.text', '/examples/data/federation/circles-2.jsonld')
      .and('contain.text', 'Another circle from server 1');
    cy.get('@federation').find('> div > solid-display').eq(2)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-3.jsonld')
      .and('contain.text', '/examples/data/federation/circles-3.jsonld')
      .and('contain.text', 'Circle from server 2');
    cy.get('@federation').find('> div > solid-display').eq(3)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-4.jsonld')
      .and('contain.text', '/examples/data/federation/circles-4.jsonld')
      .and('contain.text', 'Another circle from server 2');
    cy.get('@federation').find('> div > solid-display').eq(4)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-5.jsonld')
      .and('contain.text', '/examples/data/federation/circles-5.jsonld')
      .and('contain.text', 'Circle from server 3');
    cy.get('@federation').find('> div > solid-display').eq(5)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-6.jsonld')
      .and('contain.text', '/examples/data/federation/circles-6.jsonld')
      .and('contain.text', 'Circle from server 4');
  });

  it("can fail one source", () => {
    cy.intercept('GET', '/examples/data/federation/circles-server3.jsonld', {
      statusCode: 403
    })
    cy.reload();
    cy.get('#federation-2').as('federation');
    cy.get('@federation').find('> div').children().should('have.length', 5);
    cy.get('@federation').find('> div > solid-display').eq(0)
    .should('have.attr', 'data-src', '/examples/data/federation/circles-1.jsonld')
    .and('contain.text', '/examples/data/federation/circles-1.jsonld')
    .and('contain.text', 'Circle from server 1');
    cy.get('@federation').find('> div > solid-display').eq(1)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-2.jsonld')
      .and('contain.text', '/examples/data/federation/circles-2.jsonld')
      .and('contain.text', 'Another circle from server 1');
    cy.get('@federation').find('> div > solid-display').eq(2)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-3.jsonld')
      .and('contain.text', '/examples/data/federation/circles-3.jsonld')
      .and('contain.text', 'Circle from server 2');
    cy.get('@federation').find('> div > solid-display').eq(3)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-4.jsonld')
      .and('contain.text', '/examples/data/federation/circles-4.jsonld')
      .and('contain.text', 'Another circle from server 2');
    cy.get('@federation').find('> div > solid-display').eq(4)
      .should('have.attr', 'data-src', '/examples/data/federation/circles-6.jsonld')
      .and('contain.text', '/examples/data/federation/circles-6.jsonld')
      .and('contain.text', 'Circle from server 4');
  })

  it("does not fetch local federations", () => {
    expect(beenCalled).to.be.false;
    cy.get('#loadSkills').click()
    cy.get('#federation-3 solid-display > div').children().should('have.length', 1).then(() => {
      expect(beenCalled).to.be.true;
    })
  })
})
