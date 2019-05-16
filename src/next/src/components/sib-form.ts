import { Sib } from '../Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';
import { store } from '../store.js';
import { setDeepProperty } from '../helpers/index.js';

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
    const resource = this.value;
    resource['@context'] = this.context;
    let saved;
    try {
      saved = await store.save(resource, this.resource['@id']);
    } catch (e) {
      this.toggleLoaderHidden(true);
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
    const saved = this.save();
    if (isCreation && this.form) this.form.reset(); // we reset the form only in creation mode
    if (!this.next) return;
    const id = await saved;
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

    await Promise.all(this.fields.map(field => this.appendWidget(field, this.form)));

    if (this.naked !== null) return;
    this.form.appendChild(this.createInput('submit'));
    if (this.element.hasAttribute('reset')) {
      this.form.appendChild(this.createInput('reset'));
    }
  }
};

export default Sib.register(SibForm);