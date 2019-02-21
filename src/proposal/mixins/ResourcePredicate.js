export default class {
  attached() {
    console.log('attached from ResourcePredicate');

    this.querySelectorAll('[sib-value]').forEach((domElement) => {
      const propName = domElement.getAttribute('sib-value');

      this.addWatcher(propName, (newValue, oldValue) => {
        domElement.textContent = newValue;
      });

      domElement.textContent = this.getAttribute(propName);
    });
  }
}
