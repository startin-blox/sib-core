describe('solid-form-richeditor-spec', function () {
  this.beforeEach('visit', () => {
    cy.visit('/examples/e2e/solid-form-richeditor.html');
  });

  it('editor mixin format', () => {
    // Check textarea and iframe id
    cy.wait(2000);

    cy.get('#tinymce-editor1 solid-form-editor > textarea')
      .invoke('attr', 'id')
      .as('textareaId');

    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(1)
      .find('iframe')
      .invoke('attr', 'id')
      .as('iframeId');

    cy.get('@textareaId').then(Id1 => {
      cy.get('@iframeId').then(Id2 => {
        expect(Id2).to.contain(Id1);
      });
    });
    // Formating and sending data to the back with editor mixin (tinymce)
    cy.get('#tinymce-editor1 solid-form-editor > textarea').should(
      'have.attr',
      'name',
      'name',
    );
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .should('have.length', 4);
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(0)
      .should('have.class', 'tox-editor-header');

    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(0)
      .should('have.class', 'tox-editor-header')
      .within(() => {
        cy.get('button[title="Bold"]').click();
      });
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(1)
      .should('have.class', 'tox-sidebar-wrap')
      .within(() => {
        cy.iframe().wait(500).type('Hello ');
      });
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(0)
      .should('have.class', 'tox-editor-header')
      .within(() => {
        cy.get('button[title="Italic"]').click();
      });
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(1)
      .should('have.class', 'tox-sidebar-wrap')
      .within(() => {
        cy.iframe().wait(500).type('world{enter}');
      });
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(0)
      .should('have.class', 'tox-editor-header')
      .within(() => {
        cy.get('button[title="Bold"]').click();
        cy.get('button[title="Italic"]').click();
        cy.get('button[title="Bullet list"]').click();
      });
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(1)
      .should('have.class', 'tox-sidebar-wrap')
      .within(() => {
        cy.iframe().wait(500).type('item 1{enter}item 2');
      });

    // Check the HTML content format (before send it to the back)
    cy.get('@iframeId').iframe().find('strong').should('contain', 'Hello');
    cy.get('@iframeId').iframe().find('em').should('contain', 'world');
    cy.get('@iframeId')
      .iframe()
      .find('ul')
      .children()
      .eq(0)
      .should('contain', 'item 1');
    cy.get('@iframeId')
      .iframe()
      .find('ul')
      .children()
      .eq(1)
      .should('contain', 'item 2');
  });

  it('should update toolbar state when cursor is on formatted text', () => {
    cy.wait(2000);
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(1)
      .within(() => {
        cy.iframe().wait(500).type('Bold text{selectall}');
      });

    // Assert that the bold button gets clicked
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(0)
      .within(() => {
        cy.get('button[title="Bold"]').click();
      });

    // Check that the selected text is wrapped in <strong>
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(1)
      .within(() => {
        cy.iframe().find('strong').should('contain.text', 'Bold text');
      });

    // Re-check that the Bold button has the correct aria-pressed state
    cy.get('#tinymce-editor1 solid-form-editor > div > div')
      .children()
      .eq(0)
      .within(() => {
        cy.get('button[title="Bold"]').should(
          'have.attr',
          'aria-pressed',
          'true',
        );
      });
  });
});
