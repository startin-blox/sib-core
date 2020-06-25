import { StoreMixin } from '../../mixins/storeMixin.js';

const MultipleFormMixin = {
  name: 'multiple-form-mixin',
  use: [ StoreMixin ],
  attributes: {
    widget: {
      type: String,
      default: ''
    },
    addLabel: {
      type: String,
      default: '+',
      callback: function(value) {
        if (value !== this.listAttributes['addLabel']) this.listAttributes['addLabel'] = value;
        this.planRender();
      }
    },
    removeLabel: {
      type: String,
      default: 'x',
      callback: function(value) {
        if (value !== this.listAttributes['removeLabel']) this.listAttributes['removeLabel'] = value;
        this.planRender();
      }
    },
    range: {
      type: String,
      default: '',
    }
  },
  attached() {
    this.listValueTransformations.push(this.setDataSrc.bind(this));

    this.listAttributes['children'] = [];
    this.listAttributes['addLabel'] = this.addLabel;
    this.listAttributes['removeLabel'] = this.removeLabel;
    this.listAttributes['addItem'] = () => {
      this.insertWidget();
      this.planRender();
    };
    this.listAttributes['removeItem'] = (index) => {
      this.element.querySelector(`[data-index="${this.name + index}"]`).remove();
    };
  },
  setDataSrc(value: string, listValueTransformations: Function[]) {
    if (value && value !== this.dataSrc) this.dataSrc = value;
    const nextProcessor = listValueTransformations.shift();
    if(nextProcessor) nextProcessor(value, listValueTransformations);
  },
  populate() {
    if (!this.resource || !this.resource['ldp:contains']) return;

    this.listAttributes['children'] = []; // reset list

    // set value in form
    for (let resource of this.resource['ldp:contains']) { // for each resource
      this.insertWidget(resource['@id']); // create a widget
    }
    this.planRender();
  },
  insertWidget(value: string = '') {
    if (!this.widget) return;
    const widget = document.createElement(this.widget);
    const attributes = {
      'data-holder': true,
      'name': this.name,
      'value': value,
      'range': this.range
    };
    for (let name of Object.keys(attributes)) {
      if (typeof attributes[name] === "boolean") widget.toggleAttribute(name, attributes[name]);
      else widget.setAttribute(name, attributes[name]);
    }
    this.listAttributes['children'].push(widget);
  },
  empty() {
    this.listAttributes['children'] = [];
    this.planRender();
  },
  getValue() {
    if (!this.dataHolder) return [];
    return Array.from(this.dataHolder).map((element: any) => element.component.getValue());
  }
}

export {
  MultipleFormMixin
}