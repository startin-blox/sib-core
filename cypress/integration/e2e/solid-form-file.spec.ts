describe('solid-form-file test', function() {
  this.beforeAll('visit', () => {
    cy.visit('/examples/e2e/solid-form-file.html')
  });
  it('upload file with solid-form-file', function() {
    cy.get('#form-file [name=picture]+input[type=file]').uploadFile('../../fake-image.svg')
    cy.get('#form-file input[name=picture]').should($i => {
      expect($i.val()).to.match(/\/upload\/[0-9a-f]+.jpg$/)
    })
  })
  it('upload image with solid-form-file-image', function() {
    cy.get('#form-image solid-form-image input[type=file]').uploadFile('../../fake-image.svg')
    cy.get('#form-image solid-form-image img').should($i => {
      expect($i.attr('src')).to.not.match(/\/upload\/fruits.jpg$/)
      expect($i.attr('src')).to.match(/\/upload\/[0-9a-f]+.jpg$/)
    })
  })
})