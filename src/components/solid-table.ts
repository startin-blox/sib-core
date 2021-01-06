import { Sib } from '../libs/Sib';
import { store } from '../libs/store/store';
import { WidgetMixin } from '../mixins/widgetMixin';
import { ListMixin } from '../mixins/listMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { PaginateMixin } from '../mixins/paginateMixin';
import { FilterMixin } from '../mixins/filterMixin';
import { CounterMixin } from '../mixins/counterMixin';
import { SorterMixin } from '../mixins/sorterMixin';
import { GrouperMixin } from '../mixins/grouperMixin';
import { FederationMixin } from '../mixins/federationMixin';
import { HighlighterMixin } from '../mixins/highlighterMixin';
import { RequiredMixin } from '../mixins/requiredMixin';

import { html, render } from 'lit-html';

export const SolidTable = {
  name: 'solid-table',
  use: [
    WidgetMixin,
    ListMixin,
    StoreMixin,
    PaginateMixin,
    GrouperMixin,
    CounterMixin,
    HighlighterMixin,
    FilterMixin,
    SorterMixin,
    RequiredMixin,
    FederationMixin,
  ],
  attributes: {
    defaultWidget: {
      type: String,
      default: 'solid-display-value',
    },
    selectable: {
      type: String,
      default: null,
    },
  },
  get div(): HTMLElement { // overrides widgetMixin to create a table element
    if (this._div) return this._div;
    this._div = document.createElement('table');
    this.element.appendChild(this._div);
    return this._div;
  },
  get defaultMultipleWidget(): string {
    return 'solid-multiple';
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  get selectedLines() {
    if (this.selectable === null) return [];
    return (Array.from(this.element.querySelectorAll('input[data-selection]:checked')) as Element[])
      .map(e => e?.closest('[data-resource]')?.getAttribute('data-resource'));
  },
  /**
   * Returns template of a child element (resource)
   * @param resourceId
   * @param attributes
   */
  getChildTemplate(resourceId: string, fields) {
    const resource = store.get(resourceId);
    let template = html`
      <tr data-resource="${resourceId}">
        ${this.selectable !== null ? html`
        <td>
          <input type="checkbox" data-selection />
        </td>` : ''}
        ${fields.map((field: string) => html`<td>${this.createWidget(field, resource)}</td>`)}
      </tr>
    `
    return template;
  },

  /**
   * Creates and render the content of a single element (resource)
   * @param parent
   */
  async appendSingleElt(parent: HTMLElement): Promise<void> {
    const fields = await this.getFields();

    const attributes = this.getChildAttributes();
    const template = this.getChildTemplate(this.resource['@id'], fields, attributes);
    render(template, parent);
  },

  /**
   * @override listMixin method to use litHtml
   *
   * Render resources from a container
   * @param resources
   * @param listPostProcessors
   * @param div
   * @param context
   */
  async renderDOM(
    resources: object[],
    listPostProcessors: Function[],
    div: HTMLElement,
    context: string,
  ) {
    const fields = await this.getFields();
    const template = html`
      ${resources.map(r => r ? this.getChildTemplate(r['@id'], fields) : null)}
    `; // create a child template for each resource
    render(template, div);

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(
        resources,
        listPostProcessors,
        div,
        context
      );
  },
};

Sib.register(SolidTable);
