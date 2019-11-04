import SolidFormFile from './solid-form-file.js';
import { defineComponent } from "../libs/helpers.js";

export default class SolidFormFileImage extends SolidFormFile {
  image = new Image();
  async render() {
    await super.render();
    this.filePicker.accept = 'image/*';
    this.input.insertAdjacentElement('afterend', this.image);
    this.input.toggleAttribute('hidden', true);
    this.image.addEventListener('load', () => this.image.toggleAttribute('hidden', false));
    this.input.addEventListener('change', () => {
      this.image.toggleAttribute('hidden', true);
      this.image.src = this.input.value;
    });
  }
}

defineComponent('solid-form-file-image', SolidFormFileImage);
