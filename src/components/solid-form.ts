import { Sib } from '../libs/Sib';
import { WidgetMixin } from '../mixins/widgetMixin';
import { StoreMixin } from '../mixins/storeMixin';
import { NextMixin } from '../mixins/nextMixin';
import { ValidationMixin } from '../mixins/validationMixin';
import { store } from '../libs/store/store';
import { setDeepProperty, transformArrayToContainer } from '../libs/helpers';
import type { WidgetInterface } from '../mixins/interfaces';

import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';

export const SolidForm = {
  name: 'solid-form',
  use: [WidgetMixin, StoreMixin, NextMixin, ValidationMixin],
  attributes: {
    autosave: {
      type: Boolean,
      default: null
    },
    classSubmitButton: {
      type: String,
      default: undefined,
    },
    defaultWidget: {
      type: String,
      default: 'solid-form-label-text'
    },
    naked: {
      type: Boolean,
      default: null
    },
    partial: {
      type: Boolean,
      default: null
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
      default: null
    },
  },
  initialState: {
    error: ''
  },
  get defaultMultipleWidget(): string {
    return 'solid-multiple-form';
  },
  get defaultSetWidget(): string {
    return 'solid-set-default';
  },
  get value(): object {
    const values = {};
    this.widgets.forEach((widget) => {
      const name = (widget.component || widget).name;
      if (name == null) return;
      let value = widget.component ? widget.component.getValue() : widget.value;
      try {
        value = JSON.parse(value);
      } catch (e) {}
      setDeepProperty(values, name.split('.'), value);
    });
    // add @id if edition
    if (this.resource && !this.resource.isContainer?.()) values['@id'] = this.resourceId;
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
    let value = this.value;
    if (this.resource && !this.resource.isContainer?.()) {
      for (let predicate of Object.keys(this.value)) {
        // add @id for nested resources
        let object = await this.resource[predicate];
        // edge-case where object is null because predicate needs to be expanded manually (arrays)
        if (!object) {
          object = await this.resource[store.getExpandedPredicate(predicate, this.context)];
        }

        // Nested containers
        if (object
          && object['@id']
          && !value[predicate]['@id']) value[predicate]['@id'] = object['@id'];

        //FIXME: Edge case of array support, ugly management
        if (object && !object['@id']
          && Array.isArray(object)
          && value[predicate].length == 0
          && object.length > 0) {
          value[predicate] = object;
        }
      }
    }
    return transformArrayToContainer(value);
  },
  getWidget(field: string, isSet: boolean = false): WidgetInterface {
    let tagName = '';
    const widgetAttribute = this.element.getAttribute('widget-' + field);

    // Choose widget
    if (!widgetAttribute && this.element.hasAttribute('upload-url-' + field)) {
      tagName = 'solid-form-file'
    } else if (!widgetAttribute && (this.element.hasAttribute('range-' + field) || this.element.hasAttribute('enum-' + field))) {
      tagName = 'solid-form-dropdown'
    } else {
      tagName = widgetAttribute || (!isSet ? this.defaultWidget : this.defaultSetWidget);
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
  async save(): Promise<object> {
    this.toggleLoaderHidden(false);
    this.hideError();
    const resource = await this.getFormValue();
    resource['@context'] = this.context;
    let saved;
    try {
      if (this.partial == null) {
        saved = resource['@id'] ?
          await store.put(resource, this.resourceId) :
          await store.post(resource, this.resourceId);
      } else {
        saved = await store.patch(resource, this.resourceId);
      }
    } catch (e: any) {
      this.toggleLoaderHidden(true);
      if (e) { // if server error
        e.json().then(error => this.showError(error));
        throw e;
      }
    }
    this.element.dispatchEvent(
      new CustomEvent('save', {
        bubbles: true,
        detail: {
          resource: resource,
          id: saved || null
        },
      }),
    );
    this.toggleLoaderHidden(true);
    return saved;
  },
  async submitForm(): Promise<void> {
    let id: string;
    try {
      id = await this.save() || this.getFormValue()['@id'];
    } catch (e) { return; }
    this.reset();
    this.goToNext({'@id': id})
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
  displayErrorMessage(errors: [string, any][], errorFullName: string = '') {
    errors.forEach((member: [string, any]) => {
      let errorNextName: string = Object.values(member)[0];
      let subErrorName = (errorFullName === "" ? errorNextName : errorFullName.concat('.' + errorNextName));
      let errorFieldName = ""

      if (errorFullName) errorFieldName = errorFullName.concat('.' + errorNextName);
      else errorFieldName = errorNextName;

      if (errorFieldName) {
        let formField = this.element.querySelector(`[name="${errorFieldName}"]`);
        if (formField) {
          formField.classList.add('error');
          let errorParagraph = document.createElement('p');
          if (Array.isArray(Object.values(member)[1]) === true) {
            Object.values(member)[1].forEach((error) => {
              let errorText = document.createElement('p');
              errorText.textContent = error;
              errorParagraph.appendChild(errorText);
            });
          } else if (typeof Object.values(member)[1] === 'object') {
            // @ts-ignore
            for (const [key, value] of Object.entries(Object.values(member)[1])) {
              if (Array.isArray(value)) {
                value.forEach((error) => {
                  let errorText = document.createElement('p');
                  errorText.textContent = error;
                  errorParagraph.appendChild(errorText);
                });
              } else if (typeof value === 'string') {
                let errorText = document.createElement('p');
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
        let objectErrors = Object.values(member)[1];
        let subErrors = Object.entries(objectErrors);
        this.displayErrorMessage(subErrors, subErrorName)
      }
    });
  },
  empty(): void {},
  showError(e: object) {
    let errors = Object.entries(e).filter(field => !field[0].startsWith('@context'));
    this.displayErrorMessage(errors);
    const errorTemplate = html`
      <p>${this.t('solid-form.validation-error')}</p>
    `;

    // Validation message in english ?
    const parentElement = this.element.querySelector('[data-id=error]');
    if (parentElement) render(errorTemplate, parentElement);
  },
  hideError() {
    let formErrors = this.element.querySelectorAll('.error-message');
    if (formErrors) formErrors.forEach((error) => error.remove());

    let errorFields = this.element.querySelectorAll('.error');
    if (errorFields) errorFields.forEach((errorField) => errorField.classList.remove('error'));

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
  validateModal() { //send method to validationMixin, used by the dialog modal and performAction method
    return this.submitForm();
  },
  onReset() {
    if (!this.isNaked) setTimeout(() => this.onInput())
  },
  getSubmitTemplate() {
    return html`
      <div class=${ifDefined(this.classSubmitButton)}>
        ${this.submitWidget === 'button' ? html`
          <button type="submit">${this.submitButton || this.t("solid-form.submit-button")}</button>
        ` : html`
          <input type="submit" value=${this.submitButton || this.t("solid-form.submit-button")}>
        `}
      </div>
    `
  },
  async populate(): Promise<void> {
    this.element.oninput = () => this.onInput(); // prevent from firing change multiple times
    this.element.onchange = () => this.onChange();
    const fields = await this.getFields();
    const widgetTemplates = await Promise.all(fields.map((field: string) => this.createWidgetTemplate(field)));
    const template = html`
      <div data-id="error"></div>
      ${!this.isNaked ? html`
        <form
          @submit=${this.onSubmit.bind(this)}
          @reset=${this.onReset.bind(this)}
        >
          ${widgetTemplates}
          ${!this.isSavingAutomatically ? this.getSubmitTemplate() : ''}
          ${this.element.hasAttribute('reset')
            ? html`<input type="reset" />` : ''}
        </form>
      ` : html`
        ${widgetTemplates}
      `
      }
      ${this.getModalDialog()}
    `;
    render(template, this.element);
  }
};

Sib.register(SolidForm);