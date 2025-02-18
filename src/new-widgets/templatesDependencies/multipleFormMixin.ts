import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';
import { StoreMixin } from '../../mixins/storeMixin.ts';

const MultipleFormMixin = {
  name: 'multiple-form-mixin',
  use: [StoreMixin],
  attributes: {
    widget: {
      type: String,
      default: 'solid-form-text',
    },
    addLabel: {
      type: String,
      default: '+',
      callback: function (value) {
        if (value !== this.listAttributes.addLabel)
          this.listAttributes.addLabel = value;
        this.planRender();
      },
    },
    removeLabel: {
      type: String,
      default: '×',
      callback: function (value) {
        if (value !== this.listAttributes.removeLabel)
          this.listAttributes.removeLabel = value;
        this.planRender();
      },
    },
    range: {
      type: String,
      default: '',
    },
    addClass: {
      type: String,
      default: undefined,
      callback: function (value) {
        if (value !== this.listAttributes.addClass)
          this.listAttributes.addClass = value;
        this.planRender();
      },
    },
    removeClass: {
      type: String,
      default: undefined,
      callback: function (value) {
        if (value !== this.listAttributes.removeClass)
          this.listAttributes.removeClass = value;
        this.planRender();
      },
    },
  },
  created() {
    this.listValueTransformations.attach(
      this.setDataSrc.bind(this),
      'MultipleFormMixin:setDataSrc',
    );

    this.listAttributes.children = [];
    this.listAttributes.addLabel = this.addLabel;
    this.listAttributes.removeLabel = this.removeLabel;
    this.listAttributes.addClass = this.addClass;
    this.listAttributes.removeClass = this.removeClass;
    this.listAttributes.addItem = () => {
      this.insertWidget();
      this.planRender();
    };
    this.listAttributes.removeItem = index => {
      this.element
        .querySelector(`[data-index="${this.name + index}"]`)
        .remove();
      this.element.dispatchEvent(new Event('change', { bubbles: true }));
    };
  },
  setDataSrc(value: string, listValueTransformations: PostProcessorRegistry) {
    if (value && value !== this.dataSrc) {
      try {
        if (Array.isArray(JSON.parse(value))) {
          this.setValue(JSON.parse(value));
        }
      } catch {
        //FIXME: Awful trick to handle both resource @ids as value and serialized arrays values
        this.dataSrc = value;
      }
    }

    const nextProcessor = listValueTransformations.shift();
    if (nextProcessor) nextProcessor(value, listValueTransformations);
  },
  populate() {
    const resources = this.resource?.['predicate'];
    if (!resources) return;

    this.listAttributes.children = []; // reset list

    // set value in form
    for (const resource of resources) {
      // for each resource
      this.insertWidget(resource['@id']); // create a widget
    }
    this.planRender();
  },
  insertWidget(value = '') {
    if (!this.widget) return;
    const widget = document.createElement(this.widget);
    const attributes = {
      'data-holder': true,
      name: this.name,
      value: value,
      range: this.range,
      class: this.widget,
    };
    for (const name of Object.keys(attributes)) {
      if (typeof attributes[name] === 'boolean')
        widget.toggleAttribute(name, attributes[name]);
      else widget.setAttribute(name, attributes[name]);
    }
    this.listAttributes.children.push(widget);
  },
  empty() {
    this.listAttributes.children = [];
    this.planRender();
  },
  getValue() {
    if (!this.dataHolder) return [];
    // Was returning an array of functions, now returns an array of values.
    // Not sure about the tests results in that context
    return Array.from(this.dataHolder).map((element: any) => {
      const elValue = this.getValueFromElement(element);
      return elValue;
    });
  },
  get type() {
    return 'resource';
  },
  get multiple() {
    return true;
  },
};

export { MultipleFormMixin };
