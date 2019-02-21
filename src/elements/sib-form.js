import { SIBWidgetMixin } from '../mixins/index.js';
import { SIBBase } from '../parents/index.js';
import { store } from '../store.js';

export default class SIBForm extends SIBWidgetMixin(SIBBase) {
  constructor() {
    super();
    this.widgets = [];
  }

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
  setValue(data, namelist, value) {
    const name = namelist.shift();
    if (!(name in data)) data[name] = {};
    if (namelist.length) this.setValue(data[name], namelist, value);
    else data[name] = value;
  }

  getValues() {
    const values = {};

    this.widgets.forEach(({name, value}) => {
      try {
        value = JSON.parse(widget.value);
      } catch (e) {}
      this.setValue(values, name.split('.'), value);
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
    const resource = this.getValues();
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
    const resource = this.getValues();
    if (!this.isContainer) resource['@id'] = this.resource['@id'];
    this.change(resource);
  }

  createInput(type) {
    const input = document.createElement('input');
    input.type = type;
    return input;
  }

  empty() {
    this.widgets.length = 0;
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
    for (let field of this.fields) {
      this.widgets.push(...(await this.appendWidget(field, this.form)));
    }

    if (isNaked) return;
    this.form.appendChild(this.createInput('submit'));
    if (this.hasAttribute('reset')) {
      this.form.appendChild(this.createInput('reset'));
    }
  }
}

customElements.define('sib-form', SIBForm);
