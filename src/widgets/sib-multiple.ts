import { BaseWidget } from './widget-factory.js';
import { defineComponent } from "../libs/helpers.js";
export default class SIBMultiple extends BaseWidget {
  render(): void {
    while (this.firstChild) this.firstChild.remove();
    if (!this.value) return;
    if (this.value.length && this.label) {
      const label = document.createElement('label');
      label.textContent = this.label;
      this.appendChild(label);
    }
    const parent = document.createElement('div');
    this.value.forEach(value => {
      const elm = this.insertWidget(this.childAttributes, parent);
      if (elm) {
        elm['value'] = value;
        elm.toggleAttribute('data-holder', true);
      }
    });
    this.appendChild(parent);
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
