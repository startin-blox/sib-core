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

  get isNaked() {
    return this.hasAttribute('naked');
  }

  get form() {
    if (this._form) return this._form;
    if (this.isNaked) return this;
    this._form = document.createElement('form');
    this.appendChild(this._form);
    return this._form;
  }

  async save() {
    this.toggleLoaderHidden(false);
    const resource = this.value;
    resource['@context'] = this.context;
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
    return saved;
  }
  change(resource) { }
  async submitForm() {
    const isCreation = !('@id' in this.value);
    const saved = this.save();
    if (isCreation && this.form !== this) this.form.reset(); // we reset the form only in creation mode
    if (!this.next) return;
    const id = await saved || this.value['@id'];
    this.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource: {'@id': id} },
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
    if (this.isNaked) {
      while (this.form.firstChild) {
        this.form.removeChild(this.form.firstChild);
      }
    } else {
      let newForm = document.createElement('form');
      this.appendChild(newForm);
      this.removeChild(this._form);
      this._form = newForm;
    }
  }

  async populate() {
    const form = this.form;
    if (!this.isNaked) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.submitForm();
      });
      form.addEventListener('reset', event =>
      setTimeout(() => this.inputChange(event)),
      );
      this.appendChild(form);
    }
    this.addEventListener('input', event => this.inputChange(event));

    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i];
      await this.appendWidget(field, form);
    }

    if (this.isNaked) return;
    form.appendChild(this.createInput('submit'));
    if (this.hasAttribute('reset')) {
      form.appendChild(this.createInput('reset'));
    }
  }
}

customElements.define('sib-form', SIBForm);
