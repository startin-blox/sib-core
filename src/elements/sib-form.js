import { SIBWidgetMixin } from '../mixins/index.js';
import { SIBBase } from '../parents/index.js';
import { store } from '../store.js';

export default class SIBForm extends SIBWidgetMixin(SIBBase) {
  // eslint-disable-next-line class-methods-use-this
  get defaultWidget() {
    return 'sib-form-label-text';
  }

  // Special case of the dropdown
  getWidget(field) {
    if (
      !this.hasAttribute(`widget-${field}`)
      && this.hasAttribute(`range-${field}`)
    ) return 'sib-form-dropdown';
    return super.getWidget(field);
  }

  async widgetAttributes(field) {
    const attributes = await super.widgetAttributes(field);
    if (this.hasAttribute(`range-${field}`)) attributes.range = this.getAttribute(`range-${field}`);
    if (this.hasAttribute(`label-${field}`)) attributes.label = this.getAttribute(`label-${field}`);
    return attributes;
  }

  // form submission handling
  setValue(data, namelist, value) {
    /* eslint-disable no-param-reassign */
    const name = namelist.shift();
    if (!(name in data)) data[name] = {};
    if (namelist.length) this.setValue(data[name], namelist, value);
    else data[name] = value;
    /* eslint-enable no-param-reassign */
  }

  formToObject(form) {
    return [].reduce.call(
      form.elements,
      (data, element) => {
        let value;
        try {
          value = JSON.parse(element.value);
        } catch (error) {
          ({ value } = element);
        }
        this.setValue(data, element.name.split(','), value);
        return data;
      },
      {},
    );
  }

  async save(resource) {
    await store.save(resource, this.resource['@id']);
    this.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: { resource },
      }),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  change() {
    //
  }

  submitForm(event) {
    event.preventDefault();
    const resource = this.formToObject(this.form);
    if (!this.isContainer) resource['@id'] = this.resource['@id'];
    resource['@context'] = this.context;
    this.save(resource);

    if (!this.next) return false;

    this.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource },
      }),
    );

    return true;
  }

  inputChange() {
    const resource = this.formToObject(this.form);
    if (!this.isContainer) resource['@id'] = this.resource['@id'];
    this.change(resource);
  }

  // eslint-disable-next-line class-methods-use-this
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
    if (!this.form) {
      this.form = document.createElement('form');
      this.form.addEventListener('submit', this.submitForm.bind(this));
      this.form.addEventListener('input', this.inputChange.bind(this));
      this.form.addEventListener('reset', () => setTimeout(this.inputChange.bind(this)));
      this.appendChild(this.form);
    }

    const results = [];

    this.fields.forEach((field) => {
      field.push(this.appendWidget(field, this.form));
    });

    await Promise.all(results);

    this.form.appendChild(this.createInput('submit'));
    if (this.hasAttribute('reset')) {
      this.form.appendChild(this.createInput('reset'));
    }
  }
}

customElements.define('sib-form', SIBForm);
