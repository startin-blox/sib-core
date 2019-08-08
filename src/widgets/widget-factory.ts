import { evalTemplateString } from '../libs/helpers.js';
import { store } from '../libs/store/store.js';

export class BaseWidget extends HTMLElement {
  private src: string | undefined;
  private multiple: string | undefined;
  private editable: string | undefined;
  private resourceId: string | undefined;
  private _value: any | undefined;
  private _range: any | undefined;

  connectedCallback(): void {
    this.render();
  }
  render(): void {
    this.innerHTML = evalTemplateString(this.template, {
      src: this.src,
      name: this.name,
      label: this.label,
      value: this.value,
      id: (this.value && this.value['@id']) || '',
      escapedValue: this.escapedValue,
      range: this.htmlRange,
      multiple: this.multiple,
      editable: this.editable === '' ? true : false,
    });

    this.addEditButtons();
    this.initChangeEvents();
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
        if(element instanceof HTMLInputElement && element.type == "checkbox") return element.checked
        // if value is defined, push it in the array
        return JSON.stringify(this.getValueHolder(element).value) !== '{}'
          ? this.getValueHolder(element).value
          : this._value || '';
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

  get range(): any {
    if (!this._range) return [];
    if (!Array.isArray(this._range)) return [this._range];
    return this._range;
  }
  set range(range) {
    if (Array.isArray(range)) {
      this._range = range;
      this.render();
      if (Array.isArray(this.value)) this.value = this.value;
      else if (this._value) this.value = `{"@id": "${this._value['@id']}"}`;
      return;
    }
    store.list(range).then(list => (this.range = list));
  }
  get htmlRange(): string {
    if (!this.range.length) return '';
    let htmlRange = '';
    this.range.forEach(element => {
      let selected: boolean;
      if (Array.isArray(this.value)) {
        selected = !!this.value.some((e) => e['@id'] == element['@id'])
      } else {
        selected = this.value == `{"@id": "${element['@id']}"}`
      }
      htmlRange += evalTemplateString(this.childTemplate, {
        name: element.name,
        id: element['@id'],
        selected: selected
      });
    });
    return htmlRange || '';
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
  /**
   * Dispatch change events of data holders from the current widget
   */
  initChangeEvents(): void {
    if (this.dataHolder) {
      const event = new Event('change', { bubbles: true });
      this.dataHolder.forEach(element => {
        element.addEventListener('change', e => {
          e.preventDefault();
          e.stopPropagation();
          this.dispatchEvent(event);
        });
      });
    }
  }
  save(editableField: HTMLElement, editButton: HTMLButtonElement): void {
    editableField.setAttribute('contenteditable', 'false');
    editButton.removeAttribute("disabled");

    if (!this.name) return;
    const resource = {};
    resource[this.name] = editableField.innerText;

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
    render() {
      super.render();
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
