import { BaseWidget } from '../parents/widget-factory.js';

export default class SIBMultipleForm extends BaseWidget {
  get range() {
    return this.getAttribute('range');
  }
  set range(range) {
    this.setAttribute('range', range);
  }
  render() {
    const fragment = document.createDocumentFragment();
    const label = document.createElement('label');
    label.textContent = this.label;
    fragment.appendChild(label);
    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.type = 'button';
    addButton.addEventListener('click', () => {
      this.insertWidget(this.childAttributes, parent);
    });
    fragment.appendChild(addButton);
    if (!this.value) return;
    this.value.forEach(value => {
      const elm = this.insertWidget(this.childAttributes, fragment);
      elm.value = value;
      elm.toggleAttribute('data-holder', true);
    });
    while(this.firstChild) this.firstChild.remove()
    this.appendChild(fragment);
  }
  get childAttributes() {
    const attrs = {};
    if (this.range) attrs.range = this.range;
    attrs.name = this.name;
    for (let attr of ['label', 'class']) {
      const value = this[`each-${attr}`];
      if (value == null) continue;
      attrs[attr] = value;
    }
    return attrs;
  }

  insertWidget(attributes, parent) {
    const childWrapper = document.createElement('div');
    const widget = document.createElement(this.getAttribute('widget'));
    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    childWrapper.appendChild(widget);

    const removeButton = document.createElement('button');
    removeButton.textContent = '×';
    removeButton.type = 'button';
    removeButton.addEventListener('click', () => {
      childWrapper.remove();
    });
    childWrapper.appendChild(removeButton);
    parent.insertBefore(childWrapper, parent.lastChild);
    return widget;
  }
}
customElements.define('sib-multiple-form', SIBMultipleForm);
