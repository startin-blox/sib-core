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
    document.addEventListener('click', async (e) => {
      const solidForm = this.element.parentNode.parentNode; //solid-form with solid-form-file/image
      const formValue = await solidForm.component.getFormValue(); //to get modificated values

      //if reset button clicked
      if ((e.target as HTMLElement).getAttribute('type') === 'reset' && solidForm.contains(e.target)) {
        console.log(this.value);
        console.log(this.initialValue);

        //if edition form and value or if creation form
        if ((!solidForm.component.isCreationForm(formValue) && this.initialValue !== '') || solidForm.component.isCreationForm(formValue)) this.value = this.initialValue;
        //if edition form and no value
        else if (!solidForm.component.isCreationForm(formValue) && (this.initialValue === '')) this.value = this.initialValue = '';
        this.listAttributes['resetButtonHidden'] = true;
        this.planRender();
      }
      // if submit button clicked
      if ((e.target as HTMLElement).getAttribute('type') === 'submit' && solidForm.contains(e.target)) {
        if (solidForm.getAttribute('next') || solidForm.component.isCreationForm(formValue)) {
          this.value = this.initialValue;
          this.initialValue = '';
        }
        if (!solidForm.component.isCreationForm(formValue)) {
          this.initialValue = this.value;
        }
        this.listAttributes['resetButtonHidden'] = true;
        this.planRender();
      };
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