describe('Component factory', function() {
  let Sib: typeof import('../../../src/libs/Sib').Sib;
  let win: Window;
  let doc: Document;
  this.beforeEach('get dom', () => {
    cy.visit('examples/e2e/sib-register.html');
    cy.window().then(w => {
      win = w;
      doc = win.document;
      ///@ts-ignore
      Sib = win.Sib;
      win.document
        .querySelectorAll('script')
        .forEach(script => script.remove());
    });
  });

  it('register', () => {
    cy.spy(win.console, 'warn');
    const myComponent = { name: 'my-component' };
    Sib.register(myComponent);
    const el = doc.createElement('my-component');
    const myComponentClass = win.customElements.get('my-component');
    expect(myComponentClass).is.not.undefined;
    ///@ts-ignore
    expect(el).is.instanceOf(win.HTMLElement);
    expect(el).is.instanceOf(myComponentClass);
    expect(win.console.warn).not.be.called;
    Sib.register(myComponent);
    expect(win.console.warn).to.be.called;
  });
});
