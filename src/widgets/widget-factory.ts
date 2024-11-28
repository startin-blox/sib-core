import { defineComponent } from '../libs/helpers.ts';
import { BaseWidget } from './baseWidget.ts';

export const widgetFactory = (
  tagName: string,
  customTemplate: string,
  childTemplate = '',
  callback?: (element: Element) => void,
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
  defineComponent(tagName, cls);
  return cls;
};
