import caseSwitch from '../../caseSwitch.js';

/* Bind attributes */
export default function(targetClass) {
  const attributes = targetClass.attrs;

  const normalizedAttributes = attributes.map(function(item) {
    return item.toLowerCase();
  })

  Reflect.defineProperty(targetClass, 'attrs', {
    get() {
      return normalizedAttributes;
    },
  });

  for (let attr of normalizedAttributes) {
    Reflect.defineProperty(targetClass.prototype, caseSwitch(attr), {
      get() {
        return this.getAttribute(attr);
      },
      set(value) {
        if (value === true || value === false) {
          this.toggleAttribute(attr, value);
        } else {
          this.setAttribute(attr, value);
        }
      }
    });
    // TODO type casting
  }
}
