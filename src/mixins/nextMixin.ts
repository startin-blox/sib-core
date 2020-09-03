import { Resource } from "./interfaces.js";

const NextMixin = {
  name: 'next-mixin',
  use: [],
  attributes: {
    next: {
      type: String,
      default:''
    },
  },

  // Here "even.target" points to the content of the widgets of the children of solid-display
  goToNext(resource: Resource): void {
    if (this.next) {
      this.element.dispatchEvent(
        new CustomEvent('requestNavigation', {
          bubbles: true,
          detail: { route: this.next, resource: resource },
        }),
      );
    }
  }
}

export {
  NextMixin
}