describe('solid-display', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/solid-display.html');
  });

  it('check component', () => {
    cy.get('solid-display').then(([element]) => {
      expect((<any>element).component?.element).eq(element);
      expect((<any>element)._component?.element).eq(element);
    });
  });

  it('display event', () => {
    cy.get('#display-1>div')
      .children()
      .eq(0)
      .should('have.attr', 'name', 'event')
      .should('have.attr', 'value', 'Event name and date : ')
      .should('have.class', 'presentationEvent');

    cy.get('#display-2 solid-set-default')
      .should('have.attr', 'name', 'completeName')
      .should('have.class', 'completeName')
      .children()
      .should('have.length', 3);
  });

  it('handle fields attribute', () => {
    // all fields
    cy.get('#display-3>div').children().eq(0).should('not.have.attr', 'fields');
    cy.get('#display-3>div')
      .children()
      .eq(0)
      .find('>div')
      .children()
      .should('have.length', 10);
    cy.get('#display-3 > div ').find('[name=permissions]').should('not.exist');

    // child-[field] attribute
    cy.get('#display-3 > div')
      .children()
      .eq(0)
      .should('have.attr', 'attribute-child', 'child-value');
    cy.get('#display-3 > div')
      .children()
      .eq(1)
      .should('have.attr', 'attribute-child', 'child-value');
    cy.get('#display-3 > div')
      .children()
      .eq(2)
      .should('have.attr', 'attribute-chIld', 'child-value');
    cy.get('#display-3 > div')
      .children()
      .eq(3)
      .should('have.attr', 'attribute-child', 'child-value');

    // no fields
    cy.get('#display-4>div').children().should('have.attr', 'fields', '');
    cy.get('#display-4>div')
      .children()
      .eq(0)
      .find('>div')
      .children()
      .should('have.length', 0);
  });

  it('handle native HTML tags', () => {
    cy.get('#display-5 > div > h2')
      .should('have.attr', 'name', 'name')
      .and('have.class', 'custom-class')
      .and('have.text', 'Coliving');
  });

  it('required mixin (+dcat)', () => {
    [
      { prefix: '#', field1: 'city', field2: 'place', path: 'list' },
      {
        prefix: '#dcat-',
        field1: 'dct:comment',
        field2: 'dct:definition',
        path: 'catalog',
      },
    ].forEach(({ prefix, field1, field2, path }) => {
      cy.get(`${prefix}display-6 > div`).children().should('have.length', 4);

      cy.get(`${prefix}display-7`).should('have.attr', 'required-ocean');
      cy.get(`${prefix}display-7 > div`).children().should('have.length', 0);

      cy.get(`${prefix}display-8`).should('have.attr', `required-${field1}`);
      cy.get(`${prefix}display-8 > div`).children().should('have.length', 2);
      cy.get(`${prefix}display-8 > div`)
        .children()
        .eq(0)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/event-3.jsonld`,
        );
      cy.get(`${prefix}display-8 > div`)
        .children()
        .eq(1)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/event-4.jsonld`,
        );

      cy.get(`${prefix}display-9`).should('have.attr', `required-${field2}`);
      cy.get(`${prefix}display-9 > div`).children().should('have.length', 2);
      cy.get(`${prefix}display-9 > div`)
        .children()
        .eq(0)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/event-2.jsonld`,
        );
      cy.get(`${prefix}display-9 > div`)
        .children()
        .eq(1)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/event-3.jsonld`,
        );

      cy.get(`${prefix}display-10`).should('have.attr', `required-${field1}`);
      cy.get(`${prefix}display-10`).should('have.attr', `required-${field2}`);
      cy.get(`${prefix}display-10 > div`).children().should('have.length', 1);
      cy.get(`${prefix}display-10 > div > solid-display`).should(
        'have.attr',
        'data-src',
        `/examples/data/${path}/event-3.jsonld`,
      );
    });
  });

  it('list-mixin : solid-container & solid-resource attributes', () => {
    cy.get('#display-11').should('have.attr', 'solid-container');
    cy.get('#display-11 > div').children().should('have.length', 4);

    cy.get('#display-12').should('have.attr', 'solid-resource');
    cy.get('#display-12 > div').children().should('have.length', 1);
  });

  it('list-mixin : empty-value', () => {
    cy.get('#display-13').find('no-skill');
    cy.get('#display-13 > span > no-skill').contains('No skill yet');
  });

  it('define src attribute of solid-link by action', () => {
    cy.get('#display-14 > div > solid-action').should(
      'have.attr',
      'src',
      '/examples/data/list/user-1.jsonld',
    );
    cy.get('#display-14 > div > solid-action > solid-link').should(
      'have.attr',
      'data-src',
      '/examples/data/list/user-1.jsonld',
    );

    cy.get('#display-15 > div > solid-action').should(
      'have.attr',
      'src',
      'other-resource',
    );
    cy.get('#display-15 > div > solid-action > solid-link').should(
      'have.attr',
      'data-src',
      'other-resource',
    );
  });

  it('handle default-[field] attribute', () => {
    cy.get('#default-field > div solid-display-value').should(
      'have.text',
      'not defined',
    );
  });

  it('counter mixin', () => {
    ['#', '#dcat-'].forEach(prefix => {
      cy.get(`${prefix}display-16`)
        .children()
        .eq(0)
        .should('contain', '8 skills displayed :');
      cy.get(`${prefix}display-16`)
        .children()
        .eq(1)
        .find('div')
        .should('have.length', '8');
    });
  });

  it('highlighter-mixin', () => {
    ['#', '#dcat-'].forEach(prefix => {
      cy.get(`${prefix}display-17 > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('exist')
        .and('be.visible')
        .should('contain', 'Javascript');
    });
  });

  it('nested-[field]', () => {
    // data-src in solid-display pointed on skill-*.jsonld
    [
      { prefix: '#', path: 'list' },
      { prefix: '#dcat-', path: 'catalog' },
    ].forEach(({ prefix, path }) => {
      cy.get(`${prefix}display-18 > div`)
        .children()
        .eq(0)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/skill-2.jsonld`,
        );
      cy.get(`${prefix}display-18 > div`)
        .children()
        .eq(1)
        .should(
          'have.attr',
          'data-src',
          `/examples/data/${path}/skill-3.jsonld`,
        );
      // User's name not displayed
      cy.get(`${prefix}display-18 > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('not.contain.value', 'Test User');
      cy.get(`${prefix}display-18 > div`)
        .children()
        .eq(1)
        .find('solid-display-value')
        .should('not.contain.value', 'Test User');
      // Skills' name displayed
      cy.get(`${prefix}display-18 > div`)
        .children()
        .eq(0)
        .find('solid-display-value')
        .should('exist')
        .and('be.visible')
        .should('have.attr', 'value', 'CSS');
      cy.get(`${prefix}display-18 > div`)
        .children()
        .eq(1)
        .find('solid-display-value')
        .should('have.attr', 'value', 'Javascript');
    });
  });

  it('default-widget', () => {
    // default-widget applied to every child
    [
      { prefix: '#', field1: 'email', field2: 'username' },
      { prefix: '#dcat-', field1: 'dct:email', field2: 'dct:username' },
    ].forEach(({ prefix, field1, field2 }) => {
      cy.get(`${prefix}display-19 > div`)
        .find('solid-display-link')
        .eq(0)
        .should('have.attr', 'name', 'name');
      cy.get(`${prefix}display-19 > div`)
        .find('solid-display-link')
        .eq(1)
        .should('have.attr', 'name', field1);
      cy.get(`${prefix}display-19 > div`)
        .find('solid-display-link')
        .eq(2)
        .should('have.attr', 'name', field2);

      // default-widget applied to several children
      cy.get(`${prefix}display-20 > div`)
        .find('solid-display-div')
        .should('have.attr', 'name', 'name');
      cy.get(`${prefix}display-20 > div`)
        .find('solid-display-link')
        .eq(0)
        .should('have.attr', 'name', field1);
      cy.get(`${prefix}display-20 > div`)
        .find('solid-display-link')
        .eq(1)
        .should('have.attr', 'name', field2);
    });
  });

  it('oembed template', () => {
    ['#', '#dcat-'].forEach(prefix => {
      cy.get(`${prefix}display-21 > div`)
        .find('solid-display-value-oembed')
        .should(
          'have.attr',
          'value',
          'https://www.audiomack.com/oembed?url=https%3A%2F%2Faudiomack.com%2Faudiomack%2Fplaylist%2Fjust-chillin&format=json',
        );
    });
  });

  it('default-widget-[field]', () => {
    cy.get('#display-22 > div').children().should('have.length', 4);
    cy.get('#display-22 > div').children().eq(1).should('contain', 'Rennes');
    cy.get('#display-22 > div > custom-default-widget').should(
      'contain',
      'Field empty',
    );
    cy.get('#display-22 > div')
      .children()
      .eq(0)
      .should('contain', 'Field empty');
    cy.get('#display-22 > div')
      .children()
      .eq(2)
      .should('contain', 'Field empty');
    cy.get('#display-22 > div > custom-default-widget-website').should(
      'contain',
      'No website',
    );
  });

  it('dispatch event when widget rendered', () => {
    cy.get('#log-event div').should('have.length', 12);
  });

  it('widget for empty set', () => {
    // empty set widget displayed
    cy.get('#widget-empty-set1 > div').children().should('have.length', 2);
    cy.get('#widget-empty-set1 > div')
      .children()
      .eq(1)
      .children()
      .should('have.length', 1);
    cy.get('#widget-empty-set1 > div')
      .children()
      .eq(1)
      .should('contain', 'set empty');
    // empty set widget not displayed
    cy.get('#widget-empty-set2 > div').children().should('have.length', 2);
    cy.get('#widget-empty-set2 > div')
      .children()
      .eq(1)
      .children()
      .should('have.length', 3);
    cy.get('#widget-empty-set2 > div')
      .children()
      .eq(1)
      .should('contain', 'Paris')
      .and('not.contain', 'set empty');
    // empty set with value attribute displayed
    cy.get('#widget-empty-set3 > div').children().should('have.length', 2);
    cy.get('#widget-empty-set3 > div')
      .children()
      .eq(1)
      .should('have.attr', 'value', 'empty set value');
    cy.get('#widget-empty-set3 > div')
      .children()
      .eq(1)
      .should('contain', 'empty set value')
      .and('not.contain', 'set empty');
  });

  it('solid-set-div-label', () => {
    ['#', '#dcat-'].forEach(prefix => {
      cy.get(`${prefix}solid-set-div-label > div`)
        .children()
        .should('have.length', 4);
      cy.get(`${prefix}solid-set-div-label > div`)
        .children()
        .eq(0)
        .find('solid-set-div-label')
        .children()
        .should('have.length', 2);
      cy.get(
        `${prefix}solid-set-div-label > div > solid-display > div > solid-set-div-label`,
      )
        .find('label')
        .should('contain', 'identity');
      cy.get(`${prefix}solid-set-div-label > div`)
        .children()
        .eq(1)
        .find('label')
        .should('contain', 'identity');
      cy.get(`${prefix}solid-set-div-label > div`)
        .children()
        .eq(2)
        .find('label')
        .should('contain', 'identity');
      cy.get(`${prefix}solid-set-div-label > div`)
        .children()
        .eq(3)
        .find('label')
        .should('contain', 'identity');
    });
  });

  it('class for solid-* elements', () => {
    cy.get('solid-display#display-class')
      .find('solid-set-ul')
      .should('have.class', 'solid-set-ul');
    cy.get('solid-display#display-class')
      .find('solid-display-value-label')
      .should('have.class', 'solid-display-value-label');
    cy.get('solid-display#display-class2')
      .find('solid-set-ul')
      .should('have.class', 'solid-set-ul fullnameClass');
    cy.get('solid-display#display-class2')
      .find('solid-display-value')
      .should('have.class', 'solid-display-value fnameClass');
    cy.get('solid-display#display-class2')
      .find('solid-display-value-label')
      .should('have.class', 'solid-display-value-label emailClass');
  });

  it('should display content correctly from DCAT context', () => {
    cy.get('#dcat-display-services h5')
      .eq(0)
      .should('have.text', 'Compute Services');
    cy.get('#dcat-display-services h5')
      .eq(1)
      .should('have.text', 'Storage Services');
    cy.get('#dcat-display-services h5')
      .eq(2)
      .should('have.text', 'Networking Services');

    cy.get('#dcat-display-services p').should('have.length', 3);

    cy.get('#dcat-display-services p')
      .eq(0)
      .should(
        'contain.text',
        'Virtual machines, containers, and serverless computing services.',
      );
    cy.get('#dcat-display-services p')
      .eq(1)
      .should(
        'contain.text',
        'Block storage, object storage, and archival storage solutions.',
      );
    cy.get('#dcat-display-services p')
      .eq(2)
      .should('contain.text', 'Virtual networks, load balancers, and VPNs.');
  });
});
