import caseSwitch from '../helpers/caseSwitch.js';

export default class State {
  constructor(component) {
    this.component = component;

    this._data = {};
    this.data = {};

    this.boot();
  }

  boot() {
    const data = this.component.data();
    Reflect.ownKeys(data).forEach((prop) => {
      this.follow(prop, data[prop]);
    });

    const attributes = this.component.constructor.getAttributes();

    attributes.forEach((attr) => {
      this.attribute(attr);
    });

    // when attribute change, throw a data changed event
    this.component.addEventListener('attributeChanged', (event) => {
      const { detail } = event;
      this.dispatchDataChangedEvent({
        prop: caseSwitch(detail.name),
        oldValue: detail.oldValue,
        value: detail.newValue,
      });
    })

    // when component is rendered, throw a data changed event
    this.component.addEventListener('rendered', () => {
      Reflect.ownKeys(this.data).forEach((prop) => {
        this.dispatchDataChangedEvent({ prop, value: this.data[prop] });
      });
    });
  }

  dispatchDataChangedEvent({ prop, value, oldValue }) {
    this.component.dispatchEvent(
      new CustomEvent(
        `dataChanged:${prop}`,
        {
          detail: {
            oldValue,
            value,
          },
          passive: true,
        }
      )
    );
  }
  attribute(property) {
    const camelProperty = caseSwitch(property);
    Reflect.defineProperty(this.data, camelProperty, {
      get: () => this.component.el.getAttribute(property),
      set: (value) => {
        if (value === true || value === false) {
          this.component.el.toggleAttribute(property, value);
        } else {
          this.component.el.setAttribute(property, value);
        }
      },
    });
  }

  follow(property, value) {
    // TODO proxy

    Reflect.defineProperty(this.data, property, {
      get: () => this._data[property],
      set: (value) => {
        const oldValue = this._data[property];
        this.dispatchDataChangedEvent({
          prop: property,
          value,
          oldValue,
        });
        this._data[property] = value;
      }
    });

    this.dispatchDataChangedEvent({
      prop: property,
      value,
    });
  }
}
