
declare namespace Cypress {
  interface Chainable {
    /**
     * Load file in <input type="file">
     * @example cy.get('input[type=file]').uploadFile('./img/image.jpg')
    */
   uploadFile(fileName: string): Chainable<Element>
  }
}

interface Window {
  store: any
}