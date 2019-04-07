import SIBWidgetMixin from "../mixins/sib-widget-mixin.js";
import SIBBase from "../parents/sib-base.js";

export default class SIBMultiple extends SIBWidgetMixin(SIBBase) {
  constructor() {
    super();
    this._value = [];
    this.widgets = [];
  }
  empty() {
    this._value = this.value;
    while (this.firstChild) this.firstChild.remove();
  }
  populate() {
    this._value.forEach(value => {
      this.insertWidget(this.name, value);
    });
  }
  get name() {
    return this.getAttribute('name');
  }

  set name(name) {
    this.setAttribute('name', name);
  }

  get value() {
    this._value = this.widgets.map(widget => widget.value);
    return this._value;
  }

  set value(value) {
    this.empty();
    this.populate();
  }

  createWidget(field, value) {
    const widget = document.createElement(this.getWidget(field));
    for (let name of Object.keys(attributes)) {
      widget[name] = attributes[name];
    }
    return widget;
  }

  insertWidget(field, attributes) {
    const element = this.createWidget(field, attributes);
    this.appendChild(element);
    this.widgets.push(element);
    return element;
  }
}
customElements.define('sib-multiple', SIBMultiple);
