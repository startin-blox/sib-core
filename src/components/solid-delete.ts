import { Sib } from '../libs/Sib.js';
import { base_context, store } from '../libs/store/store.js';

export const SolidDelete = {
  name: 'solid-delete',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: null
    },
    dataLabel: {
      type: String,
      default: "Delete"
    },
    extraContext: {
      type: String,
      default: null
    },
  },
  created(): void {
    this.render();
  },
  get context(): object {
    let extraContextElement = this.extraContext ?
    document.getElementById(this.extraContext) : // take element extra context first
    document.querySelector('[data-default-context]'); // ... or look for a default extra context

    let extraContext = {};
    if (extraContextElement) extraContext = JSON.parse(extraContextElement.textContent || "{}");

    return { ...base_context, ...extraContext };
  },
  async delete(): Promise<void> {
    if (!this.dataSrc) return;
    return store.delete(this.dataSrc, this.context).then(response => {
      if (!response.ok) return;
      this.element.dispatchEvent(
        new CustomEvent('resourceDeleted', { detail: { resource: { "@id": this.dataSrc } }, bubbles: true }),
      );
    });
  },
  render(): void {
    const button = document.createElement('button');
    button.textContent = this.dataLabel;
    button.onclick = this.delete.bind(this);
    this.element.appendChild(button);
  }
};

Sib.register(SolidDelete);