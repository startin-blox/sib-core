/* Merge watched attributes */
export default function (mixin) {
  return function (targetClass) {
    if (!!mixin.attrs) {
      const elementAttrs = [...targetClass.attrs];

      Reflect.defineProperty(targetClass, 'attrs', {
        get: () => [...elementAttrs, ...mixin.attrs],
      });
    }

    return targetClass;
  }
}
