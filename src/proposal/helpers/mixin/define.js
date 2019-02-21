/* Method define */
function define (mixin) {
  const instanceKeys = Reflect.ownKeys(mixin);
  return function (targetClass) {
    for (let property of instanceKeys) {
      if (!targetClass.prototype[property]) {
        const descriptor = Reflect.getOwnPropertyDescriptor(mixin, property);
        if (descriptor.value) {
          if (typeof descriptor.value === 'function') {
            Reflect.defineProperty(targetClass.prototype, property, {
              value: function (...args) { return descriptor.value.apply(this, args) },
              writable: true,
            });
          } else {
            Reflect.defineProperty(targetClass.prototype, property, {
              value: descriptor.value,
              writable: true,
            });
          }
        } else if (descriptor.get || descriptor.set) {
          const definition = {};

          if (descriptor.get) {
            definition.get = function () { return descriptor.get.apply(this) };
          }

          if (descriptor.set) {
            definition.set = function (value) {
              this.valueChanged(value, this[property]);
              return descriptor.set.apply(this, [value])
            };
          }

          Reflect.defineProperty(targetClass.prototype, property, {
            ...definition,
          });
        }
      }
    }
    return targetClass;
  }
}
export default define;
