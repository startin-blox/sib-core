import { BaseWidget } from './widget-factory.js';
import { defineComponent } from "../libs/helpers.js";
export default class SIBMultiple extends BaseWidget {
  async render() {
    while (this.firstChild) this.firstChild.remove();
    if (!this.value) return;
    let i = 0;
    for await (const resource of this.value) {
      i++;
      const elm = this.insertWidget(this.childAttributes);
      if (elm) {
        elm['value'] = resource;
        elm.toggleAttribute('data-holder', true);
      }
    }
    if (i) { // if values displayed, show label
      const label = document.createElement('label');
      label.textContent = this.label;
      this.insertBefore(label, this.firstChild);
    }
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

  insertWidget(attributes: object): HTMLElement | undefined {
    const widgetTag = this.getAttribute('widget');
    const widget = widgetTag ? document.createElement(widgetTag) : null;
    if (!widget) return;

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    this.appendChild(widget);
    return widget;
  }
}

defineComponent('sib-multiple', SIBMultiple);
