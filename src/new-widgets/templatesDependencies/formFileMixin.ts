import { store } from '../../libs/store/store';

const FormFileMixin = {
  name: 'form-file-mixin',
  attributes: {
    uploadUrl: {
      type: String,
      default: '',
    },
  },
  initialState: {
    initialValue: '',
  },
  created() {
    this.listAttributes.output = '';
    this.listAttributes.resetButtonHidden = true;
    this.listAttributes.selectFile = this.selectFile.bind(this);
    this.listAttributes.resetFile = this.resetFile.bind(this);
  },
  attached() {
    this.element
      .closest('form')
      .addEventListener('reset', this.resetFormFile.bind(this));
    this.element
      .closest('solid-form')
      .addEventListener('populate', this.onPopulate.bind(this));
  },
  onPopulate() {
    const dataHolder = this.element.querySelector('input[data-holder]');
    dataHolder.value = this.value;
    dataHolder.dispatchEvent(new Event('change'));
  },
  resetFormFile(e) {
    if (e.target && (e.target as HTMLElement).contains(this.element)) {
      if (this.initialValue !== '') {
        this.value = this.initialValue;
      }
      this.listAttributes.resetButtonHidden = true;
      this.planRender();
      const dataHolder = this.element.querySelector('input[data-holder]');
      dataHolder.value = this.value;
      dataHolder.dispatchEvent(new Event('change'));
    }
  },
  selectFile() {
    if (this.uploadUrl === null) return;

    if (this.initialValue === '') {
      this.initialValue = this.value;
    }

    const filePicker = this.element.querySelector('input[type="file"]');
    if (filePicker.files!.length < 1) return;

    const dataHolder = this.element.querySelector('input[data-holder]');
    this.listAttributes.output = '⏳';
    this.planRender();

    const file = filePicker.files![0];
    const formData = new FormData();
    formData.append('file', file);
    store
      .fetchAuthn(this.uploadUrl, {
        method: 'POST',
        body: formData,
      })
      .then(response => this.updateFile(dataHolder, response))
      .catch(error => {
        this.listAttributes.fileValue = '';
        this.listAttributes.output = 'upload error';
        this.planRender();
        console.error(error);
      });
  },

  updateFile(dataHolder: HTMLInputElement, response: Response) {
    const location = response.headers.get('location');
    if (location == null) {
      this.listAttributes.output = 'header location not found!';
    } else {
      this.value = location;
      this.listAttributes.output = '';
      this.listAttributes.resetButtonHidden = false;

      dataHolder.value = location;
      dataHolder.dispatchEvent(new Event('change'));

      this.planRender();
    }
  },

  resetFile(event) {
    event.preventDefault();
    this.value = '';
    const filePicker = this.element.querySelector('input[type="file"]');
    const dataHolder = this.element.querySelector('input[data-holder]');

    if (filePicker && dataHolder) {
      filePicker.value = dataHolder.value = '';
    }

    this.listAttributes.fileValue = '';
    this.listAttributes.output = '';
    this.listAttributes.resetButtonHidden = true;
    dataHolder.dispatchEvent(new Event('change'));
    this.planRender();
  },
};

export { FormFileMixin };
