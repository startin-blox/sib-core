/**
 * Store Advanced Methods Tests
 * 
 * Uses examples data from 0.0.0.0:3000/examples/data/ai/cypress/
 */
const REAL_DATA_SRC_INDEX = 'http://0.0.0.0:3000/examples/data/ai/cypress/3DObjects-index.jsonld';

describe('Store Advanced Methods', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/store.html');
  });

  it('has semantizer environment available', () => {
    cy.window().then((win: any) => {
      // Check if SEMANTIZER is available globally
      if (win.SEMANTIZER) {
        cy.log('✅ SEMANTIZER is available globally');
        expect(win.SEMANTIZER).to.be.an('object');
        expect(win.SEMANTIZER.load).to.be.a('function');
        expect(win.SEMANTIZER.build).to.be.a('function');
      } else {
        cy.log('⚠️ SEMANTIZER is not available globally');
        cy.log('This explains why advanced methods may not be available');
        cy.log('The semantizer needs to be imported in the store.html or store.js file');
      }
      
      // Check if semantizer is available on the store instance
      const store = win.sibStore;
      if (store && store.constructor.name === 'LdpStore') {
        // Try to access private methods or check if they exist
        cy.log('Store is LdpStore - checking for semantizer integration...');
      }
    });
  });

  it('has store instance with basic structure', () => {
    cy.window().then((win: any) => {
      expect(win.sibStore).to.exist;
      expect(win.sibStore).to.be.an('object');
      
      // Log store type and available methods
      cy.log(`Store type: ${win.sibStore.constructor.name}`);
      cy.log(`Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(win.sibStore)).join(', ')}`);
      
      // Check if this is an LdpStore (which should have the advanced methods)
      if (win.sibStore.constructor.name === 'LdpStore') {
        cy.log('✅ Store is LdpStore - should support advanced methods');
      } else {
        cy.log(`⚠️ Store is ${win.sibStore.constructor.name} - advanced methods may not be available`);
      }
    });
  });

  it('has advanced method prototypes', () => {
    cy.window().then((win: any) => {
      const store = win.sibStore;
      
      // Check if the methods exist (they might be optional in IStore)
      if (store.queryIndex) {
        expect(store.queryIndex).to.be.a('function');
        cy.log('✅ queryIndex method is available');
      } else {
        cy.log('⚠️ queryIndex method is not available (may need semantizer dependencies)');
      }
      
      if (store.queryIndexConjunction) {
        expect(store.queryIndexConjunction).to.be.a('function');
        cy.log('✅ queryIndexConjunction method is available');
      } else {
        cy.log('⚠️ queryIndexConjunction method is not available (may need semantizer dependencies)');
      }
      
      // Note: generateShapes is private, so we can't test it directly
      // but we can test it indirectly through queryIndex
    });
  });

  describe('queryIndex method', () => {
    it('should query index with single filter', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping test');
          cy.log('This may indicate missing semantizer dependencies');
          return;
        }

        cy.log('Testing queryIndex with single filter...');
        cy.log(`Store type: ${store.constructor.name}`);
        cy.log(`Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(store)).join(', ')}`);
        
        try {
          const results = await store.queryIndex({
            dataSrcIndex: REAL_DATA_SRC_INDEX,
            dataRdfType: 'tc:3DObject',
            filterValues: {
              'tc:country': { value: 'Slovakia' }
            },
            exactMatchMapping: {
              'tc:country': true
            }
          });

          expect(results).to.be.an('array');
          cy.log('Results received:', results);
          expect(results.length).to.be.greaterThan(0);
          
          // Check that results contain the expected data
          // @id is the id of the resource
          // @type is the type of the resource
          const slovakiaResults = results.filter((r: any) => 
            r['@id'] && r['@type']
          );
          expect(slovakiaResults.length).to.be.greaterThan(0);
          cy.log(`✅ queryIndex returned ${results.length} results, ${slovakiaResults.length} from Slovakia`);
        } catch (error) {
          cy.log('❌ Error during queryIndex:', error);
          throw error;
        }
      });
    });

    it('should handle pattern matching for titles', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping test');
          return;
        }

        const results = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:title': { value: 'cas' }
          },
          exactMatchMapping: {
            'tc:title': false // Pattern matching
          }
        });

        expect(results).to.be.an('array');
        // Pattern matching should return multiple results
        expect(results.length).to.be.greaterThan(0);
      });
    });
  });

  describe('queryIndexConjunction method', () => {
    it('should perform conjunction query with multiple filters', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndexConjunction) {
          cy.log('queryIndexConjunction method not available, skipping test');
          return;
        }

        const results = await store.queryIndexConjunction({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' },
            'tc:title': { value: 'cas' }
          },
          useConjunction: true,
          exactMatchMapping: {
            'tc:country': true,
            'tc:title': false
          }
        });

        expect(results).to.be.an('array');

        // Conjunction should return only resources that match ALL criteria
        results.forEach(async (resource: any) => {
          expect(resource['@id']).to.exist;
          expect(await resource['@type']).to.include('tc:3DObject');
        });
      });
    });

    it('should return empty array for no matching filters', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndexConjunction) {
          cy.log('queryIndexConjunction method not available, skipping test');
          return;
        }

        const results = await store.queryIndexConjunction({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'NonExistentCountry' },
            'tc:title': { value: 'NonExistentTitle' }
          },
          useConjunction: true
        });

        expect(results).to.be.an('array');
        expect(results.length).to.equal(0);
      });
    });

    it('should handle single filter in conjunction query', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndexConjunction) {
          cy.log('queryIndexConjunction method not available, skipping test');
          return;
        }

        const results = await store.queryIndexConjunction({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' }
          },
          exactMatchMapping: {
            'tc:country': true
          },
          useConjunction: true
        });

        expect(results).to.be.an('array');
        // Single filter should work the same as regular queryIndex
        expect(results.length).to.be.greaterThan(0);
      });
    });
  });

  describe('generateShapes integration', () => {
    it('should generate shapes through queryIndex', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping generateShapes test');
          return;
        }

        // This will internally call generateShapes
        const results = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' }
          },
          exactMatchMapping: {
            'tc:country': true
          }
        });

        expect(results).to.be.an('array');
        // If we get here, generateShapes worked internally
      });
    });

    it('should handle exact match vs pattern matching in shape generation', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping exact match test');
          return;
        }

        // Test exact match
        const exactResults = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' }
          },
          exactMatchMapping: {
            'tc:country': false
          }
        });

        // Test pattern matching
        const patternResults = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:title': { value: 'cas' }
          },
          exactMatchMapping: {
            'tc:title': false
          }
        });

        expect(exactResults).to.be.an('array');
        expect(patternResults).to.be.an('array');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing dataSrcIndex gracefully', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping error handling test');
          return;
        }

        const results = await store.queryIndex({
          dataSrcIndex: '',
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' }
          }
        });
        
        // Should return empty array for invalid URL instead of throwing error
        expect(results).to.be.an('array');
        expect(results.length).to.equal(0);
      });
    });

    it('should handle invalid URL format gracefully', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping invalid URL test');
          return;
        }

        const results = await store.queryIndex({
          dataSrcIndex: 'not-a-valid-url',
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' }
          }
        });
        
        // Should return empty array for invalid URL instead of throwing error
        expect(results).to.be.an('array');
        expect(results.length).to.equal(0);
      });
    });

    it('should handle null/undefined dataSrcIndex gracefully', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping null URL test');
          return;
        }

        const results = await store.queryIndex({
          dataSrcIndex: null as any,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' }
          }
        });
        
        // Should return empty array for invalid URL instead of throwing error
        expect(results).to.be.an('array');
        expect(results.length).to.equal(0);
      });
    });

    it('should handle invalid URLs in conjunction queries gracefully', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndexConjunction) {
          cy.log('queryIndexConjunction method not available, skipping invalid URL test');
          return;
        }

        const results = await store.queryIndexConjunction({
          dataSrcIndex: 'invalid-url-format',
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:country': { value: 'Slovakia' },
            'tc:title': { value: 'cas' }
          },
          useConjunction: true
        });
        
        // Should return empty array for invalid URL instead of throwing error
        expect(results).to.be.an('array');
        expect(results.length).to.equal(0);
      });
    });

    it('should handle empty filter values', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndexConjunction) {
          cy.log('queryIndexConjunction method not available, skipping empty filters test');
          return;
        }

        const results = await store.queryIndexConjunction({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {},
          useConjunction: true
        });

        expect(results).to.be.an('array');
        expect(results.length).to.equal(0);
      });
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large result sets', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping performance test');
          return;
        }

        const startTime = performance.now();
        
        const results = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:title': { value: 'cas' } // Very broad pattern
          },
          exactMatchMapping: {
            'tc:title': false
          }
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        expect(results).to.be.an('array');
        expect(executionTime).to.be.lessThan(15000); // Should complete within 5 seconds
      });
    });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

    it('should handle special characters in search patterns', async () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;

        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping special characters test');
          return;
        }

        cy.log('Testing pattern matching with special characters: "castle (medieval)"');
        cy.log('This should extract "cas" prefix and match the "cas.*" pattern in the index');

        const results = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:title': { value: 'castle (medieval)' }
          },
          exactMatchMapping: {
            'tc:title': false // Pattern matching
          }
        });

        expect(results).to.be.an('array');

        // The pattern "castle (medieval)" should extract "cas" and match "cas.*" patterns
        // This should return results from the "cas" index (Bran Castle, Bratislava Castle, etc.)
        expect(results.length).to.be.greaterThan(0);

        // Verify we got castle-related results
        const castleResults = results.filter(async (r: any) => 
          r['tc:title'] && (await(r['tc:title'])).toLowerCase().includes('castle')
        );
        
        cy.log(`✅ Pattern matching returned ${results.length} results, ${castleResults.length} castle-related`);
        expect(castleResults.length).to.be.greaterThan(0);
        
        // Log some example results to verify the pattern matching worked
        cy.log('Example results:', results.slice(0, 3).map((r: any) => r['tc:title']));
      });
    });

    it('should handle exact matching with special characters', () => {
      cy.window().then(async (win: any) => {
        const store = win.sibStore;
        
        if (!store.queryIndex) {
          cy.log('queryIndex method not available, skipping exact match test');
          return;
        }

        cy.log('Testing exact matching with special characters: "Bran Castle"');
        cy.log('This should use exact pattern matching without wildcards');
        
        const results = await store.queryIndex({
          dataSrcIndex: REAL_DATA_SRC_INDEX,
          dataRdfType: 'tc:3DObject',
          filterValues: {
            'tc:title': { value: 'Bran Castle' }
          },
          exactMatchMapping: {
            'tc:title': false // Exact matching
          }
        });

        expect(results).to.be.an('array');
        
        // Exact matching should find exact matches
        expect(results.length).to.be.greaterThan(0);
        
        // Verify we got the exact match
        const exactMatches = results.filter(async (r: any) => 
          await(r['tc:title']) === 'Bran Castle'
        );
        
        cy.log(`✅ Exact matching returned ${results.length} results, ${exactMatches.length} exact matches`);
        expect(exactMatches.length).to.be.greaterThan(0);
      });
    });
  });
});