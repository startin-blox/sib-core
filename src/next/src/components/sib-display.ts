import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';

const SibDisplay = {
  name: 'sib-display',
  use: [ WidgetMixin, ListMixin, StoreMixin ],
  created() {
    window.addEventListener('navigate', event => {
      if (this.resource == null) return;
      if (event['detail'].resource == null) return;
      if (this.resource['@id'] == null) return;
      this.element.toggleAttribute(
        'active',
        this.resource['@id'] === event['detail'].resource['@id'],
      );
    });
  },
  get childTag() {
    return this.element.dataset.child || this.element.tagName;
  },
  get defaultWidget() {
    return 'sib-display-value';
  },
  get defaultMultipleWidget() {
    return 'sib-multiple';
  },
  // Here "even.target" points to the content of the widgets of the children of sib-display
  dispatchSelect(event) {
    const resource = event.target.closest(this.childTag).component.resource;
    this.element.dispatchEvent(
      new CustomEvent('resourceSelect', { detail: { resource: resource } }),
    );
    if (this.next) {
      this.element.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource },
        }),
      );
    }
  },
  appendChildElt(resource: Object, parent) {
    const child = document.createElement(this.childTag);
    child.component.resource = resource;
    child.addEventListener('click', this.dispatchSelect.bind(this));
    if (this.dataFields != null) child.dataset.fields = this.dataFields;

    for (let attr of this.element.attributes) //copy widget and value attributes
      if (
        attr.name.startsWith('value-') ||
        attr.name.startsWith('label-') ||
        attr.name.startsWith('set-') ||
        attr.name.startsWith('widget-') ||
        attr.name.startsWith('class-') ||
        attr.name.startsWith('multiple-') ||
        attr.name.startsWith('action-')
      )
        child.setAttribute(attr.name, attr.value);

    parent.appendChild(child);
  },
  async appendSingleElt() {
    for (let field of this.fields) {
      await this.appendWidget(field);
    }
  }
};

export default Sib.register(SibDisplay);