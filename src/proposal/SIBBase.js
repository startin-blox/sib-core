export default class SIBBase extends HTMLElement {
  constructor() {
      super();
      this.watchers = {};
      this.hookCreated();
  }

  static get observedAttributes() {
    return this.getObservedAttributes();
  }

  attributeChangedCallback(...args) {
    this.hookChanged(...args);
  }

  connectedCallback() {
    this.hookAttached();
  }

  disconnectedCallback() {
    this.hookDetached();
  }

  static get mixins() {
    return [];
  }

  static get props() {
    return {};
  }

  static getObservedAttributes() {
    const mapProps = (props) => {
      return Object.keys(props);
    };

    const attributes = [];

    for(const mixin in this.mixins) {
      if (mixin && props in mixin) {
        attributes.splice(0, 0, (mapProps(mixin.props)));
      }
    }

    attributes.splice(0, 0, (mapProps(this.props)));
    return attributes;
  }

  hookCreated() {
    for(const mixin in this.mixins) {
      if (created in mixin) {
        mixin.created.apply(this);
      }
    }
    if (this.created) {
      this.created();
    }
  }

  hookAttached() {
    for(const mixin in this.mixins) {
      if (attached in mixin) {
        mixin.attached.apply(this);
      }
    }

    if (this.attached) {
      this.attached();
    }
  }

  hookDetached() {
    for(const mixin in this.mixins) {
      if (detached in mixin) {
        mixin.detached.apply(this);
      }
    }

    if (this.detached) {
      this.detached();
    }
  }

  hookChanged(name, oldValue, newValue) {
    this.valueChanged(name, newValue, oldValue);
  }

  valueChanged(name, newValue, oldValue) {
    for(const mixin in this.mixins) {
      if (watch in mixin && name in mixin.watch) {
        mixin.watch.apply(this, [...name, newValue, oldValue]);
      }
    }

    if (this.watch && name in this.watch) {
      this.watch[name](newValue, oldValue);
    }

    const watchers = this.getWatchers(name)

    watchers.forEach((watcher) => {
      watcher(newValue, oldValue);
    });
  }

  addWatcher(name, fn) {
    if (!this.watchers[name]) {
      this.watchers[name] = [];
    }
    this.watchers[name].push(fn);
  }

  getWatchers(name) {
    if (!this.watchers[name]) {
      return [];
    }
    return this.watchers[name];
  }
}
