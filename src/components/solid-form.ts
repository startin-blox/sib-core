import { Sib } from '../libs/Sib.ts';
import { setDeepProperty, transformArrayToContainer } from '../libs/helpers.ts';
import { StoreService } from '../libs/store/storeService.ts';

import type { WidgetInterface } from '../mixins/interfaces.ts';
import { NextMixin } from '../mixins/nextMixin.ts';
import { StoreMixin } from '../mixins/storeMixin.ts';
import { ValidationMixin } from '../mixins/validationMixin.ts';
import { WidgetMixin } from '../mixins/widgetMixin.ts';

import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { trackRenderAsync } from '../logger.ts';

const store = StoreService.getInstance();
export const SolidForm = {
  name: 'solid-form',
  use: [WidgetMixin, StoreMixin, NextMixin, ValidationMixin],
  attributes: {
    autosave: {
      type: Boolean,
      default: null,
    },
    classSubmitButton: {
      type: String,
      default: undefined,
    },
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text',
    },
    naked: {
      type: Boolean,
      default: null,
    },
    partial: {
      type: Boolean,
      default: null,
    },
    submitButton: {
      type: String,
      default: undefined,
      callback: function (newValue: string, oldValue: string) {
        if (this.noRender == null && newValue !== oldValue) this.populate();
      },
    },
    submitWidget: {
      type: String,
      default: null,
    },
  },
  initialState: {
    error: '',
  },
  get defaultMultipleWidget(): string {
    return 'solid-multiple-form';
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  get value(): object {
    const values = {};
    for (const widget of this.widgets) {
      const name = (widget.component || widget).name;
      if (name == null) continue;
      let value = widget.component ? widget.component.getValue() : widget.value;
      try {
        value = JSON.parse(value);
      } catch {}
      setDeepProperty(values, name.split('.'), value);
    }
    // add @id if edition
    if (this.resource && !this.resource.isContainer?.())
      values['@id'] = this.resourceId;
    return values;
  },
  get isNaked(): boolean {
    return this.element.hasAttribute('naked');
  },
  get isSavingAutomatically(): boolean {
    return this.autosave !== null;
  },
  isCreationForm(formValue: object): boolean {
    return !('@id' in formValue);
  },
  async getFormValue() {
    const value = this.value;
    if (this.resource && !this.resource.isContainer?.()) {
      for (const predicate of Object.keys(this.value)) {
        // add @id for nested resources
        const object = await this.resource.getList(predicate);

        // Nested containers
        if (object?.['@id'] && !value[predicate]['@id'])
          value[predicate]['@id'] = object['@id'];

        //FIXME: Edge case of array support, ugly management
        if (
          object &&
          !object['@id'] &&
          Array.isArray(object) &&
          value[predicate].length === 0 &&
          object.length > 0
        ) {
          value[predicate] = object;
        }
      }
    }
    return transformArrayToContainer(value);
  },
  getWidget(field: string, isSet = false): WidgetInterface {
    let tagName = '';
    const widgetAttribute = this.element.getAttribute(`widget-${field}`);

    // Choose widget
    if (!widgetAttribute && this.element.hasAttribute(`upload-url-${field}`)) {
      tagName = 'solid-form-file';
    } else if (
      !widgetAttribute &&
      (this.element.hasAttribute(`range-${field}`) ||
        this.element.hasAttribute(`enum-${field}`))
    ) {
      tagName = 'solid-form-dropdown';
    } else {
      tagName =
        widgetAttribute ||
        (!isSet ? this.defaultWidget : this.defaultSetWidget);
    }
    // Create widget
    return this.widgetFromTagName(tagName);
  },
  change(resource: object): void {
    this.element.dispatchEvent(
      new CustomEvent('formChange', {
        bubbles: true,
        detail: { resource },
      }),
    );
  },
  async save() {
    this.toggleLoaderHidden(false);
    this.hideError();
    const resource = await this.getFormValue();
    resource['@context'] = this.context;
    let saved: string | null | undefined;
    try {
      if (this.partial == null) {
        saved = resource['@id']
          ? await store.put(resource, this.resourceId)
          : await store.post(resource, this.resourceId);
      } else {
        saved = await store.patch(resource, this.resourceId);
      }
    } catch (e: any) {
      this.toggleLoaderHidden(true);
      if (e?.json) {
        // if server error
        e.json().then(error => this.showError(error));
        throw e;
      }
    }
    this.element.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: {
          resource: resource,
          id: saved || null,
        },
      }),
    );
    this.toggleLoaderHidden(true);
    return saved;
  },
  async submitForm(): Promise<void> {
    let id: string;
    try {
      id = (await this.save()) || this.getFormValue()['@id'];
    } catch (_e) {
      return;
    }
    this.reset();
    this.goToNext({ '@id': id });
  },
  async onInput(): Promise<void> {
    const formValue = await this.getFormValue();
    this.change(formValue);
  },
  async onChange(): Promise<void> {
    const formValue = await this.getFormValue();
    if (!this.isCreationForm(formValue) && this.isSavingAutomatically)
      this.submitForm(); // if autosave, submitForm
  },
  displayErrorMessage(errors: [string, any][], errorFullName = '') {
    for (const member of errors) {
      const errorNextName: string = Object.values(member)[0];
      const subErrorName =
        errorFullName === ''
          ? errorNextName
          : `${errorFullName}.${errorNextName}`;
      let errorFieldName = '';

      if (errorFullName) errorFieldName = `${errorFullName}.${errorNextName}`;
      else errorFieldName = errorNextName;

      if (errorFieldName) {
        const formField = this.element.querySelector(
          `[name="${errorFieldName}"]`,
        );
        if (formField) {
          formField.classList.add('error');
          const errorParagraph = document.createElement('p');
          if (Array.isArray(Object.values(member)[1]) === true) {
            for (const error of Object.values(member)[1]) {
              const errorText = document.createElement('p');
              errorText.textContent = error;
              errorParagraph.appendChild(errorText);
            }
          } else if (typeof Object.values(member)[1] === 'object') {
            for (const value of Object.values(Object.values(member)[1])) {
              if (Array.isArray(value)) {
                for (const error of value) {
                  const errorText = document.createElement('p');
                  errorText.textContent = error;
                  errorParagraph.appendChild(errorText);
                }
              } else if (typeof value === 'string') {
                const errorText = document.createElement('p');
                errorText.textContent = value;
                errorParagraph.appendChild(errorText);
              }
            }
          } else {
            errorParagraph.textContent = Object.values(member)[1];
          }
          errorParagraph.classList.add('error-message');
          formField.appendChild(errorParagraph);
        }
      }

      if (!Array.isArray(Object.values(member)[1]) === true) {
        const objectErrors = Object.values(member)[1];
        const subErrors = Object.entries(objectErrors);
        this.displayErrorMessage(subErrors, subErrorName);
      }
    }
  },
  empty(): void {},
  showError(e: object) {
    const errors = Object.entries(e).filter(
      field => !field[0].startsWith('@context'),
    );
    this.displayErrorMessage(errors);
    const errorTemplate = html`<p>${this.t('solid-form.validation-error')}</p>`;

    // Validation message in english ?
    const parentElement = this.element.querySelector('[data-id=error]');
    if (parentElement) render(errorTemplate, parentElement);
  },
  hideError() {
    const formErrors = this.element.querySelectorAll('.error-message');
    if (formErrors) for (const error of formErrors) error.remove();

    const errorFields = this.element.querySelectorAll('.error');
    if (errorFields)
      for (const errorField of errorFields)
        errorField.classList.remove('error');

    const parentElement = this.element.querySelector('[data-id=error]');
    if (parentElement) render('', parentElement);
  },
  reset() {
    if (!this.isNaked) this.element.querySelector('form').reset();
  },
  onSubmit(event: Event) {
    if (!this.isNaked) {
      event.preventDefault();
      this.performAction(); // In validationMixin, method defining what to do according to the present attributes
    }
  },
  validateModal() {
    //send method to validationMixin, used by the dialog modal and performAction method
    return this.submitForm();
  },
  onReset() {
    if (!this.isNaked) setTimeout(() => this.onInput());
  },
  getSubmitTemplate() {
    return html`
      <div class=${ifDefined(this.classSubmitButton)}>
        ${
          this.submitWidget === 'button'
            ? html`<button type="submit">${this.submitButton || this.t('solid-form.submit-button')}</button>`
            : html`<input type="submit" value=${this.submitButton || this.t('solid-form.submit-button')}>`
        }
      </div>
    `;
  },
  populate: trackRenderAsync(async function (): Promise<void> {
    this.element.oninput = () => this.onInput(); // prevent from firing change multiple times
    this.element.onchange = () => this.onChange();
    // this._resource = await store.get(this.resourceId);
    const fields = await this.getFields();
    const widgetTemplates = await Promise.all(
      fields.map((field: string) => this.createWidgetTemplate(field)),
    );
    const template = html`
        <div data-id="error"></div>
        ${
          !this.isNaked
            ? html`
          <form
            @submit=${this.onSubmit.bind(this)}
            @reset=${this.onReset.bind(this)}
          >
            ${widgetTemplates}
            ${!this.isSavingAutomatically ? this.getSubmitTemplate() : ''}
            ${
              this.element.hasAttribute('reset')
                ? html`<input type="reset" />`
                : ''
            }
          </form>
        `
            : html`${widgetTemplates}`
        }
        ${this.getModalDialog()}
      `;
    render(template, this.element);
  }, 'SolidForm:populate'),
};

Sib.register(SolidForm);
