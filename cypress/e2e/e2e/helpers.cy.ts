import sleep from '../sleep'

describe('helpers', function() {
  let helpers: typeof import('../../../src/libs/helpers');
  let win: Window;
  let doc: Document;
  this.beforeEach('get dom', () => {
    cy.visit('examples/e2e/helpers.html');
    cy.window().then(w => {
      win = w;
      doc = win.document;
      ///@ts-ignore
      helpers = win.helpers;
      doc
        .querySelectorAll('script')
        .forEach(script => script.remove());
    });
  });

  describe('importCSS', () => {
    it('add one stylesheet', () => {
      const url = 'helpers.css';
      helpers.importCSS(url);
      cy.get('link')
        .should('have.attr', 'href', new URL(url, doc.baseURI).href)
        .then(
          link =>
            new Cypress.Promise(resolve => {
              link[0].addEventListener('load', resolve);
            }),
        );
      cy.get('html').then(html => {
        expect(html.css('background-color')).eq('rgb(0, 128, 0)');
      });
    });

    it('add several stylesheet', () => {
      const urls = ['helpers.css?k=1', 'helpers.css?k=2'];
      helpers.importCSS(...urls);
      cy.get('link').then(links => {
        const hrefs = links.toArray().map(link => link.getAttribute('href'));
        expect(hrefs).deep.eq(urls.map(url => new URL(url, doc.baseURI).href));
      });
    });

    it('avoid import stylesheet twice', () => {
      const url = 'helpers.css';
      helpers.importCSS(url);
      helpers.importCSS(url);
      cy.get('link')
        .its('length')
        .should('eq', 1);
    });
  });

  describe('importJS', () => {
    it('add one script', () => {
      const url = 'helpers.js';
      helpers.importJS(url);
      cy.get('script')
        .should('have.attr', 'src', new URL(url, doc.baseURI).href)
        .then(
          script =>
            new Cypress.Promise(resolve => {
              script[0].addEventListener('load', resolve);
            }),
        )
        .then(() => {
          ///@ts-ignore
          expect(win.scriptLoaded).is.true;
        });
    });

    it('add several scripts', () => {
      const urls = ['helpers.js?k=1', 'helpers.js?k=2'];
      helpers.importJS(...urls);
      cy.get('script').then(scripts => {
        const srcs = scripts.toArray().map(link => link.getAttribute('src'));
        expect(srcs).deep.eq(urls.map(url => new URL(url, doc.baseURI).href));
      });
    });
    
    it('add script only once', () => {
      const url = 'script';
      helpers.importJS(url);
      helpers.importJS(url);
      cy.get('script')
        .its('length')
        .should('eq', 1);
    });
  });

  describe('defineComponent', function() {
    it('define my-component', () => {
      expect(win.customElements.get('my-component')).to.be.undefined;
      helpers.defineComponent('my-component', class extends HTMLElement {});
      expect(win.customElements.get('my-component')).to.not.be.undefined;
    });
    
    it('show a warning', () => {
      const spy = cy.spy((win as Window & typeof globalThis).console, 'warn');
      helpers.defineComponent('my-component', class extends HTMLElement {});
      helpers.defineComponent('my-component', class extends HTMLElement {});
      expect(spy).to.have.been.called;
    });
  });

  
  describe('asyncQuerySelector', function () {
    it('select an element already in document', async () => {
      const list = doc.querySelector('#async-qs ul')!
      const list2 = await helpers.asyncQuerySelector('#async-qs ul')
      expect(list2).to.equal(list)
    })
    it('select an element already in another element', async () => {
      const list = doc.querySelector('#async-qs ul')!
      const first1 = list.querySelector<HTMLLIElement>(':scope > :first-child')
      const first2 = await helpers.asyncQuerySelector<HTMLLIElement>(
        ':scope > :first-child',
        list,
      )
      expect(first2).to.equal(first1!)
    })

    it('select an element not yet in the DOM', async () => {
      const list = doc.querySelector('#async-qs ul')!
      const li = doc.createElement('li')
      li.classList.add('added')
      setTimeout(() => list.append(li))
      const added1 = list.querySelector(':scope > .added')
      expect(added1).to.be.null
      const added2 = await helpers.asyncQuerySelector(':scope > .added', list)
      const added3 = list.querySelector(':scope > .added')
      expect(added2).to.equal(added3!)
    })

    it('select an element not yet matching selector', async () => {
      const list = doc.querySelector('#async-qs ul')!
      const li = doc.createElement('li')
      list.append(li)
      setTimeout(() => li.classList.add('classed'))
      const classed1 = list.querySelector(':scope > .classed')
      expect(classed1).to.be.null
      const classed2 = await helpers.asyncQuerySelector(':scope > .classed', list)
      const classed3 = list.querySelector(':scope > .classed')
      expect(classed2).to.equal(classed3!)
    })
  })

  describe('asyncQuerySelectorAll', () => {
    const items: Element[] = []
    it('select currents and futures elements in DOM', async () => {
      const list = doc.querySelector('#async-qs ol')!
      ;(async () => {
        for await (const li of helpers.asyncQuerySelectorAll('li', list)) items.push(li)
      })()
      await sleep()
      expect(items).to.have.length(2)
      for (let index = 0; index < 3; index++)
        list.append(doc.createElement('li'))
      await sleep()
      expect(items).to.have.length(5)
    })
  })

});
