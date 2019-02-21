/* Prepend hooks */
function hooks (mixin) {
  const instanceKeys = Reflect.ownKeys(mixin);

  return function (targetClass) {
    for (const property of instanceKeys) {
      let overriddenMethod = null;

      if (!!targetClass.prototype[property]) {
        overriddenMethod = targetClass.prototype[property];
      }

      Reflect.defineProperty(targetClass.prototype, property, {
        value: function (...args) {
          if (typeof mixin[property] === 'function') {
            mixin[property].apply(this, args);
          }

          if (overriddenMethod && typeof overriddenMethod === 'function') {
            overriddenMethod.apply(this, args);
          }
        },
        writable: true,
      });
  }
  return targetClass;
}
}
export default hooks;
