import { SIBWidgetMixin } from '../mixins/index.js';
import { SIBBase } from '../parents/index.js';
import { store } from '../store.js';
import { setDeepProperty } from "../helpers/index.js";

export default class SIBForm extends SIBWidgetMixin(SIBBase) {
  get defaultWidget() {
    return 'sib-form-label-text';
  }

  //Special case of the dropdown
  getWidget(field) {
    if (
      !this.hasAttribute('widget-' + field) &&
      this.hasAttribute('range-' + field)
    )
      return 'sib-form-dropdown';
    else return super.getWidget(field);
  }

  async widgetAttributes(field) {
    let attributes = await super.widgetAttributes(field);
    if (this.hasAttribute('range-' + field))
      attributes.range = this.getAttribute('range-' + field);
    if (this.hasAttribute('label-' + field))
      attributes.label = this.getAttribute('label-' + field);
    return attributes;
  }

  //form submission handling
  get value() {
    const values = {};
    this.widgets.forEach(({name, value}) => {
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });
    return values;
  }

  async save(resource) {
    await store.save(resource, this.resource['@id']);
    this.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: { resource: resource },
      }),
    );
  }

  change(resource) {}
  submitForm(event) {
    event.preventDefault();
    const resource = this.value;
    if (!this.isContainer) resource['@id'] = this.resource['@id'];
    resource['@context'] = this.context;
    this.save(resource);

    if (!this.next) return false;

    this.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource: resource },
      }),
    );
  }

  inputChange(event) {
    const resource = this.value;
    if (!this.isContainer) resource['@id'] = this.resource['@id'];
    this.change(resource);
  }

  createInput(type) {
    const input = document.createElement('input');
    input.type = type;
    return input;
  }

  empty() {
    if (!this.form) return;
    while (this.form.firstChild) {
      this.form.removeChild(this.form.firstChild);
    }
  }

  async populate() {
    const isNaked = this.hasAttribute('naked');
    if (!this.form) {
      if (isNaked) {
        this.form = this;
      } else {
        this.form = document.createElement('form');
        this.form.addEventListener('submit', this.submitForm.bind(this));
        this.form.addEventListener('input', this.inputChange.bind(this));
        this.form.addEventListener('reset', () =>
          setTimeout(this.inputChange.bind(this)),
        );
        this.appendChild(this.form);
      }
    }
    await Promise.all(this.fields.map(field => this.appendWidget(field, this.form)));

    if (isNaked) return;
    this.form.appendChild(this.createInput('submit'));
    if (this.hasAttribute('reset')) {
      this.form.appendChild(this.createInput('reset'));
    }
  }

  createMultipleWrapper(field, attributes, parent = null) {
    const wrapper = document.createElement('sib-multiple');
    this.wrappers[field] = wrapper;
    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.type = "button";
    addButton.addEventListener('click', () => {
      delete attributes.value;
      this.insertSingleElement(field, attributes);
    });
    if (parent) parent.appendChild(wrapper);
    wrapper.appendChild(addButton);
    return wrapper;
  }

  createSingleElement(field, attributes) {
    const childWrapper = document.createElement("div");
    childWrapper.appendChild(super.createSingleElement(field, attributes));

    const removeButton = document.createElement('button');
    removeButton.textContent = '×';
    removeButton.type = "button";
    removeButton.addEventListener('click', () => {
      childWrapper.remove();
    });
    childWrapper.appendChild(removeButton);
    return childWrapper;
  }

  insertSingleElement(field, attributes) {
    const element = this.createSingleElement(field, attributes);
    const wrapper = this.wrappers[field];
    wrapper.insertBefore(element, wrapper.lastChild);
    wrapper.widgets.push(element.firstChild);
    return element.firstChild;
  }
}

customElements.define('sib-form', SIBForm);
