describe('solid-form-file test', function() {
  it('upload file with solid-form-file', function() {
    cy.visit('/examples/solid-form-file.html')
    cy.get('[name=picture]+input[type=file]').uploadFile('../../fake-image.svg')
    cy.get('input[name=picture]').should($i => {
      expect($i.val()).to.match(/\/upload\/[0-9a-f]+.jpg$/)
    })
  })
  it('upload image with solid-form-file-image', function() {
    cy.visit('a/examples/solid-form-file.html')
    cy.get('solid-form-file-image input[type=file]').uploadFile('../../fake-image.svg')
    cy.get('solid-form-file-image img').should($i => {
      expect($i.attr('src')).to.not.match(/\/upload\/fruits.jpg$/)
      expect($i.attr('src')).to.match(/\/upload\/[0-9a-f]+.jpg$/)
    })
  })
})