import { SIBMultipleWidget } from '../../parents/index.js';

export default class SIBFormMultipleValue extends SIBMultipleWidget {
  getTemplate(item, index) {
    return `<div
      id="id-${this.name}-${index}-box"
      class="${this.tagName}-box"
    >
      <input
        id="id-${this.name}-${index}"
        class="${this.tagName}-input"
        type="text"
        value='${item['@id'] || ''}'
        onclick="this.closest('${this.tagName}').updateValue()"
      >
      <button type="button"
        onclick="this.closest('${
  this.tagName
}').removeField(${index});return false"
      >&times;</button>
    </div>`;
  }

  appendField() {
    const index = this.querySelectorAll(`.${this.tagName}-box`).length;
    const templateElement = document.createElement('template');
    templateElement.innerHTML = this.getTemplate({}, index);
    const { content } = templateElement;
    [...content.querySelectorAll('select')].forEach((input) => {
      input.value = null; // eslint-disable-line no-param-reassign
    });
    this.parent.appendChild(content);
    this.updateValue();
  }

  removeField(index) {
    document.getElementById(`id-${this.name}-${index}-box`).remove();
    this.updateValue();
  }

  get appendTemplate() {
    return `<button type="button"
      onclick="this.closest('${this.tagName}').appendField();return false"
    >+</button>
    <input
      type="hidden"
      id="id-${this.name}"
      name="${this.name}"
    >`;
  }

  updateValue() {
    const valueList = Array.prototype.map.call(
      this.querySelectorAll(`.${this.tagName}-input`),
      input => `{"@id": "${input.value}"}`,
    );
    this.appendBox.querySelector('input').value = `[${valueList.join(',')}]`;
  }

  render() {
    super.render();
    this.parent.id = this.id;
    this.appendBox = document.createElement('div');
    this.appendBox.innerHTML = this.appendTemplate;
    this.appendChild(this.appendBox);
    this.updateValue();
  }
}
customElements.define('sib-form-multiple-value', SIBFormMultipleValue);
