import { SIBBase } from '../parents/index.js';
import { SIBListMixin, SIBWidgetMixin } from '../mixins/index.js';

export default class SIBDisplay extends SIBListMixin(SIBWidgetMixin(SIBBase)) {
  constructor() {
    super();
    window.addEventListener('navigate', (event) => {
      if (this.resource == null) return;
      if (event.detail.resource == null) return;
      if (this.resource['@id'] == null) return;
      this.toggleAttribute(
        'active',
        this.resource['@id'] === event.detail.resource['@id'],
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  get defaultWidget() {
    return 'sib-display-div';
  }

  get childTag() {
    return this.dataset.child || this.tagName;
  }

  // Here "even.target" points to the content of the widgets of the children of sib-display
  dispatchSelect(event) {
    const { resource } = event.target.closest(this.childTag);
    this.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource } }),
    );
    if (this.next) {
      this.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource },
        }),
      );
    }
  }

  appendChildElt(resource) {
    const child = document.createElement(this.childTag);
    child.resource = resource;
    child.addEventListener('click', this.dispatchSelect.bind(this));
    if (this.dataset.fields) child.dataset.fields = this.dataset.fields;

    // copy widget and value attributes
    this.attributes.forEach((attr) => {
      if (
        attr.name.startsWith('value-')
        || attr.name.startsWith('set-')
        || attr.name.startsWith('widget-')
        || attr.name.startsWith('template-')
        || attr.name.startsWith('action-')
      ) {
        child.setAttribute(attr.name, attr.value);
      }
    });

    this.div.appendChild(child);
  }

  async appendSingleElt() {
    const results = [];

    this.fields.forEach(async (field) => {
      results.push(this.appendWidget(field));
    });

    await Promise.all(results);
  }
}

customElements.define('sib-display', SIBDisplay);
