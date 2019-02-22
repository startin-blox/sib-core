
export default class {
  static get attrs() {
    return ['sib-container-uri'];
  }

  created() {
    const repeatedElement = this._template.querySelector('[sib-container-repeat]');
    this.repeatedElement = repeatedElement.cloneNode(true);
    this.addEventListener('dataChanged:sibContainerUri', (event) => {
      const { detail } = event;
      if (detail.value && detail.value !== detail.oldValue) {
        this.store.get(detail.value).then(container => {
          this.container = container || [];
        });
      }
    });
  }

  attached() {
    this._container = [];

    this.containerElement = this.el.querySelector("slot[name='sib-container-repeat']");
    this.containerElement.innerHTML = '';
  }

  get container() {
    return this._container;
  }

  set container(container) {
    const oldContainer = [ ...this._container ];
    this._container = container;

    const keys = new Set([...oldContainer, ...container]);

    keys.forEach((key) => {
      const oldElement = this.el.querySelector(`[sib-resource-uri="${key}"]`);
      if (oldElement && container.indexOf(key) < 0) {
        oldElement.remove();
      } else if (!oldElement) {
        const element = this.repeatedElement.cloneNode(true);
        const attribute = element.getAttribute('sib-container-repeat');
        element.setAttribute(attribute, key);
        element.setAttribute('slot', 'sib-container-repeat');
        this.containerElement.appendChild(element);
      }
    });
  }
}
