import SolidFormFile from './solid-form-file.js';
import { defineComponent } from '../libs/helpers.js';

export default class SolidFormFileImage extends SolidFormFile {
  image = new Image();
  constructor() {
    super();
    this.updateImgSrc = this.updateImgSrc.bind(this);
    this.showImage = this.showImage.bind(this);
  }
  async render() {
    await super.render();
    this.filePicker.accept = 'image/*';
    this.input.insertAdjacentElement('afterend', this.image);
    this.input.toggleAttribute('hidden', true);
    this.image.removeEventListener('load', this.selectFile);
    this.image.addEventListener('load', this.showImage);
    this.input.removeEventListener('change', this.selectFile);
    this.input.addEventListener('change', this.updateImgSrc);
  }
  updateImgSrc() {
    this.image.toggleAttribute('hidden', this.input.value !== '');
    this.image.src = this.input.value;
  }
  showImage() {
    this.image.toggleAttribute('hidden', false);
  }
}

// defineComponent('solid-form-file-image', SolidFormFileImage);
