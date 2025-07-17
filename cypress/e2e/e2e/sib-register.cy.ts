describe('Component factory', function () {
  let Sib: typeof import('../../../src/libs/Sib').Sib;
  let win: Window;
  let cnsl: Console;
  this.beforeEach('get dom', () => {
    cy.visit('examples/e2e/sib-register.html');
    cy.window().then(w => {
      win = w;
      cnsl = (win as Window & typeof globalThis).console;
      ///@ts-ignore
      Sib = win.Sib;
      for (const script of win.document.querySelectorAll('script'))
        script.remove();
    });
  });

  it('register', () => {
    cy.window()
      .should('have.property', 'Sib')
      .then(async () => {
        Sib = await win.Sib;
        expect(Sib).to.be.an('object');
        expect(Sib).to.have.property('register');

        cnsl = (win as Window & typeof globalThis).console;
        cy.spy(cnsl, 'warn');

        const myComponent = { name: 'my-component' };
        Sib.register(myComponent);

        const el = win.document.createElement('my-component');
        const myComponentClass = win.customElements.get('my-component');

        expect(myComponentClass).to.not.be.undefined;
        expect(el).to.be.instanceOf(win.HTMLElement);
        expect(el).to.be.instanceOf(myComponentClass);
        expect(cnsl.warn).not.to.be.called;

        Sib.register(myComponent); // Second call
        expect(cnsl.warn).to.be.called;
      });
  });
});
