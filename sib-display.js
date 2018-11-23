(function() {
  class SIBDisplay extends SIBListMixin(SIBWidgetMixin(SIBBase)) {
    get defaultWidget() {
      return 'sib-display-div';
    }

    get childTag() {
      return this.dataset.child || this.tagName;
    }

    // Here "even.target" points to the content of the widgets of the children of sib-display
    dispatchSelect(event) {
      const resource = event.target.closest(this.childTag).resource;
      this.dispatchEvent(
        new CustomEvent('resourceSelect', { detail: { resource: resource } }),
      );
      if (this.next)
        this.dispatchEvent(
          new CustomEvent('navigate', {
            detail: { route: this.next, resource: resource },
          }),
        );
    }
    appendChildElt(resource) {
      const child = document.createElement(this.childTag);
      child.resource = resource;
      child.addEventListener('click', this.dispatchSelect.bind(this));
      if (this.dataset.fields) child.dataset.fields = this.dataset.fields;

      for (let attr of this.attributes) //copy widget and value attributes
        if (
          attr.name.startsWith('value-') ||
          attr.name.startsWith('set-') ||
          attr.name.startsWith('widget-') ||
          attr.name.startsWith('template-')
        )
          child.setAttribute(attr.name, attr.value);

      this.div.appendChild(child);
    }
    async appendSingleElt() {
      for (let field of this.fields) {
        await this.appendWidget(field);
      }
    }
  }
  customElements.define('sib-display', SIBDisplay);
})();
