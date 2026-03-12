/**
 * Validates that DataspaceConnectorStore merges additionalContext
 * into every outgoing request's @context.
 */
describe(
  'DataspaceConnectorStore additionalContext',
  { testIsolation: false },
  function () {
    this.beforeAll('visit test page', () => {
      cy.visit('/examples/e2e/edc-additional-context.html');
      cy.get('#status').should('have.text', 'ready');
    });

    describe('with additionalContext configured', () => {
      it('merges additional context into getAssets request', () => {
        let capturedBody: any;

        cy.intercept(
          'POST',
          '**/test-connector.example.com/management/v3/assets/request',
          req => {
            capturedBody = req.body;
            req.reply({
              statusCode: 200,
              body: [],
              headers: { 'content-type': 'application/json' },
            });
          },
        ).as('getAssets');

        cy.window().then(async (win: any) => {
          try {
            await win.dscStore.getAssets();
          } catch {
            // may fail due to response format, we only care about the request
          }
        });

        cy.then(() => {
          expect(capturedBody).to.exist;
          expect(capturedBody['@context']).to.exist;
          // Base context entries should be present
          expect(capturedBody['@context']).to.have.property(
            '@vocab',
            'https://w3id.org/edc/v0.0.1/ns/',
          );
          expect(capturedBody['@context']).to.have.property(
            'edc',
            'https://w3id.org/edc/v0.0.1/ns/',
          );
          // Additional context entries should be merged in
          expect(capturedBody['@context']).to.have.property(
            'dcterms',
            'http://purl.org/dc/terms/',
          );
          expect(capturedBody['@context']).to.have.property(
            'dcat',
            'http://www.w3.org/ns/dcat#',
          );
          expect(capturedBody['@context']).to.have.property(
            'myns',
            'https://my-namespace.example.com/',
          );
        });
      });

      it('merges additional context into catalog request', () => {
        let capturedBody: any;

        cy.intercept(
          'POST',
          '**/test-connector.example.com/management/v3/catalog/request',
          req => {
            capturedBody = req.body;
            req.reply({
              statusCode: 200,
              body: { '@type': 'dcat:Catalog', 'dcat:dataset': [] },
              headers: { 'content-type': 'application/json' },
            });
          },
        ).as('getCatalog');

        cy.window().then(async (win: any) => {
          try {
            await win.dscStore.getCatalog();
          } catch {
            // may fail, we only care about the request
          }
        });

        cy.then(() => {
          expect(capturedBody).to.exist;
          expect(capturedBody['@context']).to.exist;
          // Additional context entries should be merged
          expect(capturedBody['@context']).to.have.property(
            'dcterms',
            'http://purl.org/dc/terms/',
          );
          expect(capturedBody['@context']).to.have.property(
            'dcat',
            'http://www.w3.org/ns/dcat#',
          );
          expect(capturedBody['@context']).to.have.property(
            'myns',
            'https://my-namespace.example.com/',
          );
        });
      });
    });

    describe('without additionalContext configured', () => {
      it('does not include extra context entries', () => {
        let capturedBody: any;

        cy.intercept(
          'POST',
          '**/test-connector-noctx.example.com/management/v3/assets/request',
          req => {
            capturedBody = req.body;
            req.reply({
              statusCode: 200,
              body: [],
              headers: { 'content-type': 'application/json' },
            });
          },
        ).as('getAssetsNoCtx');

        cy.window().then(async (win: any) => {
          try {
            await win.dscStoreNoCtx.getAssets();
          } catch {
            // may fail, we only care about the request
          }
        });

        cy.then(() => {
          expect(capturedBody).to.exist;
          expect(capturedBody['@context']).to.exist;
          // Base context should be present
          expect(capturedBody['@context']).to.have.property(
            '@vocab',
            'https://w3id.org/edc/v0.0.1/ns/',
          );
          // Additional context entries should NOT be present
          expect(capturedBody['@context']).to.not.have.property('dcterms');
          expect(capturedBody['@context']).to.not.have.property('myns');
        });
      });
    });
  },
);
