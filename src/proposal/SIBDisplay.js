import SIBComponent from './Core/Component.js';
import Container from './mixins/Container.js';
import Resource from './mixins/Resource.js';

export default class SIBDisplay extends SIBComponent {
  static get use() {
    return [
      // Container,
      Resource,
    ];
  }

  static get attrs() {
    return [
      'data-src',
      'data-fields',
    ];
  }

  static get selector() {
    return 'sib-display';
  }

  created() {
    if (!this.resourceOnly) {
      this.repeatedElement = this.template.cloneNode(true);
    }

    this.addEventListener('dataChanged:dataSrc', (event) => {
      const { detail } = event;
      if ('value' in detail && detail.value) {
        this.store.get(detail.value).then(resource => {
          console.log({resource, isArray: Array.isArray(resource)});
          if (Array.isArray(resource)) {
            this.dispatchEvent(new CustomEvent('dataChanged:sibContainerUri', {
              detail: event.detail,
              passive: true,
            }));
          } else {
            console.log('dispatch')
            this.dispatchEvent(new CustomEvent('dataChanged:sibResourceUri', {
              detail: event.detail,
              passive: true,
            }));
          }
        });
      }
    });
  }

  get defaultWidget() {
    return 'sib-display-div';
  }

  get childTag() {
    return this.dataset.child || this.tagName;
  }

  get template() {
    const template = document.createElement('div');

    const slot = document.createElement('slot');
    slot.setAttribute('name', 'sib-container-repeat');

    const item = document.createElement('sib-display');
    item.setAttribute('sib-container-repeat', 'sib-resource-uri');

    const fields = this.el.getAttribute('data-fields')
    if (fields) {
      fields.split(',')
      .map(item => item.trim())
      .forEach(field => {
        const fieldElement = this.el.getAttribute(`widget-${field}`) || this.defaultWidget;
        const el = document.createElement(fieldElement);
        el.toggleAttribute('sib-attribute');
        el.setAttribute('sib-attribute:data-value', field);
        item.appendChild(el);
      });
    }


    slot.appendChild(item);
    template.appendChild(slot);
    return slot;
  }
}

SIBDisplay.install();
