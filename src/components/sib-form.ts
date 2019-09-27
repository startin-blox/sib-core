import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { store } from '../libs/store/store.js';
import { setDeepProperty } from '../libs/helpers.js';

export const SibForm = {
  name: 'sib-form',
  use: [WidgetMixin, StoreMixin],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'sib-form-label-text'
    },
    naked: {
      type: String,
      default: null
    },
    submitButton: {
      type: String,
      default: null
    },
    partial: {
      type: Boolean,
      default: null
    }
  },
  initialState: {
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
  async getFormValue() {
    let value = this.value;
    if (this.resource && !(await this.resource.isContainer())) value['@id'] = this.resourceId;
    return value
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
    const resource = await this.getFormValue();
    resource['@context'] = this.context;
    let saved: object = {};
    try {
      if (this.partial == null) {
      saved = resource['@id'] ?
        await store.put(resource, this.resourceId) :
        await store.post(resource, this.resourceId);
      } else {
        saved = await store.patch(this.resourceId, resource);
      }
    } catch (e) {
      this.toggleLoaderHidden(true);
      if (e.error) { // if server error
        this.showError(e);
        throw e;
      } // else, ldpframework error, we continue
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
    const isCreation = !('@id' in (await this.getFormValue()));
    let id;
    try {
      id = await this.save() || this.getFormValue()['@id'];
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
  async inputChange(): Promise<void> {
    this.change(await this.getFormValue());
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

    const promises: Promise<Element>[] = [];
    for (const field of await this.getFields()) {
      promises.push(this.createWidget(field));
    }
    while (form.firstChild) {
      form.removeChild(form.firstChild);
    }
    await Promise.all(promises).then(elements =>
      elements.forEach(element => form.appendChild(element)),
    );

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