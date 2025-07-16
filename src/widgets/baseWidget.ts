import { evalTemplateString } from '../libs/helpers.ts';
import { store } from '../libs/store/store.ts';

export class BaseWidget extends HTMLElement {
  private src: string | undefined;
  private multiple: string | undefined;
  private editable: string | undefined;
  private required: string | undefined;
  private resourceId: string | undefined;
  public _value: any | undefined;
  private _range: any | undefined;
  private _context: object | undefined;
  private _subscriptions = new Map();

  connectedCallback(): void {
    this.render();
  }
  disconnectedCallback(): void {
    for (const subscription of this._subscriptions.values()) {
      PubSub.unsubscribe(subscription);
    }
  }
  async render() {
    this.innerHTML = await evalTemplateString(this.template, {
      src: this.src,
      name: this.name,
      label: this.label,
      placeholder: this.placeholder,
      value: this.value,
      id: this._value?.['@id'] || '',
      escapedValue: this.escapedValue,
      range: await this.htmlRange,
      multiple: this.multiple,
      editable: this.editable === '',
      required: this.required === '',
    });

    this.addEditButtons();
    this.initChangeEvents();
  }
  get label(): string | null {
    return this.hasAttribute('label') ? this.getAttribute('label') : this.name;
  }
  set label(label: string | null) {
    if (label != null) this.setAttribute('label', label);
    this.render();
  }
  get placeholder(): string | null {
    return this.hasAttribute('placeholder')
      ? this.getAttribute('placeholder')
      : this.label;
  }
  set placeholder(placeholder: string | null) {
    if (placeholder != null) this.setAttribute('placeholder', placeholder);
    this.render();
  }
  get name(): string | null {
    return this.getAttribute('name');
  }
  set name(name: string | null) {
    if (name) this.setAttribute('name', name);
    this.render();
  }
  get value() {
    if (this.dataHolder) {
      const values = this.dataHolder.map(element => {
        if (element instanceof HTMLInputElement && element.type === 'checkbox')
          return element.checked;
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
    if (this._value == null) return;

    if (this.dataHolder && this.dataHolder.length === 1) {
      // if one dataHolder in the widget...
      const element = this.getValueHolder(this.dataHolder[0]);
      if (element.type === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value; // ... set `value` to the dataHolder element
      }
      // remove when https://git.happy-dev.fr/startinblox/framework/sib-core/issues/426 fixed
      if (element.dispatchEvent) element.dispatchEvent(new Event('change')); // trigger change manually
    } else if (this.dataHolder && this.dataHolder.length > 1) {
      // if multiple dataHolder in the widget ...
      this.dataHolder.forEach((el, index) => {
        const element = this.getValueHolder(el);
        if (element.type === 'checkbox') {
          element.checked = value ? value[index] : '';
        } else {
          element.value = value ? value[index] : '';
        }
        element.dispatchEvent(new Event('change')); // trigger change manually
      }); // ... set each `value` to each dataHolder element
    }

    this.render();
  }
  get 'each-label'(): string {
    return this.getAttribute('each-label') || '';
  }
  set 'each-label'(label: string) {
    this.setAttribute('each-label', label);
  }
  set 'add-label'(label: string) {
    this.setAttribute('add-label', label);
  }
  set 'remove-label'(label: string) {
    this.setAttribute('remove-label', label);
  }
  get dataHolder(): Element[] | null {
    const widgetDataHolders = Array.from(
      this.querySelectorAll('[data-holder]'),
    ).filter(element => {
      const dataHolderAncestor = element.parentElement
        ? element.parentElement.closest('[data-holder]')
        : null;
      // get the dataHolder of the widget only if no dataHolder ancestor in the current widget
      return (
        dataHolderAncestor === this ||
        !dataHolderAncestor ||
        !this.contains(dataHolderAncestor)
      );
    });

    return widgetDataHolders.length > 0 ? widgetDataHolders : null;
  }
  get template(): string {
    return '';
  }
  get childTemplate(): string {
    return '';
  }
  get escapedValue(): string {
    return `${this.value}`
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
    return this.fetchSources(this._range);
  }
  set range(range) {
    (async () => {
      this._listen(range, async () => {
        this._range = await store.getData(range, this.context);
      });
      this._range = await store.getData(range, this.context);
      this.render();
    })();
  }
  async fetchSources(resource: any) {
    const data = await resource['listPredicate'];
    if (!data) return null;
    const resources: any[] = [];
    let index = 0;
    for (let res of data) {
      if (!res) {
        // child not in cache yet
        try {
          const resourceId = data[index]['@id'];
          res = await store.getData(resourceId, this.context);
        } catch {
          continue;
        }
      }
      if (res.isContainer?.()) {
        // if nested container
        const resourcesFromContainer = await store.getData(
          res['@id'],
          this.context,
        ); // fetch the datas
        this._listen(res['@id']);
        if (resourcesFromContainer) {
          resources.push(...(await resourcesFromContainer['listPredicate']));
        }
      } else {
        resources.push(res);
      }
      index++;
    }
    return resources;
  }

  async htmlRange(): Promise<string | undefined> {
    let htmlRange = '';
    const rangeResources = await this.range;
    if (!rangeResources) return;
    for await (let element of rangeResources) {
      element = await store.getData(element['@id'], this.context); // fetch the resource to display the name
      this._listen(element['@id']);

      let selected: boolean;
      if (this._value?.isContainer?.()) {
        // selected options for multiple select
        selected = false;
        const listPredicate = await this._value['listPredicate'];
        for await (const value of listPredicate) {
          if (value['@id'] === element['@id']) {
            selected = true;
            break;
          }
        }
      } else {
        // selected options for simple dropdowns
        selected = this._value ? this._value['@id'] === element['@id'] : false;
      }
      htmlRange += await evalTemplateString(this.childTemplate, {
        name: await element.name,
        id: element['@id'],
        selected: selected,
      });
    }
    return htmlRange || '';
  }
  getValueHolder(element) {
    return element.component ? element.component : element;
  }

  subscribe(event: string) {
    this._listen(event);
  }

  _listen(id: string, callback: Function = () => {}) {
    if (!this._subscriptions.get(id)) {
      this._subscriptions.set(
        id,
        PubSub.subscribe(id, async () => {
          await callback();
          this.render();
        }),
      );
    }
  }

  // Editable widgets
  addEditButtons(): void {
    const editableField = this.querySelector('[data-editable]') as HTMLElement;

    if (editableField) {
      // Add edit button
      const editButton = document.createElement('button');
      editButton.innerText = 'Modifier';
      editButton.onclick = () =>
        this.activateEditableField(editableField, editButton);
      editableField.insertAdjacentElement('afterend', editButton);

      // Save on focusout
      editableField.addEventListener('focusout', () =>
        this.save(editableField, editButton),
      );
    }
  }
  activateEditableField(
    editableField: HTMLElement,
    editButton: HTMLButtonElement,
  ): void {
    editableField.setAttribute('contenteditable', 'true');
    editableField.focus();
    editButton.setAttribute('disabled', 'disabled');
  }
  /**
   * Dispatch change events of data holders from the current widget
   */
  initChangeEvents(): void {
    if (this.dataHolder) {
      const event = new Event('change', { bubbles: true });
      for (const element of this.dataHolder) {
        element.addEventListener('change', e => {
          e.preventDefault();
          e.stopPropagation();
          this.dispatchEvent(event);
        });
      }
    }
  }
  save(editableField: HTMLElement, editButton: HTMLButtonElement): void {
    editableField.setAttribute('contenteditable', 'false');
    editButton.removeAttribute('disabled');

    if (!this.name) return;
    const resource = {};
    resource[this.name] = editableField.innerText;
    resource['@context'] = this.context;

    if (this.resourceId && resource) store.patch(resource, this.resourceId);
  }
}
