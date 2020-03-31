import { BaseWidget } from './baseWidget.js';
import { defineComponent, uniqID } from '../libs/helpers.js';

export default class SolidFormFile extends BaseWidget {
  input!: HTMLInputElement;
  filePicker!: HTMLInputElement;
  output!: HTMLSpanElement;
  resetButton!: HTMLSpanElement;
  constructor(){
    super()
    this.selectFile = this.selectFile.bind(this);
    this.resetFile = this.resetFile.bind(this);
  }
  get template() {
    const id = uniqID();
    return `<div>
      <label for="${id}">\${label}</label>
      <input
        data-holder
        type="text"
        name="\${name}"
        value="\${value}"
      >
      <input type="file" id="${id}"/>
      <button hidden>×</button>
      <span></span>
    </div>`;
  }
  get uploadURL() {
    return this.getAttribute('upload-url');
  }
  set uploadURL(url) {
    if (url === null) {
      this.removeAttribute('upload-url');
      return;
    }
    this.setAttribute('upload-url', url);
  }
  async render() {
    await super.render();
    this.input = this.querySelector('input[type="text"]') as HTMLInputElement;
    this.filePicker = this.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    this.output = this.querySelector('span')!;
    this.resetButton = this.querySelector('button')!;
    this.filePicker.removeEventListener('change', this.selectFile);
    this.filePicker.addEventListener('change', this.selectFile);
    this.resetButton.removeEventListener('click', this.selectFile);
    this.resetButton.addEventListener('click', this.resetFile);
  }
  resetFile() {
    this.input.value = '';
    this.filePicker.value = '';
    this.output.textContent = '';
    this.resetButton.toggleAttribute('hidden', true);
    this.input.dispatchEvent(new Event('change'));
  }
  selectFile() {
    if (this.uploadURL === null) return;
    if (this.filePicker.files!.length < 1) return;
    const file = this.filePicker.files![0];
    this.output.textContent = '⏳';
    const formData = new FormData();
    formData.append('file', file);
    fetch(this.uploadURL, {
      method: 'POST',
      // headers: {},
      body: formData,
    })
      .then(response => {
        // this.filePicker.value = '';
        const location = response.headers.get('location');
        if (location == null) {
          this.output.textContent = 'header location not found!';
        } else {
          this.input.value = location;
          this.output.textContent = '';
          this.resetButton.toggleAttribute('hidden', false);
          this.input.dispatchEvent(new Event('change'));
        }
      })
      .catch(error => {
        this.filePicker.value = '';
        this.output.textContent = 'upload error';
        console.error(error);
      });
  }
}

defineComponent('solid-form-file', SolidFormFile);