describe('event-reset-file', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/event-reset-file.html');
    cy.intercept('PUT', 'examples/data/list/event-1.jsonld', {}).as('put');
    cy.intercept('PUT', 'examples/data/list/event-empty.jsonld', {}).as(
      'put-empty',
    );
  });

  it('should reset form values to initial values after submit event', () => {
    cy.get('#form-image').within(() => {
      cy.get('input[name="someimage"]')
        .should(
          'have.value',
          'https://cdn.startinblox.com/logos/spacelinkers.png',
        )
        .type('New Name');
      cy.get('input[type="submit"]').click();
      cy.get('input[name="someimage"]').should(
        'have.value',
        'https://cdn.startinblox.com/logos/spacelinkers.png',
      );
    });

    cy.get('#form-1').within(() => {
      cy.get('input[name="name"]')
        .should('have.value', 'Coliving')
        .type('New Name');
      cy.get('input[type="submit"]').click();

      cy.get('input[name="name"]').should('have.value', 'Coliving');
    });

    cy.get('#form-2').within(() => {
      cy.get('input[name="name"]').as('nameInput');
      cy.get('@nameInput').should('have.value', '');
      cy.get('@nameInput').type('New Name');
      cy.get('input[type="submit"]').click();

      cy.get('@nameInput').should('have.value', '');
    });

    //[naked]
    cy.get('#form-3').within(() => {
      cy.get('input[name="name"]').as('nameInput');
      cy.get('@nameInput').type('New Name');
      cy.get('@nameInput').blur();

      cy.get('@nameInput').should('have.value', 'Coliving');
    });

    //[naked][autosave]
    cy.get('#form-4').within(() => {
      cy.get('input[name="name"]').as('nameInput');
      cy.get('@nameInput').clear();
      cy.get('@nameInput').type('New Name');
      cy.get('@nameInput').blur();

      cy.get('@nameInput').should('have.value', 'New Name');
    });

    cy.get('#form-5').within(() => {
      cy.get('input[name="name"]').as('nameInput');
      cy.get('@nameInput').type('New Name');

      cy.get('input[type="reset"]').click();
      cy.get('@nameInput').should('have.value', 'Coliving');

      cy.get('@nameInput').type('New Name');
      cy.get('input[type="submit"]').click();
      cy.get('@nameInput').should('have.value', 'Coliving');
    });
  });
});

const Event3Response1 = {
  '@id': 'http://localhost:8000/events/3/',
  img: '/upload/b9e5d66dda.jpg',
  '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
};

const Event4Response1 = {
  '@id': 'http://localhost:8000/events/4/',
  img: 'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
  '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
};

const Event3Response2 = {
  '@id': 'http://localhost:8000/events/3/',
  img: '/new/url/image',
  '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
};

const Event4Response2 = {
  '@id': 'http://localhost:8000/events/4/',
  img: '/new/url/image2',
  '@context': 'https://cdn.startinblox.com/owl/context.jsonld',
};

describe('event-reset-file-with-route', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.intercept('GET', 'http://localhost:8000/events/3/', Event3Response1);
    cy.intercept('GET', 'http://localhost:8000/events/4/', Event4Response1);
    cy.visit('/examples/e2e/event-reset-file-with-route.html');
  });

  it('should update image source in image input in first route', () => {
    cy.get('solid-route[name="route-1"]').click();
    cy.get('#form-1').within(() => {
      cy.get('input[name="img"]').as('nameInput');
      cy.get('@nameInput').should('have.value', '/upload/b9e5d66dda.jpg');
      cy.get('@nameInput').type('/new/url/image');

      cy.intercept('GET', 'http://localhost:8000/events/3/', Event3Response2);
      cy.intercept('PUT', 'http://localhost:8000/events/3/', {});

      cy.get('input[type="submit"]').click();
      cy.get('@nameInput').should('have.value', '/new/url/image');
    });
  });

  it('should update image source in image input in second route', () => {
    cy.get('solid-route[name="route-2"]').click();
    cy.get('#form-2').within(() => {
      cy.get('input[name="img"]').as('nameInput2');
      cy.get('@nameInput2').should(
        'have.value',
        'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
      );
      cy.get('@nameInput2').type('/new/url/image2');

      cy.intercept('GET', 'http://localhost:8000/events/4/', Event4Response2);
      cy.intercept('PUT', 'http://localhost:8000/events/4/', {});

      cy.get('input[type="submit"]').click();
      cy.get('@nameInput2').should('have.value', '/new/url/image2');
    });
  });

  it('should keep updated values when switch between routes', () => {
    cy.intercept('GET', 'http://localhost:8000/events/3/', Event3Response1);
    cy.intercept('GET', 'http://localhost:8000/events/4/', Event4Response1);
    cy.visit('/examples/e2e/event-reset-file-with-route.html');

    cy.get('solid-route[name="route-1"]').click();
    cy.get('#form-1').within(() => {
      cy.get('input[name="img"]').as('nameInput');
      cy.get('@nameInput').should('have.value', '/upload/b9e5d66dda.jpg');
      cy.get('@nameInput').type('/new/url/image');

      cy.intercept('GET', 'http://localhost:8000/events/3/', Event3Response2);
      cy.intercept('PUT', 'http://localhost:8000/events/3/', {});

      cy.get('input[type="submit"]').click();
      cy.get('@nameInput').should('have.value', '/new/url/image');
    });

    cy.get('solid-route[name="route-2"]').click();
    cy.get('#form-2').within(() => {
      cy.get('input[name="img"]').as('nameInput2');
      cy.get('@nameInput2').should(
        'have.value',
        'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
      );
      cy.get('@nameInput2').type('/new/url/image2');

      cy.intercept('GET', 'http://localhost:8000/events/4/', Event4Response2);
      cy.intercept('PUT', 'http://localhost:8000/events/4/', {});

      cy.get('input[type="submit"]').click();
      cy.get('@nameInput2').should('have.value', '/new/url/image2');
    });

    cy.get('solid-route[name="route-1"]').click();
    cy.get('@nameInput').should('have.value', '/new/url/image');
    cy.get('solid-route[name="route-2"]').click();
    cy.get('@nameInput2').should('have.value', '/new/url/image2');
  });
});
