import { store } from "../../libs/store/store";

const FormFileMixin = {
  name: 'form-file-mixin',
  attributes: {
    uploadUrl: {
      type: String,
      default: ''
    },
  },
  initialState: {
    initialValue: ''
  },
  created() {
    this.listAttributes['output'] = '';
    this.listAttributes['resetButtonHidden'] = true;
    this.listAttributes['selectFile'] = this.selectFile.bind(this);
    this.listAttributes['resetFile'] = this.resetFile.bind(this);
  },
  attached() {
    console.log(this.value);
    document.addEventListener('click', (e) => {
      const input = e.target as HTMLElement;
      //to reset solid-form-image value if reset button clicked || if submit button clicked and initialValue is empty (= resource creation)
      if (input !== null && ((input.parentNode?.contains(this.element) && input.getAttribute('type') == 'reset') || (input.parentNode?.parentNode?.contains(this.element) && input.getAttribute('type') == 'submit' && this.initialValue === ''))) {
        this.value = this.initialValue; 
      }
      this.listAttributes['resetButtonHidden'] = true;
      this.planRender();
    })
    //to reset solid-form-image value if solid-form has "next" attribute after submit
    document.addEventListener('reset', (e) => {
      if (e.target && (e.target as HTMLElement).contains(this.element)) {
        const solidForm = this.element.parentNode.parentNode // to get solid-form element in the DOM
        if (solidForm.getAttribute('next')) {
          this.value = this.initialValue;
        }
        this.listAttributes['resetButtonHidden'] = true;
        this.planRender();
      }
    })
  },
  selectFile() {
    if (this.uploadUrl === null) return;

    if (this.initialValue === '') {
      this.initialValue = this.value;
    }

    const filePicker = this.element.querySelector('input[type="file"]');
    if (filePicker.files!.length < 1) return;

    this.listAttributes['output'] = '⏳';
    this.planRender();

    const file = filePicker.files![0];
    const formData = new FormData();
    formData.append('file', file);
    store.fetchAuthn(this.uploadUrl, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        const location = response.headers.get('location');
        if (location == null) {
          this.listAttributes['output'] = 'header location not found!';
        } else {
          this.value = location;
          this.listAttributes['output'] = '';
          this.listAttributes['resetButtonHidden'] = false;
          this.planRender();
        }
      })
      .catch(error => {
        this.listAttributes['fileValue'] = '';
        this.listAttributes['output'] = 'upload error';
        this.planRender();
        console.error(error);
      });
  },
  resetFile(event) {
    event.preventDefault();
    this.value = '';
    const filePicker = this.element.querySelector('input[type="file"]');
    if (filePicker) filePicker.value = '';
    this.listAttributes['fileValue'] = '';
    this.listAttributes['output'] = '';
    this.listAttributes['resetButtonHidden'] = true;
    // this.input.dispatchEvent(new Event('change'));
    this.planRender();
  }
}

export {
  FormFileMixin
}