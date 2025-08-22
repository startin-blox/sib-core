describe('Type as ID Handling', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/store.html');
  });

  it('should return string for type-as-id properties', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;
      expect(store).to.exist;

      const context = {
        '@vocab': 'https://cdn.startinblox.com/owl#',
        dfc: 'http://static.datafoodconsortium.org/',
        'dfc:hasType': { '@type': '@id' },
      };

      // Test data with type-as-id property
      const testData = {
        '@context': context,
        '@id': '/test-type-as-id',
        '@type': 'dfc:Enterprise',
        name: 'Test Enterprise',
        'dfc:hasType': {
          '@id':
            'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer',
        },
      };

      // Store the test data locally
      await store.setLocalData(testData, '/test-type-as-id');

      // Get the resource back
      const resource = await store.get('/test-type-as-id');
      expect(resource).to.exist;

      // Test the type-as-id property - this is the main test
      const hasTypeValue = await resource['dfc:hasType'];

      // Should return string URL, not attempt to fetch as resource
      expect(hasTypeValue).to.be.a('string');
      expect(hasTypeValue).to.equal(
        'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer',
      );

      // Verify regular properties still work
      const nameValue = await resource.name;
      expect(nameValue).to.equal('Test Enterprise');
    });
  });

  it('should handle multiple type-as-id properties', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;

      // Use only DFC context pattern that we know works - no external URLs
      const context = {
        '@vocab': 'https://cdn.startinblox.com/owl#',
        dfc: 'http://static.datafoodconsortium.org/',
        'dfc:hasType': { '@type': '@id' },
        'dfc:category': { '@type': '@id' },
        'dfc:status': { '@type': '@id' },
      };

      const testData = {
        '@context': context,
        '@id': '/multi-type-test',
        name: 'Multi Type Test',
        'dfc:hasType': {
          '@id':
            'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer',
        },
        'dfc:category': {
          '@id':
            'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Food',
        },
        'dfc:status': {
          '@id':
            'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Active',
        },
      };

      await store.setLocalData(testData, '/multi-type-test');
      const resource = await store.get('/multi-type-test');

      // All type-as-id properties should return strings
      const hasType = await resource['dfc:hasType'];
      const category = await resource['dfc:category'];
      const status = await resource['dfc:status'];

      expect(hasType).to.be.a('string');
      expect(category).to.be.a('string');
      expect(status).to.be.a('string');

      expect(hasType).to.equal(
        'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer',
      );
      expect(category).to.equal(
        'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Food',
      );
      expect(status).to.equal(
        'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Active',
      );
    });
  });

  it('should differentiate type-as-id from regular resources', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;

      const context = {
        '@vocab': 'https://cdn.startinblox.com/owl#',
        dfc: 'http://static.datafoodconsortium.org/',
        'dfc:hasType': { '@type': '@id' },
      };

      // Resource with both type-as-id and regular resource reference
      const testData = {
        '@context': context,
        '@id': '/mixed-test',
        name: 'Mixed Test',
        'dfc:hasType': {
          '@id':
            'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer',
        },
        // This has additional properties, so should be treated as a resource
        relatedItem: {
          '@id': '/related-item',
          '@type': 'dfc:Enterprise',
          name: 'Related Item Name',
        },
      };

      // Also store the related item
      const relatedData = {
        '@context': context,
        '@id': '/related-item',
        '@type': 'dfc:Enterprise',
        name: 'Related Item Name',
        description: 'This is a related item',
      };

      await store.setLocalData(testData, '/mixed-test');
      await store.setLocalData(relatedData, '/related-item');

      const resource = await store.get('/mixed-test');

      // Type-as-id should return string
      const hasType = await resource['dfc:hasType'];
      expect(hasType).to.be.a('string');
      expect(hasType).to.equal(
        'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Producer',
      );

      // Regular resource should return object
      const relatedItem = await resource.relatedItem;
      expect(relatedItem).to.be.an('object');
      expect(await relatedItem.name).to.equal('Related Item Name');
    });
  });

  it('should work with getData method directly', () => {
    cy.window().then(async (win: any) => {
      const store = win.sibStore;

      const context = {
        '@vocab': 'https://cdn.startinblox.com/owl#',
        dfc: 'http://static.datafoodconsortium.org/',
        'dfc:hasType': { '@type': '@id' },
      };

      const testData = {
        '@context': context,
        '@id': '/getdata-test',
        '@type': 'dfc:Enterprise',
        name: 'GetData Test',
        'dfc:hasType': {
          '@id':
            'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Retailer',
        },
      };

      await store.setLocalData(testData, '/getdata-test');
      const resource = await store.getData('/getdata-test', context);

      // Test type-as-id property via getData
      const hasTypeValue = await resource['dfc:hasType'];
      expect(hasTypeValue).to.be.a('string');
      expect(hasTypeValue).to.equal(
        'http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#Retailer',
      );
    });
  });
});
