import { SIBWidgetMixin } from '../mixins/index.js';
import { SIBBase } from '../parents/index.js';
import { store } from '../store.js';
import { setDeepProperty } from "../helpers/index.js";

export default class SIBForm extends SIBWidgetMixin(SIBBase) {
  get defaultWidget() {
    return 'sib-form-label-text';
  }

  get defaultMultipleWidget() {
    return 'sib-multiple-form';
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

  //form submission handling
  get value() {
    const values = {};
    this.widgets.forEach(({name, value}) => {
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });

    if (this.resource && !this.isContainer) values['@id'] = this.resource['@id'];
    return values;
  }
  set value(value) {
    this.widgets.forEach(el => {
      try {
        if(value[el.name]) el.value = value[el.name]
      } catch (e) {}
    });
  }

  async save(resource) {
    this.toggleLoaderHidden(false);
    let saved;
    try {
      saved = await store.save(resource, this.resource['@id']);
    } catch (e) { 
      this.toggleLoaderHidden(true); 
    }
    this.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: { resource },
      }),
    );
    this.toggleLoaderHidden(true);
    if (!resource['@id'] && this.form) this.form.reset() // we reset the form only in creation mode
    return saved;
  }
  change(resource) { }
  async submitForm() {
    const resource = this.value;
    resource['@context'] = this.context;
    const saved = this.save(resource);
    if (!this.next) return;
    const id = await saved;
    resource['@id'] = id;
    this.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource },
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
        this.form.addEventListener('submit', (event) => {
          event.preventDefault();
          this.submitForm();
        });
        this.form.addEventListener('reset', event =>
        setTimeout(() => this.inputChange(event)),
        );
        this.appendChild(this.form);
      }
      this.addEventListener('input', event => this.inputChange(event));
    }

    await Promise.all(this.fields.map(field => this.appendWidget(field, this.form)));

    if (isNaked) return;
    this.form.appendChild(this.createInput('submit'));
    if (this.hasAttribute('reset')) {
      this.form.appendChild(this.createInput('reset'));
    }
  }
}

customElements.define('sib-form', SIBForm);
