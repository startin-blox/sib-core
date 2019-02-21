import { base_context, store } from '../../store.js';

export default class {
  static get attrs() {
    return ['sib-container-uri'];
  }

  attached() {
    this._container = null;

    const rootElement = this.querySelector('[sib-container-repeat]');
    this.baseElement = rootElement.cloneNode(true);

    this.repeatElement = this.querySelector("slot[name='sib-container-repeat']");
    this.repeatElement.innerHTML = '';

    if (this.sibContainerUri) {
      store.get(this.sibContainerUri, base_context).then(async container => {
        console.log({ container });
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
      if (oldElement && !mappedContainer[key]) {
        oldElement.remove();
      } else {
        const element = this.baseElement.cloneNode(true);
        const attribute = element.getAttribute('sib-container-repeat');
        element.setAttribute(attribute, key);
        element.setAttribute('slot', 'sib-container-repeat');
        // this.repeatElement.insertAdjacentElement('beforeend', element);
        this.repeatElement.appendChild(element);
      }
      this.valueChanged(key, mappedContainer[key], oldContainer[key]);
    });
  }
}
