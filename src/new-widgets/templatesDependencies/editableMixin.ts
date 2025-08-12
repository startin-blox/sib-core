import { StoreService } from '../../libs/store/storeService.ts';
const store = StoreService.getInstance();
import { StoreMixin } from '../../mixins/storeMixin.ts';

import { html } from 'lit';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';

const EditableMixin = {
  name: 'editable-mixin',
  use: [StoreMixin], // used to get context
  attributes: {
    editable: {
      type: Boolean,
      default: null,
      callback: function (newValue: boolean) {
        if (newValue !== null) this.listAttributes.editable = true;
      },
    },
    valueId: {
      type: String,
      default: '',
    },
    buttonLabel: {
      type: String,
      default: 'Modifier',
    },
  },
  created() {
    this.listTemplateAdditions.attach(
      this.addEditButton.bind(this),
      'EditableMixin:addEditButton',
    );
  },
  addEditButton(template, listTemplateAdditions: PostProcessorRegistry) {
    let newTemplate: any = null;
    if (this.editable !== null) {
      newTemplate = html`${template}<button @click=${this.activateEditableField.bind(this)}>${this.buttonLabel}</button>`;
    }
    const nextProcessor = listTemplateAdditions.shift();
    if (nextProcessor)
      nextProcessor(newTemplate || template, listTemplateAdditions);
  },
  activateEditableField(e: Event): void {
    const editableField = this.element.querySelector('[data-editable]');
    const editButton = e.target as HTMLElement;

    // Set attributes
    editableField.toggleAttribute('contenteditable', true);
    editableField.focus();
    editButton.toggleAttribute('disabled', true);

    // Save on focusout
    editableField.addEventListener('focusout', () =>
      this.save(editableField, editButton),
    );
  },
  save(editableField: HTMLElement, editButton: HTMLElement) {
    editableField.toggleAttribute('contenteditable', false);
    editButton.removeAttribute('disabled');

    if (!this.name || !this.valueId) {
      console.warn('Some attributes are missing to perform the update');
      return;
    }
    const resource = {};
    resource[this.name] = editableField.innerText;
    resource['@context'] = this.context;

    store.patch(resource, this.valueId);
  },
};

export { EditableMixin };
