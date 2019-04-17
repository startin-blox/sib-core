export class Component {
  public element: HTMLElement;
  public attributesList: string[] = [];
  public requiredAttributesList: string[] = [];

  constructor(element: HTMLElement, attributesList: string[], requiredAttributesList: string[]) {
    this.element = element;
    this.attributesList = attributesList;
    this.requiredAttributesList = requiredAttributesList;
  }

  // move to Element ?
  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  // move to Element ?
  initializeAttributes() {
    this.attributesList
      .map(attr => ({ attr, key: attr.replace(/([a-z0-9])_([a-z0-9])/g, (_c, p1, p2) => `${p1}${p2.toUpperCase()}`)}))
      .forEach(({ attr, key }) => {
        this[key] = this.element.getAttribute(attr);
      });
  }
}
