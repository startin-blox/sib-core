export default class {
  static get attrs() {
    return ['sib-template-selector'];
  }

  get template() {
    return '';
  }

  getTemplate() {
    const templateSelector = this.sibTemplateSelector;
    if (templateSelector) {
      return document.querySelector(templateSelector).content.cloneNode(true);
    }

    const template = document.createElement('template');
    template.innerHTML = this.template;
    return template.content;
  }

  render() {
    console.log('render from template');
    this.innerHTML = '';
    this.appendChild(this.getTemplate());
  }

  attached() {
    console.log('attached from Template');
    this.render();
  }
}
