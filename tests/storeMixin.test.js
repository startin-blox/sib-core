import { StoreMixin } from '../dist/mixins/storeMixin';
import { Sib } from '../dist/libs/Sib';
import { fixture, expect, aTimeout } from '@open-wc/testing';

describe('Store Mixin', () => {
  before(() => {
    const CustomComponent = {
      name: 'custom-component',
      use: [StoreMixin]
    }
    Sib.register(CustomComponent);
  });

  it('get component', async () => {
    const el = await fixture(`
      <custom-component></custom-component>
    `);
    expect(el.component).to.be.an('object');
    expect(el.component).to.have.property('element');
    expect(el.component).to.have.property('resourcesFilters');
    expect(el.component.resourcesFilters).to.be.empty;
  });

  it('fetch datas', async function () {
    const el = await fixture(`
      <custom-component></custom-component>
    `);
    expect(el.component.resource).to.be.null;
    el.dataset.src = "base/examples/data/sib-display.jsonld";
    await aTimeout(1000);
    expect(el.component.resource).to.be.an('object');
    expect(el.component.resource).to.have.property('@context');
  });

  it('define parameters', async () => {
    const el = await fixture(`
      <custom-component></custom-component>
    `);
    expect(el.component.extraContext).to.be.null;
    expect(el.component.next).to.be.empty;
    expect(el.component.loaderId).to.be.empty;
    expect(el.component.nestedField).to.be.null;

    el.setAttribute('extra-context', 'extraContextId')
    el.setAttribute('next', 'nextAttr')
    el.setAttribute('loader-id', 'loaderElementId')
    el.setAttribute('nested-field', 'fieldToFetch')

    expect(el.component.extraContext).to.be.equal('extraContextId');
    expect(el.component.next).to.be.equal('nextAttr');
    expect(el.component.loaderId).to.be.equal('loaderElementId');
    expect(el.component.nestedField).to.be.equal('fieldToFetch');
  });

  it('fetch container', async () => {
    const el = await fixture(`
      <custom-component
        data-src="base/examples/data/sib-display.jsonld">
      </custom-component>
    `);
    await aTimeout(1000);

    expect(el.component.isContainer()).to.be.true;
    expect(el.component.resources).to.be.an('array').that.not.is.empty;
    expect(el.component.permissions).to.be.an('array').that.not.is.empty;
  });

  it('fetch resource', async () => {
    const el = await fixture(`
      <custom-component
        data-src="base/examples/data/project.jsonld">
      </custom-component>
    `);
    await aTimeout(1000);

    expect(el.component.isContainer()).to.be.false;
    expect(el.component.resources).to.be.an('array').that.is.empty;
    expect(el.component.permissions).to.be.an('array').that.not.is.empty;
  });
});