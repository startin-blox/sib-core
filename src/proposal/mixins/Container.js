import { base_context, store } from '../../store.js';

export default class {
  static get attrs() {
    return ['sib-container-uri'];
  }

  attached() {
    this._container = null;

    const rootElement = this.querySelector('[sib-container-repeat]');
    this.baseElement = rootElement.cloneNode(true);
    this.repeatElement = document.createElement('div');
    rootElement.replaceWith(this.repeatElement);

    if (this.sibContainerUri) {
      store.get(this.sibContainerUri, base_context).then(async container => {
        this.container = container['ldp:contains'] || [];
      });
    }

    this.watch('sibContainerUri', (newValue) => {
      store.get(newValue, base_context).then(async container => {
        this.container = container['ldp:contains'] || [];
      });
    });
  }

  get container() {
    return this._container;
  }

  set container(container) {
    const oldContainer = { ...this._container };
    const mappedContainer = {};

    container.forEach((resource) => {
      const id = resource['@id'];
      if (id) {
        mappedContainer[id] = resource;
      }
    });

    this._container = mappedContainer;

    const keys = new Set([...Reflect.ownKeys(mappedContainer), ...Reflect.ownKeys(oldContainer)]);

    keys.forEach((key) => {
      const oldElement = this.querySelector(`[sib-resource-uri="${key}"]`);
      console.log({key, oldElement, new: mappedContainer[key], old: oldContainer[key]});
      if (oldElement && !mappedContainer[key]) {
        oldElement.remove();
      } else {
        const element = this.baseElement.cloneNode(true);
        const attribute = element.getAttribute('sib-container-repeat');
        element.setAttribute(attribute, key);
        console.log({element, repeatElement: this.repeatElement});
        this.repeatElement.insertAdjacentElement('beforeend', element);
      }
      this.valueChanged(key, mappedContainer[key], oldContainer[key]);
    });
  }
}
