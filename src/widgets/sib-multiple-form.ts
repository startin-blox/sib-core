import { BaseWidget } from './widget-factory.js';
import { defineComponent } from "../libs/helpers.js";

export default class SIBMultipleForm extends BaseWidget {
  get range(): string | null {
    return this.getAttribute('range');
  }
  set range(range: string | null) {
    if (range) this.setAttribute('range', range);
  }
  get addLabel(): string | null {
    return this.hasAttribute('add-label') ? this.getAttribute('add-label') : '+';
  }
  get removeLabel(): string | null {
    return this.hasAttribute('remove-label') ? this.getAttribute('remove-label') : '×';
  }
  get value() {
    if (!this.dataHolder) return [];
    return this.dataHolder.map(element => element['value']);
  }
  set value(value) {
    this._value = value;
    this.render();
  }
  async render(){
    const fragment = document.createDocumentFragment();
    const childContainer = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = this.label;
    fragment.appendChild(label);
    fragment.appendChild(childContainer);
    const addButton = document.createElement('button');
    addButton.textContent = this.addLabel;
    addButton.type = 'button';
    addButton.addEventListener('click', () => {
      this.insertWidget(this.childAttributes, childContainer);
    });
    fragment.appendChild(addButton);
    if (this._value) {
      for await (const resource of this._value['ldp:contains']) {
        const elm = this.insertWidget(this.childAttributes, childContainer);
        if (elm) {
          elm['value'] = resource;
          elm.toggleAttribute('data-holder', true);
        }
      }
    }
    while (this.firstChild) this.firstChild.remove();
    this.appendChild(fragment);
  }
  get childAttributes(): object {
    const attrs = {};
    if (this.range) attrs['range'] = this.range;
    attrs['name'] = this.name;
    for (let attr of ['label', 'class']) {
      const value = this[`each-${attr}`];
      if (value == null) continue;
      attrs[attr] = value;
    }
    return attrs;
  }

  insertWidget(attributes: object, parent: HTMLElement): HTMLElement | undefined {
    const childWrapper = document.createElement('div');
    const widgetTag = this.getAttribute('widget');
    const widget = widgetTag ? document.createElement(widgetTag) : null;
    if (!widget) return;

    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    widget.toggleAttribute("data-holder");
    childWrapper.appendChild(widget);

    const removeButton = document.createElement('button');
    removeButton.textContent = this.removeLabel;
    removeButton.type = 'button';
    removeButton.addEventListener('click', () => {
      childWrapper.remove();
    });
    childWrapper.appendChild(removeButton);
    parent.appendChild(childWrapper);
    return widget;
  }
}

defineComponent('sib-multiple-form', SIBMultipleForm);
