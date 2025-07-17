import sleep from '../sleep.ts';

describe('helpers', function () {
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
      for (const script of doc.querySelectorAll('script')) script.remove();
    });
  });

  describe('generalComparator Function Tests', () => {
    it('should compare two numbers correctly', () => {
      expect(helpers.generalComparator(5, 10)).to.equal(-5);
      expect(helpers.generalComparator(10, 5)).to.equal(5);
      expect(helpers.generalComparator(5, 5)).to.equal(0);
    });

    it('should compare two strings correctly', () => {
      expect(helpers.generalComparator('apple', 'banana')).to.be.lessThan(0);
      expect(helpers.generalComparator('panana', 'banana')).to.be.greaterThan(
        0,
      );
      expect(helpers.generalComparator('apple', 'apple')).to.equal(0);
    });

    it('should compare dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-12-31');
      expect(helpers.generalComparator(date1, date2)).to.be.lessThan(0);
      expect(helpers.generalComparator(date2, date1)).to.be.greaterThan(0);
      expect(helpers.generalComparator(date1, date1)).to.equal(0);
    });

    it('should compare booleans correctly', () => {
      expect(helpers.generalComparator(true, false)).to.equal(1);
      expect(helpers.generalComparator(false, true)).to.equal(-1);
      expect(helpers.generalComparator(true, true)).to.equal(0);
    });

    it('should compare arrays by length', () => {
      expect(helpers.generalComparator([1, 2], [1, 2, 3])).to.be.lessThan(0);
      expect(helpers.generalComparator([1, 2, 3], [1, 2])).to.be.greaterThan(0);
      expect(helpers.generalComparator([1, 2, 3], [4, 5, 6])).to.equal(0);
    });

    it('should compare objects by number of keys', () => {
      expect(
        helpers.generalComparator({ a: 1 }, { a: 1, b: 2 }),
      ).to.be.lessThan(0);
      expect(
        helpers.generalComparator({ a: 1, b: 2 }, { a: 1 }),
      ).to.be.greaterThan(0);
      expect(
        helpers.generalComparator({ a: 1, b: 2 }, { x: 10, y: 20 }),
      ).to.equal(0);
    });

    it('should handle null or undefined values', () => {
      expect(helpers.generalComparator(null, undefined)).to.equal(0);
      expect(helpers.generalComparator(null, 1)).to.equal(-1);
      expect(helpers.generalComparator(1, null)).to.equal(1);
    });

    it('should handle different orders correctly', () => {
      expect(helpers.generalComparator(5, 10, 'asc')).to.be.lessThan(0);
      expect(helpers.generalComparator(5, 10, 'desc')).to.be.greaterThan(0);
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
      cy.get('html').should('have.css', 'background-color', 'rgb(0, 128, 0)');
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
      cy.get('link').its('length').should('eq', 1);
    });
  });

  describe('importInlineCSS', () => {
    it('add inline stylesheet', () => {
      helpers.importInlineCSS('test1', 'html {background-color: green}');
      cy.get('html').should('have.css', 'background-color', 'rgb(0, 128, 0)');
    });

    it('avoid import stylesheet twice', () => {
      helpers.importInlineCSS('test2', 'html {background-color: green}');
      helpers.importInlineCSS('test2', 'html {background-color: red}');
      cy.get('html').should('have.css', 'background-color', 'rgb(0, 128, 0)');
      cy.get('html').should(
        'not.have.css',
        'background-color',
        'rgb(255, 0, 0)',
      );
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
      cy.get('script').its('length').should('eq', 1);
    });
  });

  describe('defineComponent', () => {
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

  describe('asyncQuerySelector', () => {
    it('select an element already in document', async () => {
      const list = doc.querySelector('#async-qs ul');
      const list2 = await helpers.asyncQuerySelector('#async-qs ul');
      expect(list2).to.equal(list);
    });
    it('select an element already in another element', async () => {
      const list = doc.querySelector('#async-qs ul') as HTMLUListElement;
      const first1 = list.querySelector<HTMLLIElement>(':scope > :first-child');
      const first2 = await helpers.asyncQuerySelector<HTMLLIElement>(
        ':scope > :first-child',
        list,
      );
      expect(first2).to.equal(first1);
    });

    it('select an element not yet in the DOM', async () => {
      const list = doc.querySelector('#async-qs ul') as HTMLUListElement;
      const li = doc.createElement('li');
      li.classList.add('added');
      setTimeout(() => list.append(li));
      const added1 = list.querySelector(':scope > .added');
      expect(added1).to.be.null;
      const added2 = await helpers.asyncQuerySelector(':scope > .added', list);
      const added3 = list.querySelector(':scope > .added');
      expect(added2).to.equal(added3);
    });

    it('select an element not yet matching selector', async () => {
      const list = doc.querySelector('#async-qs ul') as HTMLUListElement;
      const li = doc.createElement('li');
      list.append(li);
      setTimeout(() => li.classList.add('classed'));
      const classed1 = list.querySelector(':scope > .classed');
      expect(classed1).to.be.null;
      const classed2 = await helpers.asyncQuerySelector(
        ':scope > .classed',
        list,
      );
      const classed3 = list.querySelector(':scope > .classed');
      expect(classed2).to.equal(classed3);
    });
    it('select an element generated by a solid-display', () => {
      cy.get('#async-qs').then(async div => {
        const sd =
          div.append(/* html */ `<solid-display data-src="/examples/data/list/events/event-1.jsonld"
          fields="event, name, date"
          widget-date="solid-display-value-date"
        >`)[0];
        const sdv = await helpers.asyncQuerySelector(
          'solid-display-value-date',
          sd,
        );
        expect(sdv).has.nested.property('component.name', 'date');
      });
    });
  });

  describe('asyncQuerySelectorAll', () => {
    const items: Element[] = [];
    it('select currents and futures elements in DOM', async () => {
      const list = doc.querySelector('#async-qs ol');
      if (!list) throw new Error('no `#async-qs ol`');
      (async () => {
        for await (const li of helpers.asyncQuerySelectorAll('li', list))
          items.push(li);
      })();
      await sleep(1000);
      expect(items).to.have.length(2);
      for (let index = 0; index < 3; index++)
        list.append(doc.createElement('li'));
      await sleep(1000);
      expect(items).to.have.length(5);
    });

    it('select elements generated by a solid-display', () => {
      cy.get('#async-qs').then(async div => {
        await sleep(1000);
        const sd = div.append(
          /* html */ `<solid-display data-src="/examples/data/list/users/users.jsonld">`,
        )[0];
        let limit = 20;
        for await (const sdv of helpers.asyncQuerySelectorAll<HTMLElement>(
          'solid-display-value',
          sd,
        )) {
          if (limit-- <= 0) break;
          expect(sdv).has.nested.property('component.name');
          sdv.style.background = '#9f9';
        }
      });
    });
  });
});
