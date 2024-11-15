describe('Component factory', function () {
  let Sib: typeof import('../../../src/libs/Sib').Sib;
  let win: Window;
  let doc: Document;
  let cnsl: Console;
  this.beforeEach('get dom', () => {
    cy.visit('examples/e2e/sib-register.html');
    cy.window().then(w => {
      win = w;
      doc = win.document;
      cnsl = (win as Window & typeof globalThis).console;
      ///@ts-ignore
      Sib = win.Sib;
      win.document
        .querySelectorAll('script')
        .forEach(script => script.remove());
    });
  });

  it('register', () => {
    cy.spy(cnsl, 'warn');
    const myComponent = { name: 'my-component' };
    Sib.register(myComponent);
    const el = doc.createElement('my-component');
    const myComponentClass = win.customElements.get('my-component');
    expect(myComponentClass).is.not.undefined;
    ///@ts-ignore
    expect(el).is.instanceOf(win.HTMLElement);
    expect(el).is.instanceOf(myComponentClass);
    expect(cnsl.warn).not.be.called;
    Sib.register(myComponent);
    expect(cnsl.warn).to.be.called;
  });
});
