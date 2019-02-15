import SIBBase from './SIBBase.js';

export default class SIBElement extends SIBBase {
  get template() {
    return '';
  }

  getTemplate() {
    const templateSelector = this.getAttribute('template-selector');
    if (templateSelector) {
      return document.querySelector(templateSelector).content.cloneNode(true);
    }

    const template = document.createElement('template');
    template.innerHTML = this.template;
    return template.content;
  }

  render() {
    this.appendChild(this.getTemplate());

    this.querySelectorAll('[sib-value]').forEach((domElement) => {
      const propName = domElement.getAttribute('sib-value');

      this.addWatcher(propName, (newValue, oldValue) => {
        domElement.textContent = newValue;
      });

      domElement.textContent = this.getAttribute(propName);
    });
  }

  attached() {
    this.render();
  }
}
