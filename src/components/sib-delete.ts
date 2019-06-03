import { Sib } from '../libs/Sib.js';
import { store } from '../libs/store/store.js';

export const SibDelete = {
  name: 'sib-delete',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: null
    },
    dataLabel: {
      type: String,
      default: "Delete"
    }
  },
  created(): void {
    this.render();
  },
  async delete(): Promise<void> {
    if (!this.dataSrc) return;
    return store.delete(this.dataSrc).then(() => {
      this.element.dispatchEvent(
        new CustomEvent('resourceDeleted', { detail: { resource: { "@id": this.dataSrc } } }),
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

Sib.register(SibDelete);