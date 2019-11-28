import { BaseWidget } from './baseWidget.js';
import { defineComponent } from "../libs/helpers.js";
import { store } from "../libs/store/store.js";
export default class SIBMultiple extends BaseWidget {
  async render() {
    const fragment = document.createDocumentFragment();
    if (!this.value) return;

    const label = document.createElement('label');
    label.textContent = this.label;
    fragment.appendChild(label);

    let i = 0;
    const parent = document.createElement('div');
    for await (const resource of this.value['ldp:contains']) {
      const elm = this.insertWidget(this.childAttributes, parent);
      if (elm) {
        elm['value'] = await store.initGraph(resource['@id']);
        elm.toggleAttribute('data-holder', true);
      }
      i++;
    }
    fragment.appendChild(parent);

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

  get label(): string | null {
    return this.hasAttribute('label') ? this.getAttribute('label') : null;
  }

  set label(label: string | null) {
    if(label != null) this.setAttribute('label', label);
    this.render();
  }

  insertWidget(attributes: object, parent: HTMLElement): HTMLElement | undefined {
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
