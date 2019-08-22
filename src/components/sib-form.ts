import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { store } from '../libs/store/store.js';
import { setDeepProperty } from '../libs/helpers.js';

export const SibForm = {
  name: 'sib-form',
  use: [WidgetMixin, StoreMixin],
  attributes: {
    naked: {
      type: String,
      default: null
    },
    submitButton: {
      type: String,
      default: null
    }
  },
  initialState: {
  },
  get defaultWidget(): string {
    return 'sib-form-label-text';
  },
  get defaultMultipleWidget(): string {
    return 'sib-multiple-form';
  },
  get defaultSetWidget(): string {
    return 'sib-set-default';
  },
  get value(): object {
    const values = {};
    this.widgets.forEach(({name, value}) => {
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });

    if (this.resource && !this.isContainer()) values['@id'] = this.resource['@id']; // TODO : fix is container here
    return values;
  },
  set value(value) {
    this.widgets.forEach(el => {
      try {
        if(value[el.name]) el.value = value[el.name]
      } catch (e) {}
    });
  },
  get form(): Element {
    if (this._form) return this._form;
    if (this.isNaked) return this.element;
    this._form = document.createElement('form');
    this.element.appendChild(this._form);
    return this._form;
  },
  get isNaked(): boolean {
    return this.element.hasAttribute('naked');
  },
  getWidget(field: string): string {
    if (!this.element.hasAttribute('widget-' + field)
      && this.element.hasAttribute('upload-url-' + field)) {
      return 'sib-form-file';
    } else if (!this.element.hasAttribute('widget-' + field)
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
  change(resource: object): void {
    this.element.dispatchEvent(
      new CustomEvent('formChange', {
        bubbles: true,
        detail: { resource },
      }),
    );
  },
  async save(): Promise<object> {
    this.toggleLoaderHidden(false);
    this.hideError();
    const resource = this.value;
    resource['@context'] = this.context;
    let saved: object = {};
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
  async submitForm(): Promise<void> {
    const isCreation = !('@id' in this.value);
    let id;
    try {
      id = await this.save() || this.value['@id'];
    } catch (e) { return }
    if (isCreation && this.form !== this) this.reset(); // we reset the form only in creation mode
    if (!this.next) return;
    this.element.dispatchEvent(
      new CustomEvent('requestNavigation', {
        bubbles: true,
        detail: { route: this.next, resource: {'@id': id} },
      }),
    );
  },
  inputChange(): void {
    const resource = this.value; // TODO : fix this
    if (!this.isContainer()) resource['@id'] = this.resource['@id'];
    this.change(resource); // TODO : fix this
  },
  createInput(type: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    return input;
  },
  empty(): void {
    if (!this.form) return;
    if (this.isNaked) {
      while (this.form.firstChild) {
        this.form.removeChild(this.form.firstChild);
      }
    } else {
      let newForm = document.createElement('form');
      this.element.appendChild(newForm);
      this.element.removeChild(this._form);
      this._form = newForm;
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
  reset() {
    if(!this.isNaked) this.form.reset();
    this.form.querySelectorAll('select[multiple]').forEach((select: HTMLSelectElement) => { // reset multiple select
      const options = select.querySelectorAll('option:checked') as NodeListOf<HTMLOptionElement>;
      options.forEach(option => option.selected = false );
      select.dispatchEvent(new Event('change'));
    })
  },
  async populate(): Promise<void> {
    const form = this.form;
    if (!this.isNaked) {
      form.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        this.submitForm();
      });
      form.addEventListener('reset', (event: Event) =>
        setTimeout(() => this.inputChange(event)),
      );
      this.element.appendChild(form);
    }
    this.element.addEventListener('input', (event: Event) => this.inputChange(event));

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.fieldsWidget.length; i++) {
      const field = this.fieldsWidget[i];
      await this.appendWidget(field, fragment);
    }
    while (form.firstChild) {
      form.removeChild(form.firstChild);
    }
    form.appendChild(fragment);

    if (this.isNaked) return;
    const submitButtonElement = this.createInput('submit');
    if (this.submitButton) submitButtonElement.value = this.submitButton;
    form.appendChild(submitButtonElement);
    if (this.element.hasAttribute('reset')) {
      form.appendChild(this.createInput('reset'));
    }
  }
};

Sib.register(SibForm);