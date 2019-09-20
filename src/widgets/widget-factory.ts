import { evalTemplateString } from '../libs/helpers.js';
import { store } from '../libs/store/store.js';

export class BaseWidget extends HTMLElement {
  private src: string | undefined;
  private multiple: string | undefined;
  private editable: string | undefined;
  private resourceId: string | undefined;
  public _value: any | undefined;
  private _range: any | undefined;
  private _context: object | undefined;

  connectedCallback(): void {
    this.render();
  }
  async render() {
    this.innerHTML = await evalTemplateString(this.template, {
      src: this.src,
      name: this.name,
      label: this.label,
      value: this.value,
      id: (this.value && this.value['@id']) || '',
      escapedValue: this.escapedValue,
      range: await this.htmlRange,
      multiple: this.multiple,
      editable: this.editable === '' ? true : false,
    });

    this.addEditButtons();
  }
  get label(): string | null {
    return this.hasAttribute('label') ? this.getAttribute('label') : this.name;
  }
  set label(label: string | null) {
    if(label != null) this.setAttribute('label', label);
    this.render();
  }
  get name(): string | null {
    return this.getAttribute('name');
  }
  set name(name: string | null) {
    if(name) this.setAttribute('name', name);
    this.render();
  }
  get value() {
    if (this.dataHolder) {
      let values = this.dataHolder.map(element => {
        if (element instanceof HTMLInputElement && element.type == "checkbox") return element.checked;
        // if value is defined, push it in the array
        return this.getValueHolder(element).value;
      });
      // If only one value, do not return an array
      return values.length === 1 ? values[0] : values;
    }
    return this._value || '';
  }
  set value(value) {
    this._value = value; // ... store `value` in the widget
    if (!this.dataHolder) {
      // if no dataHolder in the widget...
      this.render();
    } else if (this.dataHolder.length === 1) {
      // if one dataHolder in the widget...
      const element = this.getValueHolder(this.dataHolder[0]);
      if (element.type == "checkbox") {
        element.checked = value;
      } else {
        element.value = value || ''; // ... set `value` to the dataHolder element
      }
      element.dispatchEvent(new Event('change')); // trigger change manually
    } else {
      // if multiple dataHolder in the widget ...
      this.dataHolder.forEach(
        (el, index) => {
          const element = this.getValueHolder(el);
          if (element.type == "checkbox") {
            element.checked = value ? value[index] : ''
          } else {
            element.value = value ? value[index] : ''
          }
          element.dispatchEvent(new Event('change')); // trigger change manually
        },
      ); // ... set each `value` to each dataHolder element
    }
  }
  get ['each-label'](): string{
    return this.getAttribute('each-label') || '';
  }
  set ['each-label'](label: string) {
    this.setAttribute('each-label', label);
  }
  set ['add-label'](label: string) {
    this.setAttribute('add-label', label);
  }
  set ['remove-label'](label: string) {
    this.setAttribute('remove-label', label);
  }
  get dataHolder(): Element[] | null {
    const widgetDataHolders = Array.from(this.querySelectorAll('[data-holder]')).filter(element => {
      const dataHolderAncestor = element.parentElement ? element.parentElement.closest('[data-holder]') : null;
      // get the dataHolder of the widget only if no dataHolder ancestor in the current widget
      return dataHolderAncestor === this || !dataHolderAncestor || !this.contains(dataHolderAncestor)
    });

    return widgetDataHolders.length ? widgetDataHolders : null;
  }
  get template(): string {
    return '';
  }
  get childTemplate(): string {
    return '';
  }
  get escapedValue(): string {
    return ('' + this.value)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }
  set context(value) {
    this._context = value;
  }
  get context() {
    return this._context || {};
  }

  get range(): any {
    return this._range ? this._range['ldp:contains'] : null;
  }
  set range(range) {
    (async () => {
      await store.initGraph(range, this.context);
      this._range = store.get(range);
      if (this._value && !(this._value.isContainer && await this._value.isContainer())) { // if value set and not a container
        this.value = `{"@id": "${this._value['@id']}"}`;
      }
      await this.render();
    })();
  }
  get htmlRange(): Promise<string|undefined> {
    return (async () => {
      let htmlRange = '';
      if (!this.range) return;
      for await (let element of this.range) {
        await store.initGraph(element['@id'], this.context); // fetch the resource
        element = store.get(element['@id']);

        let selected: boolean;
        if (this._value && this._value.isContainer && this._value.isContainer()) { // selected options for multiple select
          selected = false;
          for await (let value of this._value["ldp:contains"]) {
            if (value['@id'] == element['@id']) {
              selected = true;
              break;
            }
          }
        } else { // selected options for simple dropdowns
          selected = this._value == `{"@id": "${element['@id']}"}`;
        }
        htmlRange += await evalTemplateString(this.childTemplate, {
          name: (await element.name).toString(),
          id: element['@id'],
          selected: selected
        });
      }
      return htmlRange || '';
    })();
  }
  getValueHolder(element) {
    return element.component ? element.component : element;
  }

  // Editable widgets
  addEditButtons(): void {
    const editableField = this.querySelector('[data-editable]') as HTMLElement;

    if (editableField) {
      // Add edit button
      const editButton = document.createElement('button');
      editButton.innerText = "Modifier";
      editButton.onclick = () => this.activateEditableField(editableField, editButton);
      editableField.insertAdjacentElement('afterend', editButton);

      // Save on focusout
      editableField.addEventListener('focusout', () => this.save(editableField, editButton));
    }
  }
  activateEditableField(editableField: HTMLElement, editButton: HTMLButtonElement): void {
    editableField.setAttribute('contenteditable', 'true');
    editableField.focus();
    editButton.setAttribute("disabled", "disabled");
  }
  save(editableField: HTMLElement, editButton: HTMLButtonElement): void {
    editableField.setAttribute('contenteditable', 'false');
    editButton.removeAttribute("disabled");

    if (!this.name) return;
    const resource = {};
    resource[this.name] = editableField.innerText;
    resource['@context'] = this.context;

    if(this.resourceId && resource) store.patch(this.resourceId, resource)
  }
}

export const widgetFactory = (
  tagName: string,
  customTemplate: string,
  childTemplate: string = "",
  callback?: (x: any) => void,
) => {
  const registered = customElements.get(tagName);
  if (registered) return registered;
  const cls = class extends BaseWidget {
    async render() {
      await super.render();
      if (callback) callback(this);
    }
    get template(): string {
      return customTemplate;
    }
    get childTemplate(): string {
      return childTemplate;
    }
  };
  customElements.define(tagName, cls);
  return cls;
};
