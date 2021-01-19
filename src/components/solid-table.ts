import type { Resource } from '../mixins/interfaces';
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
import { until } from 'lit-html/directives/until';
import { spread } from '../libs/lit-helpers';

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
    header: {
      type: String,
      default: null,
    },
  },
  get parentElement(): string {
    return 'table';
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
   * Select all lines
   * @param e - event
   */
  selectAll(e) {
    if (this.selectable === null) return;
    for (const checkbox of Array.from(this.element.querySelectorAll('input[data-selection]') as HTMLInputElement[])) {
      checkbox.checked = e.target.checked;
    }
  },
  /**
   * Create a widget for the field or a form if it's editable
   * @param field
   * @param resource
   */
  createCellWidget(field: string, resource: Resource) {
    // if regular widget
    if (!this.element.hasAttribute('editable-' + field)) return this.createWidget(field, resource);

    // if editable widget
    const attributes = {};
    const formWidgetAttributes = [ // attributes to give to the form widget
      'range',
      'enum',
      'placeholder',
      'required',
      'autocomplete',
      'option-label',
      'min',
      'max',
      'pattern',
      'title',
      'widget'
    ];
    for (let attr of formWidgetAttributes) this.addToAttributes(`${attr}-${field}`, `${attr}-${field}`,  attributes)

    const formAttributes = [ // attributes to give to the form
      'class',
      'submit-button',
      'next'
    ];
    for (let attr of formAttributes) this.addToAttributes(`${attr}-${field}`, attr,  attributes)

    return html`
      <solid-form
        data-src="${resource['@id']}"
        fields="${field}"
        partial
        autosave
        ...=${spread(attributes)}
      ></solid-form>
    `;
  },
  /**
   * Creates a header line for the table
   * @param fields
   */
  getHeader(fields: string[]) {
    let template = html`
      <tr>
        ${this.selectable !== null ? html`
        <th>
          <input type="checkbox" @change="${this.selectAll.bind(this)}" />
        </th>` : ''}
        ${fields.map((field: string) => html`
          <th>
            ${this.element.hasAttribute('label-'+field) ? this.element.getAttribute('label-'+field) : field}
        </th>`)}
      </tr>
    `
    return template;
  },
  /**
   * Returns template of a child element (resource)
   * @param resourceId
   * @param attributes
   */
  async getChildTemplate(resourceId: string, fields) {
    const resource = await store.getData(resourceId, this.context);
    let template = html`
      <tr data-resource="${resourceId}">
        ${this.selectable !== null ? html`
        <td>
          <input type="checkbox" data-selection />
        </td>` : ''}
        ${fields.map((field: string) => html`<td>${this.createCellWidget(field, resource)}</td>`)}
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

    const template = html`
      ${this.header !== null ? this.getHeader(fields) : ''}
      ${until(this.getChildTemplate(this.resource['@id'], fields))}
    `;
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
      ${this.header !== null ? this.getHeader(fields) : ''}
      ${until(Promise.all(resources.map(r => r ? this.getChildTemplate(r['@id'], fields) : null)))}
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
