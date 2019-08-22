import { Sib } from '../libs/Sib.js';
import { WidgetMixin } from '../mixins/widgetMixin.js';
import { ListMixin } from '../mixins/listMixin.js';
import { StoreMixin } from '../mixins/storeMixin.js';

export const SibDisplay = {
  name: 'sib-display',
  use: [ WidgetMixin, ListMixin, StoreMixin ],
  created(): void {
    window.addEventListener('navigate', ((event: CustomEvent) => {
      if (this.resource == null) return;
      if (event['detail'].resource == null) return;
      if (this.resource['@id'] == null) return;
      this.element.toggleAttribute(
        'active',
        this.resource['@id'] === event.detail.resource.id,

      );
    }) as EventListener);
  },
  get childTag(): string {
    return this.element.dataset.child || this.element.tagName;
  },
  get defaultWidget(): string {
    return 'sib-display-value';
  },
  get defaultMultipleWidget(): string {
    return 'sib-multiple';
  },
  get defaultSetWidget(): string {
    return 'sib-set-default';
  },
  // Here "even.target" points to the content of the widgets of the children of sib-display
  dispatchSelect(event: Event): void {
    if (event.target) {
      const target = event.target as Element;
      const resource = target.closest(this.childTag).component.resource;
      this.element.dispatchEvent(
        new CustomEvent('resourceSelect', { detail: { resource: resource } }),
      );
      if (this.next) {
        this.element.dispatchEvent(
          new CustomEvent('requestNavigation', {
            bubbles: true,
            detail: { route: this.next, resource: resource },
          }),
        );
      }
    }
  },
  appendChildElt(resource, parent: Element): void {
    const child = document.createElement(this.childTag);
    child.component.resource = resource;
    child.addEventListener('click', this.dispatchSelect.bind(this));
    if (this.fields) child.setAttribute('fields', this.fields);

    for (let attr of this.element.attributes) {
      //copy widget and value attributes
      if (
        attr.name.startsWith('value-') ||
        attr.name.startsWith('label-') ||
        attr.name.startsWith('widget-') ||
        attr.name.startsWith('class-') ||
        attr.name.startsWith('multiple-') ||
        attr.name.startsWith('editable-') ||
        attr.name.startsWith('action-') ||
        attr.name.startsWith('default-')
      )
        child.setAttribute(attr.name, attr.value);
      if (attr.name.startsWith('child-'))
        child.setAttribute(attr.name.replace(/^child-/, ''), attr.value);
    }

    parent.appendChild(child);
  },
  async appendSingleElt(parent: HTMLElement): Promise<void> {
    for (let field of this.fieldsWidget) {
      await this.appendWidget(field, parent);
    }
  }
};

Sib.register(SibDisplay);