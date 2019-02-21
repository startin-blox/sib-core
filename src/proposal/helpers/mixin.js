import mergeAttributes from './mixin/attributes/merge.js';
import hooks from './mixin/hooks.js';
import define from './mixin/define.js';

function mixin(element, target) {
  target.mixins.forEach((mix) => {
    mixin(element, mix);
  });
  const elementAttrs = [...element.attrs];
}

function mix(element) {
  const patchedElement = element;

  const mixins = element.use;
  if (mixins) {
    for (let mixin of mixins) {
      const patchedMixin = mix(mixin);
      if (typeof mixin === 'function') {
        mergeAttributes({attrs: patchedMixin.attrs})(patchedElement);
        const { created, attached, detached } = patchedMixin.prototype;
        hooks({created, attached, detached})(patchedElement);
        define(patchedMixin.prototype)(patchedElement);
      } else {
        const { attrs, created, attached, detached, ...mix } = patchedMixin;
        mergeAttributes({attrs})(patchedElement);
        hooks({created, attached, detached})(patchedElement);
        define(mix)(patchedElement);
      }
    }
  }

  return patchedElement;
}
export default mix;
