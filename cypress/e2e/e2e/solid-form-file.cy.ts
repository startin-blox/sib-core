// TODO: We should make tests run independently of one another
describe('solid-form-file test', { testIsolation: false }, function () {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-form-file.html');
  });

  it('upload file with solid-form-file', () => {
    cy.get('#form-file [name=picture] input[type=file]').uploadFile(
      '../../fake-image.svg',
    );
    cy.get('#form-file input[name=picture]').should($i => {
      expect($i.val()).to.match(/\/upload\/[0-9a-f]+.jpg$/);
    });
  });

  it('upload image with solid-form-file-image', () => {
    cy.get('#form-image solid-form-image input[type=file]').uploadFile(
      '../../fake-image.svg',
    );
    cy.get('#form-image solid-form-image img').should($i => {
      expect($i.attr('src')).to.not.match(/\/upload\/fruits.jpg$/);
      expect($i.attr('src')).to.match(/\/upload\/[0-9a-f]+.jpg$/);
    });
  });

  it('resets the file', () => {
    cy.get('#reset-file solid-form-file input[type=file]').uploadFile(
      '../../fake-image.svg',
    );
    cy.get('#reset-file solid-form-file input[name=picture]').should($i => {
      expect($i.val()).to.match(/\/upload\/[0-9a-f]+.jpg$/);
    });
    cy.wait(500);
    cy.get('#reset-file input[type=reset]').click();
    cy.get('#reset-file solid-form-file input[type=file]').should('be.empty');
    cy.get('#reset-file solid-form-file input[type=text]').should(
      'have.value',
      '../../upload/fruits.jpg',
    );
    cy.get('#reset-file solid-form-file button').should('have.attr', 'hidden');
  });

  it('resets the image', () => {
    cy.get('#reset-image solid-form-image input[type=file]').uploadFile(
      '../../fake-image.svg',
    );
    cy.get('#reset-image solid-form-image img').should($i => {
      expect($i.attr('src')).to.not.match(/\/upload\/fruits.jpg$/);
      expect($i.attr('src')).to.match(/\/upload\/[0-9a-f]+.jpg$/);
    });
    cy.get('#reset-image input[type=reset]').click();
    cy.get('#reset-image solid-form-image img').should($i => {
      expect($i.attr('src')).to.match(/\/upload\/fruits.jpg$/);
    });
    cy.get('#reset-image solid-form-image input[type=file]').should('be.empty');
    cy.get('#reset-image solid-form-image input[type=text]').should(
      'have.value',
      '../../upload/fruits.jpg',
    );
    cy.get('#reset-image solid-form-image button').should(
      'have.attr',
      'hidden',
    );
  });

  it('handles required', () => {
    cy.get('#form-required-image solid-form-image input[type=text]').should(
      'have.attr',
      'required',
    );
    cy.get('#form-required-image solid-form-image input[type=file]').should(
      'not.have.attr',
      'required',
    );
    cy.get('#form-required-file solid-form-file input[type=text]').should(
      'have.attr',
      'required',
    );
    cy.get('#form-required-file solid-form-file input[type=file]').should(
      'not.have.attr',
      'required',
    );
  });

  it('displays file name if source not empty', () => {
    cy.visit('/examples/e2e/solid-form-file.html'); // if not then page is not updated, and another file is uploaded from the prev test
    cy.get(
      '#form-file solid-form-file[name=picture] a[href="../../upload/fruits.jpg"]',
    ).contains('fruits.jpg');
    cy.get(
      '#reset-file solid-form-file[name=picture] a[href="../../upload/fruits.jpg"]',
    ).contains('fruits.jpg');
    cy.get(
      '#form-required-file solid-form-file[name=picture] a[href="../../upload/fruits.jpg"]',
    ).contains('fruits.jpg');
  });
});
