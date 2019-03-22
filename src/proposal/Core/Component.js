import SIB from '../SIB.js';
import Renderer from './Renderer.js';
import State from './State.js';
import Store from './Store.js';

/* Events received
 * "attached" when connected to DOM (from Element)
 * "detached" whe disconnected from DOM (from Element)
 * "attributeChanged" when an attribute mutate (from Element)
 * "rendered" when the component is rendered (from Renderer)
 * "dataChanged" when the data mutate (from State)
 *
 * Event triggered
 * 'created' Created event
 */

export default class Component extends EventTarget {
  constructor(element) {
      super();
      this.el = element;
      this.store = Store;
      this.state = new State(this);
      this._template = this.getTemplate();
      this.renderer = new Renderer(this, this.el, this._template);
      this.boot();
  }

  boot() {
    [
      'attached',
      'detached',
      'attributeChanged',
      'rendered',
      'dataChanged',
      'stateChanged',
      'created',
    ].forEach((hook) => {
      if (this[hook]) {
        this.addEventListener(hook, () => this[hook]());
      }
    });

    this.dispatchEvent(new CustomEvent('created'));
  }
  /* Public API */
  static get mixins() {
    return [];
  }

  static get attrs() {
    return [
    ];
  }

  static get selector() {
    return '';
  }

  static install() {
    SIB.register(this);
  }

  // TODO
  // watch(name, fn) {
  //   this.state.follow(name, fn);
  // }

  get template() {
    return '';
  }

  data() {
    return {};
  }

  /* Internal API */
  static getAttributes() {
    const baseAttributes = [
      'sib-template-selector',
    ];

    return [...baseAttributes, ...this.attrs];
  }

  getTemplate() {
    const templateSelector = this.state.data.sibTemplateSelector;
    let template = this.template;

    if (templateSelector) {
      template = document.querySelector(templateSelector);
    }

    if (template instanceof HTMLTemplateElement) {
      return template.content.cloneNode(true);
    }

    if (template instanceof HTMLElement) {
      return template;
    }

    const templateElement = document.createElement('template');
    templateElement.innerHTML = template;
    return templateElement.content;
  }
}
