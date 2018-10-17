class SIBFormPlaceholderText extends SIBWidget {
  get template() {
    const id = uniqID();
    return `<input id="${id}" placeholder="${this.label}" type="text" name="${
      this.name
    }" value="${this.escapedValue}">`;
  }
}
customElements.define('sib-form-placeholder-text', SIBFormPlaceholderText);

class SIBFormLabelText extends SIBWidget {
  get template() {
    const id = uniqID();
    return `<label for="${id}">${this.label}</label>
                <input id="${id}" type="text" name="${this.name}" value="${
      this.escapedValue
    }">`;
  }
}
customElements.define('sib-form-label-text', SIBFormLabelText);

class SIBFormTextArea extends SIBWidget {
  get template() {
    const id = uniqID();
    return `<label for="${id}">${this.label}</label>
                <textarea id="${id}" type="text" name="${this.name}" value="${
      this.escapedValue
    }"></textarea>`;
  }
}
customElements.define('sib-form-textarea', SIBFormTextArea);

class SIBFormCheckbox extends SIBWidget {
  get template() {
    const id = uniqID();
    const checked = this.value ? 'checked' : '';
    return `<label for="${id}">${this.label}</label>
                <input id="${id}" type="checkbox" name="${
      this.name
    }" ${checked}>`;
  }
}
customElements.define('sib-form-checkbox', SIBFormCheckbox);

class SIBFormJSON extends SIBWidget {
  get template() {
    const id = uniqID();
    return `<label for="${id}">${this.label}</label>
                <input id="${id}" type="text" name="${
      this.name
    }" value='${JSON.stringify(this.value)}'>`;
  }
}
customElements.define('sib-form-json', SIBFormJSON);

class SIBFormDropdown extends SIBMultipleWidget {
  get parentTag() {
    return 'select';
  }
  getTemplate(item, index) {
    const selected = this.value == item['@id'] ? 'selected' : '';
    return `<option value='{"@id": "${item['@id']}"}' ${selected}>${
      item.name
    }</option>`;
  }
  get values() {
    if (!this._range) return [];
    if (!Array.isArray(this._range)) return [this._range];
    return this._range;
  }
  set range(url) {
    store.list(url).then(list => {
      this._range = [{ '@id': '', name: '---' }].concat(list);
      this.renderList();
      if (this._value) this.parent.value = `{"@id": "${this._value['@id']}"}`;
    });
  }
  render() {
    super.render();
    this.parent.id = this.id;
  }
}
customElements.define('sib-form-dropdown', SIBFormDropdown);

class SIBFormMultipleValue extends SIBMultipleWidget {
  getTemplate(item, index) {
    return `<div id="id-${this.name}-${index}-box" class="${this.tagName}-box">
                <input id="id-${this.name}-${index}" class="${
      this.tagName
    }-input" type="text" value='${item['@id']}' onclick="this.closest('${
      this.tagName
    }').updateValue()">
                <button onclick="this.closest('${
                  this.tagName
                }').removeField(${index});return false">x</button>
            </div>`;
  }
  appendField() {
    const index = this.querySelectorAll(`.${this.tagName}-box`).length;
    this.parent.innerHTML += this.getTemplate({}, index);
    this.updateValue();
  }
  removeField(index) {
    document.getElementById(`id-${this.name}-${index}-box`).remove();
    this.updateValue();
  }
  get appendTemplate() {
    return `<button onclick="this.closest('${
      this.tagName
    }').appendField();return false">+</button>
                <input type="hidden" id="id-${this.name}" name="${this.name}">`;
  }
  updateValue() {
    const valueList = Array.prototype.map.call(
      this.querySelectorAll(`.${this.tagName}-input`),
      input => '{"@id": "' + input.value + '"}',
    );
    this.appendBox.querySelector('input').value =
      '[' + valueList.join(',') + ']';
  }
  render() {
    super.render();
    this.parent.id = this.id;
    this.appendBox = document.createElement('div');
    this.appendBox.innerHTML = this.appendTemplate;
    this.appendChild(this.appendBox);
    this.updateValue();
  }
}
customElements.define('sib-form-multiple-value', SIBFormMultipleValue);

class SIBFormMultipleDropdown extends SIBFormMultipleValue {
  getTemplate(item, index) {
    return `<div id="id-${this.name}-${index}-box" class="${this.tagName}-box">
                <select id="id-${this.name}-${index}" class="${
      this.tagName
    }-input" value='${item['@id']}' onclick="this.closest('${
      this.tagName
    }').updateValue()">
                ${this.optionList}
                </select>
                <button onclick="this.closest('${
                  this.tagName
                }').removeField(${index});return false">x</button>
            </div>`;
  }
  getOptionTemplate(item) {
    return `<option value='${item['@id']}'>${item.name}</option>`;
  }
  updateSelected() {
    for (let select of this.querySelectorAll('select'))
      select.value = select.getAttribute('value');
  }
  appendField() {
    super.appendField();
    this.updateSelected();
  }
  set range(url) {
    store.list(url).then(list => {
      this.optionList = list.map(item => this.getOptionTemplate(item)).join('');
      this.renderList();
      this.updateSelected();
      this.updateValue();
    });
  }
}
customElements.define('sib-form-multiple-dropdown', SIBFormMultipleDropdown);
