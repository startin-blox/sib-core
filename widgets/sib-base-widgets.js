class SIBWidget extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    this.innerHTML = this.template;
  }
  get label() {
    return this.getAttribute('label') || this.name;
  }
  set label(label) {
    this.setAttribute('label', label);
    this.render();
  }
  get name() {
    return this.getAttribute('name');
  }
  set name(name) {
    this.setAttribute('name', name);
    this.render();
  }
  get value() {
    return this._value || '';
  }
  set value(value) {
    this._value = value;
    this.render();
  }
  get escapedValue() {
    return ('' + this.value)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }
}

const SIBAsochronousResourceWidgetMixin = superclass =>
  class extends superclass {
    render() {
      store.get(this.value).then(value => {
        this._value = value;
        this.innerHTML = this.template;
      });
    }
  };

class SIBMultipleWidget extends SIBWidget {
  get parentTag() {
    return 'div';
  }
  get labelTemplate() {
    if (!this.id) this.id = uniqID();
    return `<label for="${this.id}">${this.label}</label>`;
  }
  emptyList() {
    while (this.parent.firstChild)
      this.parent.removeChild(this.parent.firstChild);
  }
  renderList() {
    this.emptyList();
    //add one instance of the template per item in the value array
    console.log('value', this.value);
    console.log('values', this.values);
    this.parent.innerHTML = this.values.map(this.getTemplate, this).join('');
  }
  render() {
    this.innerHTML = this.labelTemplate;
    this.parent = document.createElement(this.parentTag);
    this.parent.setAttribute('name', this.name);
    this.appendChild(this.parent);
    this.renderList();
  }
  get values() {
    if (!this.value) return [];
    let value = this.value;
    if ('ldp:contains' in value) value = value['ldp:contains'];
    if (!Array.isArray(value)) value = [value];
    return value;
  }
}
