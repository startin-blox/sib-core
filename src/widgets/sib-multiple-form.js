import { Widget } from '../parents/widget-factory.js';

export default class SIBMultipleForm extends Widget {
  render() {
    while (this.firstChild) this.firstChild.remove();
    const label = document.createElement('label');
    label.textContent = this.label;
    this.appendChild(label);
    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.type = 'button';
    addButton.addEventListener('click', () => {
      this.insertWidget(this.childAttributes);
    });
    this.appendChild(addButton);
    if (!this.value) return;
    this.value.forEach(value => {
      const elm = this.insertWidget(this.childAttributes);
      elm.value = value;
      elm.toggleAttribute('data-holder', true);
    });
  }
  get childAttributes() {
    const attrs = {};
    if (this.range && this.range.length) attrs.range = this.range;
    for (let attr of ['label', 'class']) {
      const value = this[`each-${attr}`];
      console.log(`each-${attr}`,value);
      if (value == null) continue;
      attrs[attr] = value;
    }
    console.log(attrs);
    return attrs;
  }

  insertWidget(attributes) {
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
    this.insertBefore(childWrapper, this.lastChild);
    return widget;
  }
}
customElements.define('sib-multiple-form', SIBMultipleForm);
