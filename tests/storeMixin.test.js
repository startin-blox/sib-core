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
      <custom-component
        data-src="base/examples/data/sib-display.jsonld">
      </custom-component>
    `);
    await aTimeout(1000);
    expect(el.component.resource).to.be.an('object');
    expect(el.component.resource).to.have.property('@context');
  });
});