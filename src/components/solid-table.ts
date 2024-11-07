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

import { html, render } from 'lit';
import { until } from 'lit/directives/until.js';
import { spread } from '../libs/lit-helpers';
import { PostProcessorRegistry } from '../libs/PostProcessorRegistry';
import { trackRenderAsync } from '../logger';

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
   * Unselect all lines
   */
  unselectAll(): void {
    if (this.selectable === null) return;
    for (const checkbox of Array.from(this.element.querySelectorAll('input[data-selection]') as HTMLInputElement[])) {
      checkbox.checked = false;
    }
  },
  /**
   * Select specific lines
   * @param lines - array of selected lines
   */
  selectLines(lines: string[]) {
    if (this.selectable === null || lines.length === 0) return;
    for (const line of lines) {
      const checkbox = this.element.querySelector(`[data-resource="${line}"] input[data-selection]`);
      if (checkbox) checkbox.checked = true;
    }
  },
  /**
   * Create a widget for the field or a form if it's editable
   * @param field
   * @param resource
   */
  async createCellWidget(field: string, resource: Resource) {
    // if regular widget
    if (!this.element.hasAttribute('editable-' + field)) return this.createWidgetTemplate(field, resource, true);

    // if editable widget
    const attributes = {};
    const formWidgetAttributes = [ // attributes to give to the form widget
      'range',
      'enum',
      'placeholder',
      'required',
      'autocomplete',
      'option-label',
      'option-value',
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
        ${this.selectable !== null ? html`<th><input type="checkbox" @change="${this.selectAll.bind(this)}" /></th>` : ''}
        ${fields.map((field: string) => html`<th>${this.element.hasAttribute('label-'+field) ? this.element.getAttribute('label-'+field) : field}</th>`)}
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
        ${this.selectable !== null ? html`<td><input type="checkbox" data-selection /></td>` : ''}
        ${fields.map((field: string) => html`<td>${until(this.createCellWidget(field, resource))}</td>`)}
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

    const template = html`${this.header !== null ? this.getHeader(fields) : ''}${until(this.getChildTemplate(this.resource['@id'], fields))}`;
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
  renderDOM: trackRenderAsync(async function(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ) {
    const selectedLines = [...this.selectedLines]; // save selected lines before moving them
    const fields = await this.getFields();
    const childTemplates = await Promise.all(
      resources.map(r => r ? this.getChildTemplate(r['@id'], fields) : null)
    );
    const template = html`${this.header !== null ? this.getHeader(fields) : ''}${childTemplates}`; // create a child template for each resource
    render(template, div);

    // Re-select the right lines
    this.unselectAll();
    this.selectLines(selectedLines);

    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(
        resources,
        listPostProcessors,
        div,
        context
      );
  }, "SolidTable:renderDom"),
};

Sib.register(SolidTable);
