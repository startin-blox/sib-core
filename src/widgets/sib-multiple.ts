import { BaseWidget } from './widget-factory.js';
import { defineComponent } from "../libs/helpers.js";
export default class SIBMultiple extends BaseWidget {
  async render() {
    const fragment = document.createDocumentFragment();
    if (!this.value) return;

    const label = document.createElement('label');
    label.textContent = this.label;
    fragment.appendChild(label);

    let i = 0;
    for await (const resource of this.value['ldp:contains']) {
      const elm = this.insertWidget(this.childAttributes, fragment);
      if (elm) {
        elm['value'] = resource;
        elm.toggleAttribute('data-holder', true);
      }
      i++;
    }

    if (i == 0) fragment.removeChild(label); // if nothing added, remove the label
    while(this.firstChild) this.firstChild.remove()
    this.appendChild(fragment);
  }

  get childAttributes(): object {
    const attrs = {};

    for (let attr of ['label', 'class']) {
      const value = this[`each-${attr}`];
      if (value == null) continue;
      attrs[attr] = value;
    }

    attrs['name'] = this.name;

    return attrs;
  }

  insertWidget(attributes: object, parent): HTMLElement | undefined {
    const widgetTag = this.getAttribute('widget');
    const widget = widgetTag ? document.createElement(widgetTag) : null;
    if (!widget) return;

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    parent.appendChild(widget);
    return widget;
  }
}

defineComponent('sib-multiple', SIBMultiple);
