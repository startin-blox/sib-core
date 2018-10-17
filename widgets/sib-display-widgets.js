class SIBDisplayDiv extends SIBWidget {
  get template() {
    return `<div name="${this.name}">${this.value}</div>`;
  }
}
customElements.define('sib-display-div', SIBDisplayDiv);

class SIBDisplayImg extends SIBWidget {
  get template() {
    return `<img name="${this.name}" src="${
      this.value
    }" style="max-width: 100%; max-height: 100%;"/>`;
  }
}
customElements.define('sib-display-img', SIBDisplayImg);

class SIBDisplayList extends SIBMultipleWidget {
  get parentTag() {
    return 'ul';
  }
  getTemplate(value, index) {
    return `<li name="${this.name}-${index}">${value}</li>`;
  }
}
customElements.define('sib-display-list', SIBDisplayList);

class SIBDisplayLookupList extends SIBDisplayList {
  getTemplate(value, index) {
    if (typeof value == 'object' && !('ldp:contains' in value))
      if (value.name) value = value.name;
      else {
        store.get(value).then(resource => {
          this.value.push(resource);
          this.render();
        });
        if (Array.isArray(this.value))
          this.value.splice(this.value.indexOf(value), 1);
        else this.value = [];
        return '';
      }
    return super.getTemplate(value, index);
  }
}
customElements.define('sib-display-lookuplist', SIBDisplayLookupList);

class SIBDisplayMailTo extends SIBWidget {
  get template() {
    return `<a href="mailto:${this.value}" name="${this.name}">${
      this.value
    }</a>`;
  }
}
customElements.define('sib-display-mailto', SIBDisplayMailTo);

class SIBDisplayTel extends SIBWidget {
  get template() {
    return `<a href="tel:${this.value}" name="${this.name}">${this.value}</a>`;
  }
}
customElements.define('sib-display-tel', SIBDisplayTel);
