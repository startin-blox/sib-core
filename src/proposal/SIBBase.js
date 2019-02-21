import SIB from './SIB.js';

export default class SIBBase extends HTMLElement {
  constructor() {
      super();

      this._watchers = {};
      this.createdCallback();
  }

  /* HTMLElement */
  static get observedAttributes() {
    return this.attrs;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.valueChanged(name, newValue, oldValue);
  }

  connectedCallback() {
    this.attachedCallback();
  }

  disconnectedCallback() {
    this.detachedCallback();
  }

  /* Public API */
  static get mixins() {
    return [];
  }

  static get attrs() {
    return [];
  }

  created() {
  }

  attached() {
  }

  detached() {
  }

  watch(name, fn) {
    this.addWatcher(name, fn);
  }

  static install() {
    SIB.register(this);
  }

  /* Internal API */
  createdCallback() {
    this.created();
  }

  attachedCallback() {
    this.attached();
  }

  detachedCallback() {
    this.detached();
  }

  valueChanged(name, newValue, oldValue) {
    const watchers = this.getWatchers(name)

    watchers.forEach((watcher) => {
      watcher(newValue, oldValue);
    });
  }

  addWatcher(name, fn) {
    if (!this._watchers[name]) {
      this._watchers[name] = [];
    }
    this._watchers[name].push(
      (...args) => fn.apply(this, args),
    );
  }

  getWatchers(name) {
    if (!this._watchers[name]) {
      return [];
    }
    return this._watchers[name];
  }
}
