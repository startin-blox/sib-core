(function() {
  class SIBForm extends SIBWidgetMixin(SIBBase) {
    get defaultWidget() {
      return 'sib-form-label-text';
    }

    //Special case of the dropdown
    getWidget(field) {
      if (
        !this.hasAttribute('widget-' + field) &&
        this.hasAttribute('range-' + field)
      )
        return 'sib-form-dropdown';
      else return super.getWidget(field);
    }
    async widgetAttributes(field) {
      let attributes = await super.widgetAttributes(field);
      if (this.hasAttribute('range-' + field))
        attributes.range = this.getAttribute('range-' + field);
      if (this.hasAttribute('label-' + field))
        attributes.label = this.getAttribute('label-' + field);
      return attributes;
    }
    
    //form submission handling
    setValue(data, namelist, value) {
      const name = namelist.shift();
      if(!(name in data)) data[name] = {};
      if(namelist.length) this.setValue(data[name], namelist, value);
      else data[name] = value;
    }
    formToObject(form) {
      return [].reduce.call(
        form.elements,
        (data, element) => {
          let value;
          try {
            value = JSON.parse(element.value);
          } catch (error) {
            value = element.value;
          }
          this.setValue(data, element.name.split(","), value);
          return data;
        },
        {},
      );
    }
    save(resource) {
      store
        .save(resource, this.resource['@id'])
        .then(() =>
          this.dispatchEvent(
            new CustomEvent('save', { detail: { resource: resource } }),
          ),
        );
    }
    change(resource) {}
    submitForm(event) {
      event.preventDefault();
      const resource = this.formToObject(this.form);
      if (!this.isContainer) resource['@id'] = this.resource['@id'];
      resource.context = this.context;
      this.save(resource);

      if (this.next)
        this.dispatchEvent(
          new CustomEvent('navigate', {
            detail: { route: this.next, resource: resource },
          }),
        );
      return false;
    }
    inputChange(event) {
      const resource = this.formToObject(this.form);
      if (!this.isContainer) resource['@id'] = this.resource['@id'];
      this.change(resource);
    }

    createInput(type) {
      const input = document.createElement('input');
      input.type = type;
      return input;
    }
    empty() {
      if (!this.form) return;
      while (this.form.firstChild) {
        this.form.removeChild(this.form.firstChild);
      }
    }
    async populate() {
      if (!this.form) {
        this.form = document.createElement('form');
        this.form.addEventListener('submit', this.submitForm.bind(this));
        this.form.addEventListener('input', this.inputChange.bind(this));
        this.form.addEventListener('reset', () =>
          setTimeout(this.inputChange.bind(this)),
        );
        this.appendChild(this.form);
      }

      for (let field of this.fields) {
        await this.appendWidget(field, this.form);
      }

      this.form.appendChild(this.createInput('submit'));
      if (this.hasAttribute('reset')) {
        this.form.appendChild(this.createInput('reset'));
      }
    }
  }

  customElements.define('sib-form', SIBForm);
})();
