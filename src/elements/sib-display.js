import { SIBBase } from '../parents/index.js';
import { SIBListMixin, SIBWidgetMixin } from '../mixins/index.js';

export default class SIBDisplay extends SIBListMixin(SIBWidgetMixin(SIBBase)) {
  constructor() {
    super();
    window.addEventListener('navigate', event => {
      if (this.resource == null) return;
      if (event.detail.resource == null) return;
      if (this.resource['@id'] == null) return;
      this.toggleAttribute(
        'active',
        this.resource['@id'] === event.detail.resource['@id'],
      );
    });
  }
  
  get defaultWidget() {
    return 'sib-display-value';
  }
  
  get defaultMultipleWidget() {
    return 'sib-multiple';
  }

  get childTag() {
    return this.dataset.child || this.tagName;
  }

  // Here "even.target" points to the content of the widgets of the children of sib-display
  dispatchSelect(event) {
    const resource = event.target.closest(this.childTag).resource;
    this.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    if (this.next) {
      this.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource },
        }),
      );
    }
  }
  appendChildElt(resource, parent) {
    const child = document.createElement(this.childTag);
    child.resource = resource;
    child.addEventListener('click', this.dispatchSelect.bind(this));
    if (this.hasAttribute("fields")) child.setAttribute("fields", this.getAttribute("fields"));

    for (let attr of this.attributes) //copy widget and value attributes
      if (
        attr.name.startsWith('value-') ||
        attr.name.startsWith('label-') ||
        attr.name.startsWith('set-') ||
        attr.name.startsWith('widget-') ||
        attr.name.startsWith('class-') ||
        attr.name.startsWith('multiple-') ||
        attr.name.startsWith('editable-') ||
        attr.name.startsWith('action-')
      )
        child.setAttribute(attr.name, attr.value);

    parent.appendChild(child);
  }
  async appendSingleElt() {
    for (let field of this.fields) {
      await this.appendWidget(field);
    }
  }
}

customElements.define('sib-display', SIBDisplay);
