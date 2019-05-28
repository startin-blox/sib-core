import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { store } from '../libs/store/store.js';
import { setDeepProperty } from '../libs/helpers.js';

const SibForm = {
  name: 'sib-form',
  use: [WidgetMixin, StoreMixin],
  attributes: {
    naked: {
      type: String,
      default: null
    }
  },
  initialState: {
    formInitialized: false
  },
  get defaultWidget() {
    return 'sib-form-label-text';
  },
  get defaultMultipleWidget() {
    return 'sib-multiple-form';
  },
  get value() {
    const values = {};
    this.widgets.forEach(({name, value}) => {
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });

    if (this.resource && !this.isContainer()) values['@id'] = this.resource['@id'];
    return values;
  },
  set value(value) {
    this.widgets.forEach(el => {
      try {
        if(value[el.name]) el.value = value[el.name]
      } catch (e) {}
    });
  },
  get form() {
    return this.naked == null ? this.element.querySelector('form') : this.element;
  },
  getWidget(field: string) {
    if (!this.element.hasAttribute('widget-' + field)
      && this.element.hasAttribute('range-' + field)) {
      return 'sib-form-dropdown';
    } else {
      const widget = this.element.getAttribute('widget-' + field); // TODO : duplicated code
      if (widget) {
        if (!customElements.get(widget)) {
          console.warn(`The widget ${widget} is not defined`);
        }
        return widget;
      }
      return this.defaultWidget;
    }
  },
  change(resource) {
    this.element.dispatchEvent(
      new CustomEvent('formChange', {
        bubbles: true,
        detail: { resource },
      }),
    );
  },
  async save() {
    this.toggleLoaderHidden(false);
    this.hideError();
    const resource = this.value;
    resource['@context'] = this.context;
    let saved;
    try {
      saved = await store.save(resource, this.resource['@id']);
    } catch (e) {
      this.toggleLoaderHidden(true);
      this.showError(e);
      throw e;
    }
    this.element.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: { resource },
      }),
    );
    this.toggleLoaderHidden(true);
    return saved;
  },
  async submitForm() {
    const isCreation = !('@id' in this.value);
    let id;
    try {
      id = await this.save();
    } catch (e) { return }
    if (isCreation && this.form !== this) this.form.reset(); // we reset the form only in creation mode
    if (!this.next) return;
    this.element.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource: {'@id': id} },
      }),
    );
  },
  inputChange() {
    const resource = this.value; // TODO : fix this
    if (!this.isContainer()) resource['@id'] = this.resource['@id'];
    this.change(resource); // TODO : fix this
  },
  createInput(type) {
    const input = document.createElement('input');
    input.type = type;
    return input;
  },
  empty() {
    if (!this.form) return;
    while (this.form.firstChild) {
      this.form.removeChild(this.form.firstChild);
    }
  },
  showError(e: object) {
    let errorContent = `
      <p>An error has occured.</p>
      <ul>
    `;
    Object.keys(e['error']).forEach(field => (
      errorContent += !field.startsWith('@') ? // remove @context object
        `<li>${field}: ${e['error'][field]}</li>` : ''
    ));
    errorContent += '</ul>';

    const error = document.createElement('div');
    error.setAttribute('data-id', 'form-error');
    error.innerHTML = errorContent;
    this.element.insertBefore(error, this.form);
  },
  hideError() {
    const error = this.element.querySelector('[data-id=form-error]');
    if (error) this.element.removeChild(error);
  },
  async populate() {
    if (!this.formInitialized) {
      if (this.naked == null) {
        const form = document.createElement('form');
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          this.submitForm();
        });
        form.addEventListener('reset', event =>
          setTimeout(() => this.inputChange(event)),
        );
        this.element.appendChild(form);
      }
      this.element.addEventListener('input', event => this.inputChange(event));
      this.formInitialized = true;
    }

    await Promise.all(this.fieldsWidget.map(field => this.appendWidget(field, this.form)));

    if (this.naked !== null) return;
    this.form.appendChild(this.createInput('submit'));
    if (this.element.hasAttribute('reset')) {
      this.form.appendChild(this.createInput('reset'));
    }
  }
};

export default Sib.register(SibForm);