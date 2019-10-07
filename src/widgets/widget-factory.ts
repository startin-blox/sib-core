import { BaseWidget } from './baseWidget.js';

export const widgetFactory = (
  tagName: string,
  customTemplate: string,
  childTemplate: string = "",
  callback?: (x: any) => void,
) => {
  const registered = customElements.get(tagName);
  if (registered) return registered;
  const cls = class extends BaseWidget {
    async render() {
      await super.render();
      if (callback) callback(this);
    }
    get template(): string {
      return customTemplate;
    }
    get childTemplate(): string {
      return childTemplate;
    }
  };
  customElements.define(tagName, cls);
  return cls;
};
