//@ts-ignore
import deltaMd from 'delta-markdown-for-quill';
import Quill from 'quill';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.js';
import { importInlineCSS } from '../../libs/helpers.js';

const RichtextMixin = {
  name: 'richtext-mixin',
  initialState: {
    quill: null,
  },

  created() {
    importInlineCSS('quill', () => import('quill/dist/quill.snow.css?inline'));

    this.quill = null;
    this.listCallbacks.attach(
      this.addCallback.bind(this),
      'RichtextMixin:addCallback',
    );
  },
  getPlaceHolderValue() {
    return this.element.hasAttribute('placeholder')
      ? this.element.getAttribute('placeholder')
      : '';
  },
  addCallback(value: string, listCallbacks: PostProcessorRegistry) {
    if (this.quill == null) {
      const toolbarOptions = [
        ['bold', 'italic'],
        ['blockquote'],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ];
      const richtext = this.element.querySelector(
        '[data-richtext]',
      ) as HTMLElement;
      this.quill = new Quill(richtext, {
        modules: { toolbar: toolbarOptions },
        placeholder: this.getPlaceHolderValue(),
        theme: 'snow',
      });
    }

    const ops = deltaMd.toDelta(this.value);
    this.quill.setContents(ops);
    if (this.isRequired()) {
      this.createHiddenRequiredInput();
      this.quill.on('text-change', this.onTextChange.bind(this));
    }

    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
  isRequired() {
    return Array.from(this.element.attributes).some(
      attr => (attr as Attr).name === 'required',
    );
  },
  createHiddenRequiredInput() {
    const attributeName = this.getAttributeValue('name');
    this.hiddenInput = document.querySelector(
      `input[name="${`${attributeName}-hidden`}"]`,
    ) as HTMLInputElement;

    if (!this.hiddenInput) {
      this.hiddenInput = this.createHiddenInput(`${attributeName}-hidden`);
      this.element.appendChild(this.hiddenInput);
      this.addInvalidEventListener();
    }
    this.hiddenInput.value = this.quill.getText();
  },
  createHiddenInput(attributeName: string): HTMLInputElement {
    const input = document.createElement('input');
    input.name = attributeName;
    input.setAttribute('required', 'true');
    input.style.opacity = '0';
    input.style.position = 'absolute';
    input.style.pointerEvents = 'none';
    return input;
  },
  getAttributeValue(attributeName: string): string {
    const attribute = Array.from(this.element.attributes).find(
      attr => (attr as Attr).name === attributeName,
    ) as Attr;
    return attribute ? attribute.value : '';
  },
  displayCustomErrorMessage(message: string) {
    const richtext = this.element.querySelector('[data-richtext]');

    if (richtext) {
      let errorMessageElement = richtext.querySelector(
        '.required-error-message',
      ) as HTMLDivElement;

      if (!errorMessageElement) {
        errorMessageElement = document.createElement('div');
        errorMessageElement.className = 'required-error-message';
      }

      richtext.appendChild(errorMessageElement);
      errorMessageElement.textContent = message;
      richtext.classList.add('error-border-richtext');
    }
  },
  addInvalidEventListener() {
    (this.hiddenInput as HTMLInputElement).addEventListener('invalid', e => {
      e.preventDefault();
      this.displayCustomErrorMessage('Please fill out this field.');
    });
  },
  onTextChange() {
    (this.hiddenInput as HTMLInputElement).value = this.quill.getText();
    this.removeErrorMessageAndStyling();
  },
  removeErrorMessageAndStyling() {
    // Remove any previously displayed error message and error styling
    const richtext = this.element.querySelector('[data-richtext]');
    const errorMessageElement = richtext.querySelector(
      '.required-error-message',
    ) as HTMLDivElement;
    if (errorMessageElement) errorMessageElement.remove();
    richtext.classList.remove('error-border-richtext');
  },
};

export { RichtextMixin };
